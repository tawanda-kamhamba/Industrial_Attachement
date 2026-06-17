<?php
/**
 * Student issue reports to assigned institutional supervisor(s).
 */

require_once __DIR__ . '/notification_helpers.php';

function iasms_ensure_student_supervisor_issue_reports_table(mysqli $conn): void
{
    $sql = "CREATE TABLE IF NOT EXISTS student_supervisor_issue_reports (
        id INT(11) NOT NULL AUTO_INCREMENT,
        student_index_number VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        issue_message TEXT NOT NULL,
        status ENUM('open','acknowledged') NOT NULL DEFAULT 'open',
        acknowledged_by_lecturer_id INT(11) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        INDEX idx_student (student_index_number),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    @mysqli_query($conn, $sql);
}

/** @return int[] */
function iasms_get_assigned_supervisor_ids_for_student(mysqli $conn, string $index_number): array
{
    return iasms_get_lecturer_ids_for_student($conn, $index_number);
}

function iasms_student_has_assigned_supervisor(mysqli $conn, string $index_number): bool
{
    return count(iasms_get_assigned_supervisor_ids_for_student($conn, $index_number)) > 0;
}

function iasms_get_student_display_name(mysqli $conn, string $index_number): string
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return '';
    }
    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    $r = @mysqli_query(
        $conn,
        "SELECT first_name, last_name, other_name FROM industrial_registration WHERE index_number='$idx_esc' LIMIT 1"
    );
    if ($r && mysqli_num_rows($r) === 1) {
        $row = mysqli_fetch_assoc($r);
        $name = trim(
            ($row['first_name'] ?? '') . ' ' .
            ($row['last_name'] ?? '') . ' ' .
            ($row['other_name'] ?? '')
        );
        if ($name !== '') {
            return $name;
        }
    }

    $r2 = @mysqli_query(
        $conn,
        "SELECT first_name, last_name FROM registered_students WHERE index_number='$idx_esc' LIMIT 1"
    );
    if ($r2 && mysqli_num_rows($r2) === 1) {
        $row = mysqli_fetch_assoc($r2);
        return trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
    }

    return $index_number;
}

function iasms_notify_supervisors_student_issue(
    mysqli $conn,
    string $index_number,
    string $student_name,
    int $issue_id,
    string $category
): void {
    iasms_ensure_supervisor_notifications_table($conn);

    $lecturer_ids = iasms_get_assigned_supervisor_ids_for_student($conn, $index_number);
    if (count($lecturer_ids) === 0) {
        return;
    }

    $cat_label = $category !== '' ? ucfirst(str_replace('_', ' ', $category)) : 'General';
    $title = 'Student issue reported';
    $message = trim($student_name) !== ''
        ? $student_name . ' (' . $index_number . ') reported an issue (' . $cat_label . '). Open Student issues to review.'
        : 'Student ' . $index_number . ' reported an issue (' . $cat_label . ').';

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $name_esc = mysqli_real_escape_string($conn, $student_name);
    $issue_sql = (int)$issue_id;

    foreach ($lecturer_ids as $lecturer_id) {
        $lid = (int)$lecturer_id;
        if ($lid <= 0) {
            continue;
        }
        @mysqli_query(
            $conn,
            "INSERT INTO supervisor_notifications
                (recipient_lecturer_id, type, title, message, student_index_number, student_name, contract_id)
             VALUES
                ($lid, 'student_issue_reported', '$title_esc', '$message_esc', '$idx_esc', '$name_esc', $issue_sql)"
        );
    }
}
