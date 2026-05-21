<?php
/**
 * Visit scheduling: supervisor availability and student day selections.
 */

require_once __DIR__ . '/notification_helpers.php';

function iasms_ensure_visit_schedule_tables(mysqli $conn): void
{
    @mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS supervisor_visit_availability (
            id INT(11) NOT NULL AUTO_INCREMENT,
            lecturer_id INT(11) NOT NULL,
            visit_date DATE NOT NULL,
            published_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_lecturer_date (lecturer_id, visit_date),
            INDEX idx_lecturer (lecturer_id),
            INDEX idx_visit_date (visit_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1"
    );

    @mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS student_visit_selections (
            id INT(11) NOT NULL AUTO_INCREMENT,
            availability_id INT(11) NOT NULL,
            student_index_number VARCHAR(100) NOT NULL,
            visit_date DATE NOT NULL,
            selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_student_availability (student_index_number, availability_id),
            INDEX idx_availability (availability_id),
            INDEX idx_student (student_index_number),
            INDEX idx_visit_date (visit_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1"
    );
}

/**
 * @return int[]
 */
function iasms_visit_schedule_normalize_dates(array $dates): array
{
    $out = [];
    foreach ($dates as $d) {
        $d = trim((string)$d);
        if ($d === '') {
            continue;
        }
        $ts = strtotime($d);
        if ($ts === false) {
            continue;
        }
        $key = date('Y-m-d', $ts);
        $out[$key] = true;
    }
    ksort($out);
    return array_keys($out);
}

function iasms_visit_schedule_supervisor_lecturer_id(): int
{
    return (int)($_SESSION['user_id'] ?? 0);
}

/**
 * Notify assigned students that visit dates are open for booking.
 */
function iasms_notify_students_visit_schedule_published(
    mysqli $conn,
    int $lecturer_id,
    string $supervisor_name,
    array $dates
): void {
    if ($lecturer_id <= 0 || count($dates) === 0) {
        return;
    }

    iasms_ensure_student_notifications_table($conn);

    $indexes = iasms_visit_schedule_student_indexes_for_lecturer($conn, $lecturer_id);
    if (count($indexes) === 0) {
        return;
    }

    $dateList = implode(', ', array_map(static function (string $d): string {
        return date('j M Y', strtotime($d));
    }, $dates));

    $title = 'Supervisor visit dates available';
    $message = trim($supervisor_name) !== ''
        ? $supervisor_name . ' shared visit days: ' . $dateList . '. Open Visit schedule to pick your preferred day(s).'
        : 'Your supervisor shared visit days: ' . $dateList . '. Open Visit schedule to pick your preferred day(s).';

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $sup_esc = mysqli_real_escape_string($conn, $supervisor_name);

    foreach ($indexes as $index_number) {
        $idx_esc = mysqli_real_escape_string($conn, $index_number);
        @mysqli_query(
            $conn,
            "INSERT INTO student_notifications
                (recipient_index_number, type, title, message, supervisor_name)
             VALUES
                ('$idx_esc', 'visit_schedule_available', '$title_esc', '$message_esc', '$sup_esc')"
        );
    }
}

/**
 * Notify supervisor when a student confirms visit day(s).
 */
function iasms_notify_supervisor_visit_selection(
    mysqli $conn,
    int $lecturer_id,
    string $student_index,
    string $student_name,
    array $dates
): void {
    if ($lecturer_id <= 0 || count($dates) === 0) {
        return;
    }

    iasms_ensure_supervisor_notifications_table($conn);

    $dateList = implode(', ', array_map(static function (string $d): string {
        return date('j M Y', strtotime($d));
    }, $dates));

    $title = 'Student selected visit day(s)';
    $message = trim($student_name) !== ''
        ? $student_name . ' (' . $student_index . ') chose: ' . $dateList
        : 'Student ' . $student_index . ' chose: ' . $dateList;

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $idx_esc = mysqli_real_escape_string($conn, $student_index);
    $name_esc = mysqli_real_escape_string($conn, $student_name);

    @mysqli_query(
        $conn,
        "INSERT INTO supervisor_notifications
            (recipient_lecturer_id, type, title, message, student_index_number, student_name)
         VALUES
            ($lecturer_id, 'visit_schedule_selection', '$title_esc', '$message_esc', '$idx_esc', '$name_esc')"
    );
}

/**
 * Student index numbers assigned to a lecturer (direct + grid).
 *
 * @return string[]
 */
function iasms_visit_schedule_student_indexes_for_lecturer(mysqli $conn, int $lecturer_id): array
{
    if ($lecturer_id <= 0) {
        return [];
    }

    $name = '';
    $lr = @mysqli_query(
        $conn,
        "SELECT lecturer_name FROM visiting_lecturers WHERE id=$lecturer_id LIMIT 1"
    );
    if ($lr && mysqli_num_rows($lr) === 1) {
        $name = trim((string)(mysqli_fetch_assoc($lr)['lecturer_name'] ?? ''));
    }
    if ($name === '') {
        return [];
    }

    require_once __DIR__ . '/supervisor_shared.php';
    [$students] = iasms_get_supervisor_students_and_summary($conn, (string)$lecturer_id, $name);

    $indexes = [];
    foreach ($students as $row) {
        $idx = trim((string)($row['student_index'] ?? ''));
        if ($idx !== '') {
            $indexes[$idx] = true;
        }
    }

    return array_keys($indexes);
}

/**
 * Resolve primary lecturer_id for a student (matches student_supervisor.php).
 */
function iasms_visit_schedule_lecturer_id_for_student(mysqli $conn, string $index_number): int
{
    $ids = iasms_get_lecturer_ids_for_student($conn, $index_number);
    if (count($ids) > 0) {
        return (int)$ids[0];
    }
    return 0;
}
