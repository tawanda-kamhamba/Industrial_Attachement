<?php
require_once __DIR__ . '/supervisor_helpers.php';

// Supervisor posts a comment on one of the student's submitted e-logbook weeks.

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

// Ensure supervisor comment columns exist on elogbook_entries.
$cols = [
    'supervisor_comment' => 'LONGTEXT NULL',
    'supervisor_commenter' => 'VARCHAR(255) NULL',
    'supervisor_commented_at' => 'TIMESTAMP NULL DEFAULT NULL',
];
foreach ($cols as $col => $type) {
    $check = @mysqli_query($conn, "SHOW COLUMNS FROM elogbook_entries LIKE '" . mysqli_real_escape_string($conn, $col) . "'");
    if (!$check || mysqli_num_rows($check) === 0) {
        @mysqli_query($conn, "ALTER TABLE elogbook_entries ADD COLUMN $col $type");
    }
}

require_once __DIR__ . '/notification_helpers.php';
iasms_ensure_student_notifications_table($conn);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$entry_id = (int)($body['entry_id'] ?? 0);
$week_number_body = (int)($body['week_number'] ?? 0);
$index_number_body = isset($body['index_number']) ? trim((string)$body['index_number']) : '';
$comment = trim((string)($body['comment'] ?? ''));

if ($comment === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Non-empty comment is required']);
    return;
}

$supervisor_name = (string)($_SESSION['name'] ?? '');
$supervisor_name_esc = mysqli_real_escape_string($conn, $supervisor_name);
$comment_esc = mysqli_real_escape_string($conn, $comment);

// Resolve the logbook entry (student index + week) even if entry_id is missing/invalid.
$student_index = '';
$week_number = 0;
$resolved_entry_id = 0;

if ($entry_id >= 1) {
    $q = "SELECT id, index_number, week_number
          FROM elogbook_entries
          WHERE id=$entry_id
          LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Logbook entry not found']);
        return;
    }
    $row = mysqli_fetch_assoc($res);
    $student_index = trim((string)($row['index_number'] ?? ''));
    $week_number = (int)($row['week_number'] ?? 0);
    $resolved_entry_id = (int)($row['id'] ?? 0);
} else {
    // Fall back to index_number + week_number.
    if ($index_number_body === '' || $week_number_body < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Provide either entry_id or (index_number + week_number)']);
        return;
    }
    $student_index = trim($index_number_body);
    $week_number = $week_number_body;

    $q2 = "SELECT id
           FROM elogbook_entries
           WHERE index_number='$student_index'
             AND week_number=$week_number
           LIMIT 1";
    $res2 = mysqli_query($conn, $q2);
    if ($res2 && ($row2 = mysqli_fetch_assoc($res2))) {
        $resolved_entry_id = (int)($row2['id'] ?? 0);
    }
}

if ($student_index === '' || $week_number < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid logbook entry data']);
    return;
}

// Enforce that this student is assigned to the current supervisor.
$assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
if (empty($assigned) || !in_array($student_index, $assigned, true)) {
    // Fallback: check direct per-student assignments by supervisorDbId (visiting_lecturers.id).
    // This matches the admin "student-supervisor" assignment flow.
    $supervisorId = (int)($_SESSION['user_id'] ?? 0);
    $student_index_esc = mysqli_real_escape_string($conn, trim($student_index));
    $directAllowed = false;
    if ($supervisorId > 0) {
        $directRes = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments
             WHERE index_number='$student_index_esc'
               AND lecturer_id=$supervisorId
             LIMIT 1"
        );
        $directAllowed = $directRes && mysqli_num_rows($directRes) > 0;
    }

    // Extra fallback: authorize by supervisor name (covers any data inconsistencies).
    if (!$directAllowed) {
        $directRes2 = @mysqli_query(
            $conn,
            "SELECT 1
             FROM student_supervisor_assignments ssa
             JOIN visiting_lecturers vl ON vl.id = ssa.lecturer_id
             WHERE ssa.index_number='$student_index_esc'
               AND BINARY vl.lecturer_name = '$supervisor_name_esc'
             LIMIT 1"
        );
        $directAllowed = $directRes2 && mysqli_num_rows($directRes2) > 0;
    }

    if (!$directAllowed) {
        http_response_code(403);
        echo json_encode(['error' => 'Student not assigned to you']);
        return;
    }
}

// Update supervisor comment on the entry.
$in_list = "'" . implode(
        "','",
        array_map(
            static function (string $idx) use ($conn): string {
                return mysqli_real_escape_string($conn, $idx);
            },
            $assigned
        )
) . "'";

// Update by entry_id (if valid) OR by index_number+week_number.
if ($entry_id >= 1) {
    $upd = "UPDATE elogbook_entries
            SET supervisor_comment='$comment_esc',
                supervisor_commenter='$supervisor_name_esc',
                supervisor_commented_at=NOW()
            WHERE id=$entry_id AND index_number IN ($in_list)";
} else {
    $student_index_esc = mysqli_real_escape_string($conn, $student_index);
    $upd = "UPDATE elogbook_entries
            SET supervisor_comment='$comment_esc',
                supervisor_commenter='$supervisor_name_esc',
                supervisor_commented_at=NOW()
            WHERE index_number='$student_index_esc'
              AND week_number=$week_number";
}

if (!mysqli_query($conn, $upd) || mysqli_affected_rows($conn) < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Could not update comment (not allowed or update failed)']);
    return;
}

// Insert student notification.
$recipient_esc = mysqli_real_escape_string($conn, $student_index);
// Title is short; message contains the full comment text.
$title = "Supervisor commented on your e-logbook (Week " . (string)$week_number . ")";
$title_esc = mysqli_real_escape_string($conn, $title);

$elogbook_entry_id_to_store = $resolved_entry_id > 0 ? (int)$resolved_entry_id : ($entry_id > 0 ? (int)$entry_id : null);

$ins = "INSERT INTO student_notifications
            (recipient_index_number, type, title, message, week_number, supervisor_name, elogbook_entry_id)
        VALUES
            ('$recipient_esc', 'logbook_week_comment', '$title_esc', '$comment_esc', $week_number, '$supervisor_name_esc', " . ($elogbook_entry_id_to_store === null ? "NULL" : (string)$elogbook_entry_id_to_store) . ")";

if (!mysqli_query($conn, $ins)) {
    http_response_code(400);
    echo json_encode(['error' => 'Comment saved but notification failed']);
    return;
}

echo json_encode(['success' => true]);

