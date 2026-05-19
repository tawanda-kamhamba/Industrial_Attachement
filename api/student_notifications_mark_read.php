<?php
// Student notifications mark-read (POST): marks notifications as read for the currently logged-in student.

require_once __DIR__ . '/notification_helpers.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

iasms_ensure_student_notifications_table($conn);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$index_number = $_SESSION['index_number'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}
$idx = mysqli_real_escape_string($conn, $index_number);

$ids = $body['notification_ids'] ?? [];
if (!is_array($ids)) {
    echo json_encode(['success' => false, 'error' => 'notification_ids must be an array']);
    return;
}

$cleanIds = [];
foreach ($ids as $id) {
    $intId = (int)$id;
    if ($intId > 0) $cleanIds[$intId] = true;
}

$list = array_keys($cleanIds);
if (count($list) === 0) {
    echo json_encode(['success' => false, 'error' => 'No valid notification_ids provided']);
    return;
}

$idStrings = [];
foreach ($list as $idVal) {
    $idStrings[] = (string)((int)$idVal);
}
$id_in = implode(',', $idStrings);

$q = "UPDATE student_notifications
         SET read_at = NOW()
       WHERE id IN ($id_in)
         AND recipient_index_number='$idx'
         AND read_at IS NULL";

if (mysqli_query($conn, $q)) {
    echo json_encode(['success' => true, 'updated' => mysqli_affected_rows($conn)]);
    return;
}

echo json_encode(['success' => false, 'error' => 'Update failed']);

