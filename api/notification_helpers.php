<?php
/**
 * Shared notification helpers for student and supervisor in-app notifications.
 */

/** Typical industrial attachment length (weeks) for reminder cap. */
const IASMS_ELOGBOOK_MAX_ATTACHMENT_WEEKS = 24;

function iasms_ensure_student_notifications_table(mysqli $conn): void
{
    $create = "CREATE TABLE IF NOT EXISTS student_notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        recipient_index_number VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        week_number INT(11) NULL,
        supervisor_name VARCHAR(255) NULL,
        elogbook_entry_id INT(11) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        INDEX idx_recipient (recipient_index_number),
        INDEX idx_recipient_read (recipient_index_number, read_at),
        INDEX idx_recipient_type_week (recipient_index_number, type, week_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    @mysqli_query($conn, $create);
}

function iasms_ensure_supervisor_notifications_table(mysqli $conn): void
{
    $create = "CREATE TABLE IF NOT EXISTS supervisor_notifications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        recipient_lecturer_id INT(11) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        student_index_number VARCHAR(100) NULL,
        student_name VARCHAR(255) NULL,
        contract_id INT(11) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        INDEX idx_recipient (recipient_lecturer_id),
        INDEX idx_recipient_read (recipient_lecturer_id, read_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    @mysqli_query($conn, $create);
}

/**
 * Resolve institutional supervisor lecturer IDs for a student.
 *
 * @return int[]
 */
function iasms_get_lecturer_ids_for_student(mysqli $conn, string $index_number): array
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return [];
    }

    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    // Direct per-student assignment overrides grid assignment.
    $direct = @mysqli_query(
        $conn,
        "SELECT lecturer_id FROM student_supervisor_assignments WHERE index_number='$idx_esc' LIMIT 1"
    );
    if ($direct && mysqli_num_rows($direct) === 1) {
        $row = mysqli_fetch_assoc($direct);
        $lid = (int)($row['lecturer_id'] ?? 0);
        return $lid > 0 ? [$lid] : [];
    }

    $q = "SELECT i.faculty,
                 COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS region
          FROM industrial_registration i
          LEFT JOIN students_assumption sa ON sa.index_number = i.index_number
          WHERE i.index_number='$idx_esc'
          LIMIT 1";
    $r = mysqli_query($conn, $q);
    if (!$r || mysqli_num_rows($r) !== 1) {
        return [];
    }

    $row = mysqli_fetch_assoc($r);
    $faculty = strtoupper(trim((string)($row['faculty'] ?? '')));
    $region = trim((string)($row['region'] ?? ''));
    if ($region === '') {
        return [];
    }

    $faculty_db_map = [
        'AGR' => ['AGR'],
        'ARTS' => ['ARTS'],
        'COM' => ['COM', 'FAST'],
        'CIE' => ['CIE'],
        'EDU' => ['EDU'],
        'ENG' => ['ENG', 'FOE'],
        'LAW' => ['LAW'],
        'MED' => ['MED'],
        'SCI' => ['SCI', 'FBNE'],
        'SOC' => ['SOC', 'FBMS'],
        'VET' => ['VET', 'FHAS'],
    ];

    $fac_key = '';
    foreach ($faculty_db_map as $canonical => $list) {
        if ($faculty !== '' && in_array($faculty, $list, true)) {
            $fac_key = strtolower($canonical);
            break;
        }
    }

    $allowed_fac_keys = ['agr', 'arts', 'com', 'cie', 'edu', 'eng', 'law', 'med', 'sci', 'soc', 'vet'];
    if ($fac_key === '' || !in_array($fac_key, $allowed_fac_keys, true)) {
        return [];
    }

    $region_esc = mysqli_real_escape_string($conn, $region);
    $col_first = 'first_supervisor_' . $fac_key;
    $col_second = 'second_supervisor_' . $fac_key;

    $q3 = "SELECT $col_first AS first_name, $col_second AS second_name
           FROM assigned_lecturers
           WHERE regions='$region_esc'
           LIMIT 1";
    $r3 = mysqli_query($conn, $q3);
    if (!$r3 || mysqli_num_rows($r3) !== 1) {
        return [];
    }

    $row3 = mysqli_fetch_assoc($r3);
    $names = [
        trim((string)($row3['first_name'] ?? '')),
        trim((string)($row3['second_name'] ?? '')),
    ];

    $ids = [];
    foreach ($names as $name) {
        if ($name === '') {
            continue;
        }
        $name_esc = mysqli_real_escape_string($conn, $name);
        $lr = @mysqli_query(
            $conn,
            "SELECT id FROM visiting_lecturers WHERE BINARY lecturer_name='$name_esc' LIMIT 1"
        );
        if ($lr && mysqli_num_rows($lr) === 1) {
            $lid = (int)(mysqli_fetch_assoc($lr)['id'] ?? 0);
            if ($lid > 0) {
                $ids[$lid] = true;
            }
        }
    }

    return array_keys($ids);
}

/**
 * Notify assigned institutional supervisor(s) that a student submitted a contract.
 */
function iasms_notify_supervisors_contract_submitted(
    mysqli $conn,
    string $index_number,
    string $student_name,
    ?int $contract_id = null
): void {
    iasms_ensure_supervisor_notifications_table($conn);

    $lecturer_ids = iasms_get_lecturer_ids_for_student($conn, $index_number);
    if (count($lecturer_ids) === 0) {
        return;
    }

    $title = 'New contract submitted';
    $message = trim($student_name) !== ''
        ? $student_name . ' (' . $index_number . ') submitted an industrial attachment contract for your review.'
        : 'Student ' . $index_number . ' submitted an industrial attachment contract for your review.';

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $name_esc = mysqli_real_escape_string($conn, $student_name);
    $contract_sql = $contract_id !== null && $contract_id > 0 ? (string)(int)$contract_id : 'NULL';

    foreach ($lecturer_ids as $lecturer_id) {
        $lid = (int)$lecturer_id;
        if ($lid <= 0) {
            continue;
        }
        $ins = "INSERT INTO supervisor_notifications
                    (recipient_lecturer_id, type, title, message, student_index_number, student_name, contract_id)
                VALUES
                    ($lid, 'contract_submitted', '$title_esc', '$message_esc', '$idx_esc', '$name_esc', $contract_sql)";
        @mysqli_query($conn, $ins);
    }
}

/**
 * Attachment start date for e-logbook week calculation (assumption date, else registration date).
 */
function iasms_student_attachment_start_timestamp(mysqli $conn, string $index_number): ?int
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return null;
    }
    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    $assumption = @mysqli_query(
        $conn,
        "SELECT `date` AS started_at FROM students_assumption WHERE index_number='$idx_esc' LIMIT 1"
    );
    if ($assumption && mysqli_num_rows($assumption) === 1) {
        $row = mysqli_fetch_assoc($assumption);
        $ts = strtotime((string)($row['started_at'] ?? ''));
        if ($ts !== false) {
            return $ts;
        }
    }

    $reg = @mysqli_query(
        $conn,
        "SELECT `date` AS started_at FROM industrial_registration WHERE index_number='$idx_esc' LIMIT 1"
    );
    if ($reg && mysqli_num_rows($reg) === 1) {
        $row = mysqli_fetch_assoc($reg);
        $ts = strtotime((string)($row['started_at'] ?? ''));
        if ($ts !== false) {
            return $ts;
        }
    }

    return null;
}

/**
 * Current attachment week number (1-based) from start date; 0 if not on attachment yet.
 */
function iasms_student_expected_elogbook_week(mysqli $conn, string $index_number): int
{
    $startTs = iasms_student_attachment_start_timestamp($conn, $index_number);
    if ($startTs === null) {
        return 0;
    }

    $days = (int)floor((time() - $startTs) / 86400);
    if ($days < 0) {
        return 0;
    }

    $week = (int)floor($days / 7) + 1;
    if ($week < 1) {
        return 0;
    }

    return min($week, IASMS_ELOGBOOK_MAX_ATTACHMENT_WEEKS);
}

function iasms_student_has_elogbook_week(mysqli $conn, string $index_number, int $week_number): bool
{
    if ($week_number < 1) {
        return true;
    }
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $res = mysqli_query(
        $conn,
        "SELECT 1 FROM elogbook_entries WHERE index_number='$idx_esc' AND week_number=$week_number LIMIT 1"
    );
    return $res && mysqli_num_rows($res) > 0;
}

/**
 * Create in-app reminders for weeks without a logbook submission.
 * Past weeks: one reminder per week. Current week: repeat if none sent in the last 7 days.
 */
function iasms_ensure_elogbook_missing_reminders(mysqli $conn, string $index_number): void
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return;
    }

    iasms_ensure_student_notifications_table($conn);

    $expected_week = iasms_student_expected_elogbook_week($conn, $index_number);
    if ($expected_week < 1) {
        return;
    }

    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    for ($week = 1; $week <= $expected_week; $week++) {
        if (iasms_student_has_elogbook_week($conn, $index_number, $week)) {
            continue;
        }

        $is_current_week = ($week === $expected_week);
        if ($is_current_week) {
            $dup = mysqli_query(
                $conn,
                "SELECT 1 FROM student_notifications
                 WHERE recipient_index_number='$idx_esc'
                   AND type='elogbook_missing_week'
                   AND week_number=$week
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 LIMIT 1"
            );
        } else {
            $dup = mysqli_query(
                $conn,
                "SELECT 1 FROM student_notifications
                 WHERE recipient_index_number='$idx_esc'
                   AND type='elogbook_missing_week'
                   AND week_number=$week
                 LIMIT 1"
            );
        }
        if ($dup && mysqli_num_rows($dup) > 0) {
            continue;
        }

        $title = 'E-logbook reminder: Week ' . (string)$week;
        $message = $is_current_week
            ? 'You have not submitted your e-logbook for this week yet. Please open the E-Logbook page and save your entry.'
            : 'You have not submitted your e-logbook for Week ' . (string)$week . '. Please complete and save that week\'s entry.';

        $title_esc = mysqli_real_escape_string($conn, $title);
        $message_esc = mysqli_real_escape_string($conn, $message);

        @mysqli_query(
            $conn,
            "INSERT INTO student_notifications
                (recipient_index_number, type, title, message, week_number)
             VALUES
                ('$idx_esc', 'elogbook_missing_week', '$title_esc', '$message_esc', $week)"
        );
    }
}

/**
 * Notify a student that their contract was rejected (in-app).
 */
function iasms_notify_student_contract_rejected(mysqli $conn, string $index_number, string $reason): void
{
    $index_number = trim($index_number);
    $reason = trim($reason);
    if ($index_number === '' || $reason === '') {
        return;
    }

    iasms_ensure_student_notifications_table($conn);

    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $title = 'Contract rejected';
    $message = 'Your industrial attachment contract was rejected. Reason: ' . $reason;
    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);

    @mysqli_query(
        $conn,
        "INSERT INTO student_notifications
            (recipient_index_number, type, title, message)
         VALUES
            ('$idx_esc', 'contract_rejected', '$title_esc', '$message_esc')"
    );
}
