<?php
// Student notifications mark-read (POST): marks notifications as read for the currently logged-in student.

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

// Ensure notifications table exists (older installs may not have it yet).
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
    INDEX idx_recipient_read (recipient_index_number, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1";
@mysqli_query($conn, $create);

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

