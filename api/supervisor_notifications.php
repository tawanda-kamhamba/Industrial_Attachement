<?php
// Supervisor notifications (GET): returned for the currently logged-in supervisor.

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'supervisor') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

require_once __DIR__ . '/notification_helpers.php';
iasms_ensure_supervisor_notifications_table($conn);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$lecturer_id = (int)($_SESSION['user_id'] ?? 0);
if ($lecturer_id <= 0) {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}

$unread_q = "SELECT COUNT(*) AS c FROM supervisor_notifications
             WHERE recipient_lecturer_id=$lecturer_id AND read_at IS NULL";
$unread_res = mysqli_query($conn, $unread_q);
$unread_count = 0;
if ($unread_res && ($row = mysqli_fetch_assoc($unread_res))) {
    $unread_count = (int)($row['c'] ?? 0);
}

$q = "SELECT id, type, title, message, student_index_number, student_name, contract_id,
             created_at, read_at
      FROM supervisor_notifications
      WHERE recipient_lecturer_id=$lecturer_id
      ORDER BY created_at DESC
      LIMIT 20";
$res = mysqli_query($conn, $q);

$list = [];
if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $list[] = [
            'id' => (int)($row['id'] ?? 0),
            'type' => $row['type'] ?? '',
            'title' => $row['title'] ?? '',
            'message' => $row['message'] ?? '',
            'student_index_number' => $row['student_index_number'] ?? null,
            'student_name' => $row['student_name'] ?? null,
            'contract_id' => $row['contract_id'] !== null ? (int)$row['contract_id'] : null,
            'created_at' => $row['created_at'] ?? null,
            'read_at' => $row['read_at'] ?? null,
        ];
    }
}

echo json_encode(['unread_count' => $unread_count, 'notifications' => $list]);
