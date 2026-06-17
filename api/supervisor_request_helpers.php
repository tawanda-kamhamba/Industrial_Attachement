<?php
/**
 * Supervisor assignment request helpers (student → supervisor, approve/reject).
 */

require_once __DIR__ . '/notification_helpers.php';

function iasms_ensure_supervisor_assignment_requests_table(mysqli $conn): void
{
    $sql = "CREATE TABLE IF NOT EXISTS supervisor_assignment_requests (
        id INT(11) NOT NULL AUTO_INCREMENT,
        student_index_number VARCHAR(100) NOT NULL,
        lecturer_id INT(11) NOT NULL,
        student_message TEXT NULL,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        response_reason TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        INDEX idx_student (student_index_number),
        INDEX idx_lecturer_status (lecturer_id, status),
        INDEX idx_student_status (student_index_number, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1";
    @mysqli_query($conn, $sql);
}

/** Whether the student has a direct per-student supervisor assignment. */
function iasms_student_has_direct_supervisor_assignment(mysqli $conn, string $index_number): bool
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return false;
    }
    iasms_ensure_supervisor_assignment_requests_table($conn);
    @mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS student_supervisor_assignments (
            index_number VARCHAR(64) NOT NULL PRIMARY KEY,
            lecturer_id INT NOT NULL,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"
    );
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $r = @mysqli_query(
        $conn,
        "SELECT 1 FROM student_supervisor_assignments WHERE index_number='$idx_esc' LIMIT 1"
    );
    return $r && mysqli_num_rows($r) > 0;
}

/**
 * Student may request a supervisor when registered, assumption submitted, no direct assignment, no pending request.
 *
 * @return array{can_request:bool, reason?:string}
 */
function iasms_student_can_request_supervisor(mysqli $conn, string $index_number): array
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return ['can_request' => false, 'reason' => 'Invalid session'];
    }

    if (iasms_student_has_direct_supervisor_assignment($conn, $index_number)) {
        return ['can_request' => false, 'reason' => 'You already have an assigned institutional supervisor.'];
    }

    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $reg = @mysqli_query(
        $conn,
        "SELECT 1 FROM industrial_registration WHERE index_number='$idx_esc' LIMIT 1"
    );
    if (!$reg || mysqli_num_rows($reg) !== 1) {
        return ['can_request' => false, 'reason' => 'Complete industrial registration before requesting a supervisor.'];
    }

    $asm = @mysqli_query(
        $conn,
        "SELECT 1 FROM students_assumption WHERE index_number='$idx_esc' LIMIT 1"
    );
    if (!$asm || mysqli_num_rows($asm) !== 1) {
        return ['can_request' => false, 'reason' => 'Submit your assumption of duty before requesting a supervisor.'];
    }

    iasms_ensure_supervisor_assignment_requests_table($conn);
    $pending = @mysqli_query(
        $conn,
        "SELECT id FROM supervisor_assignment_requests
         WHERE student_index_number='$idx_esc' AND status='pending'
         LIMIT 1"
    );
    if ($pending && mysqli_num_rows($pending) > 0) {
        return ['can_request' => false, 'reason' => 'You already have a pending request. Wait for the supervisor to respond.'];
    }

    return ['can_request' => true];
}

/**
 * @return array<string, mixed>|null
 */
function iasms_get_student_request_preview(mysqli $conn, string $index_number): ?array
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return null;
    }
    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    $reg = null;
    $rq = "SELECT first_name, last_name, other_name, index_number, programme, level, `session`, faculty,
                  attachment_region, date AS registration_date
           FROM industrial_registration WHERE index_number='$idx_esc' LIMIT 1";
    $rr = mysqli_query($conn, $rq);
    if ($rr && mysqli_num_rows($rr) === 1) {
        $reg = mysqli_fetch_assoc($rr);
    }

    $assump = null;
    $aq = "SELECT company_name, supervisor_name, supervisor_contact, supervisor_email,
                  company_region, company_address, `date` AS assumption_date
           FROM students_assumption WHERE index_number='$idx_esc' LIMIT 1";
    $ar = mysqli_query($conn, $aq);
    if ($ar && mysqli_num_rows($ar) === 1) {
        $assump = mysqli_fetch_assoc($ar);
    }

    $name = '';
    if ($reg) {
        $name = trim(
            ($reg['first_name'] ?? '') . ' ' .
            ($reg['last_name'] ?? '') . ' ' .
            ($reg['other_name'] ?? '')
        );
    }

    return [
        'index_number' => $index_number,
        'student_name' => trim($name) !== '' ? trim($name) : $index_number,
        'registration' => $reg,
        'assumption' => $assump,
    ];
}

function iasms_notify_supervisor_assignment_request(
    mysqli $conn,
    int $lecturer_id,
    string $index_number,
    string $student_name,
    int $request_id
): void {
    iasms_ensure_supervisor_notifications_table($conn);

    $title = 'Supervisor assignment request';
    $message = trim($student_name) !== ''
        ? $student_name . ' (' . $index_number . ') requested you as their institutional supervisor.'
        : 'Student ' . $index_number . ' requested you as their institutional supervisor.';

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $name_esc = mysqli_real_escape_string($conn, $student_name);
    $rid = (int)$request_id;

    @mysqli_query(
        $conn,
        "INSERT INTO supervisor_notifications
            (recipient_lecturer_id, type, title, message, student_index_number, student_name, contract_id)
         VALUES
            ($lecturer_id, 'supervisor_assignment_request', '$title_esc', '$message_esc', '$idx_esc', '$name_esc', $rid)"
    );
}

function iasms_notify_student_assignment_request_resolved(
    mysqli $conn,
    string $index_number,
    bool $approved,
    string $supervisor_name,
    string $reason = ''
): void {
    iasms_ensure_student_notifications_table($conn);

    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    if ($approved) {
        $title = 'Supervisor request approved';
        $message = 'Your request was approved. ' . $supervisor_name . ' is now your institutional supervisor.';
        $type = 'supervisor_request_approved';
    } else {
        $title = 'Supervisor request declined';
        $message = 'Your request to ' . $supervisor_name . ' was declined.';
        if (trim($reason) !== '') {
            $message .= ' Reason: ' . trim($reason);
        }
        $type = 'supervisor_request_rejected';
    }

    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);
    $type_esc = mysqli_real_escape_string($conn, $type);
    $sup_esc = mysqli_real_escape_string($conn, $supervisor_name);

    @mysqli_query(
        $conn,
        "INSERT INTO student_notifications
            (recipient_index_number, type, title, message, supervisor_name)
         VALUES
            ('$idx_esc', '$type_esc', '$title_esc', '$message_esc', '$sup_esc')"
    );
}

function iasms_assign_student_to_supervisor(mysqli $conn, string $index_number, int $lecturer_id): bool
{
    $index_number = trim($index_number);
    if ($index_number === '' || $lecturer_id <= 0) {
        return false;
    }
    @mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS student_supervisor_assignments (
            index_number VARCHAR(64) NOT NULL PRIMARY KEY,
            lecturer_id INT NOT NULL,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"
    );
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $sql = "INSERT INTO student_supervisor_assignments (index_number, lecturer_id)
            VALUES ('$idx_esc', $lecturer_id)
            ON DUPLICATE KEY UPDATE lecturer_id = VALUES(lecturer_id), assigned_at = CURRENT_TIMESTAMP";
    return (bool)@mysqli_query($conn, $sql);
}
