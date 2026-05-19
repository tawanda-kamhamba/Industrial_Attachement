<?php
// Supervisor notifications mark-read (POST).

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'supervisor') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

require_once __DIR__ . '/notification_helpers.php';
iasms_ensure_supervisor_notifications_table($conn);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$ids = $body['notification_ids'] ?? [];
if (!is_array($ids)) {
    echo json_encode(['success' => false, 'error' => 'notification_ids must be an array']);
    return;
}

$cleanIds = [];
foreach ($ids as $id) {
    $intId = (int)$id;
    if ($intId > 0) {
        $cleanIds[$intId] = true;
    }
}

$list = array_keys($cleanIds);
if (count($list) === 0) {
    echo json_encode(['success' => false, 'error' => 'No valid notification_ids provided']);
    return;
}

$id_in = implode(',', array_map('strval', $list));

$q = "UPDATE supervisor_notifications
         SET read_at = NOW()
       WHERE id IN ($id_in)
         AND recipient_lecturer_id=$lecturer_id
         AND read_at IS NULL";

if (mysqli_query($conn, $q)) {
    echo json_encode(['success' => true, 'updated' => mysqli_affected_rows($conn)]);
    return;
}

echo json_encode(['success' => false, 'error' => 'Update failed']);
