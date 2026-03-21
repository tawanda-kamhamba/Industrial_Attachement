<?php
require_once __DIR__ . '/supervisor_shared.php';

/**
 * Get list of assigned student index_numbers for current supervisor session.
 *
 * @param mysqli $conn
 * @return string[] index numbers
 */
function iasms_get_assigned_indexes_for_current_supervisor(mysqli $conn): array
{
    if (($_SESSION['role'] ?? '') !== 'supervisor') {
        return [];
    }
    $supervisorId = (string)($_SESSION['user_id'] ?? '');
    $supervisorName = (string)($_SESSION['name'] ?? '');
    [, $summary] = [null, null];
    [$students, $summary] = iasms_get_supervisor_students_and_summary($conn, $supervisorId, $supervisorName);
    $indexes = [];
    foreach ($students as $row) {
        $idx = $row['student_index'] ?? '';
        if ($idx !== '') {
            $indexes[$idx] = true;
        }
    }
    return array_keys($indexes);
}

/**
 * Whether the current supervisor session may access a student by index_number.
 * Uses grid assignment list plus direct student_supervisor_assignments fallbacks.
 */
function iasms_supervisor_can_access_student_index(mysqli $conn, string $index_number): bool
{
    if (($_SESSION['role'] ?? '') !== 'supervisor') {
        return false;
    }
    $index_number = trim($index_number);
    if ($index_number === '') {
        return false;
    }
    $assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
    if (in_array($index_number, $assigned, true)) {
        return true;
    }
    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $sid = (int)($_SESSION['user_id'] ?? 0);
    $staff_id = (string)($_SESSION['staff_id'] ?? '');
    $name_esc = mysqli_real_escape_string($conn, (string)($_SESSION['name'] ?? ''));

    if ($sid > 0) {
        $directRes = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments
             WHERE index_number='$idx_esc'
               AND lecturer_id=$sid
             LIMIT 1"
        );
        if ($directRes && mysqli_num_rows($directRes) > 0) {
            return true;
        }
    }
    if ($name_esc !== '') {
        $directRes2 = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments ssa
             JOIN visiting_lecturers vl ON vl.id = ssa.lecturer_id
             WHERE ssa.index_number='$idx_esc'
               AND BINARY vl.lecturer_name='$name_esc'
             LIMIT 1"
        );
        if ($directRes2 && mysqli_num_rows($directRes2) > 0) {
            return true;
        }
    }
    if ($staff_id !== '') {
        $staffEsc = mysqli_real_escape_string($conn, $staff_id);
        $directRes3 = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments
             WHERE index_number='$idx_esc'
               AND lecturer_id='$staffEsc'
             LIMIT 1"
        );
        if ($directRes3 && mysqli_num_rows($directRes3) > 0) {
            return true;
        }
    }
    return false;
}

