<?php
// Student notifications (GET): returned for the currently logged-in student.

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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}
$idx = mysqli_real_escape_string($conn, $index_number);

$unread_q = "SELECT COUNT(*) AS c FROM student_notifications
             WHERE recipient_index_number='$idx' AND read_at IS NULL";
$unread_res = mysqli_query($conn, $unread_q);
$unread_count = 0;
if ($unread_res && ($row = mysqli_fetch_assoc($unread_res))) {
    $unread_count = (int)($row['c'] ?? 0);
}

$q = "SELECT id, type, title, message, week_number, supervisor_name, elogbook_entry_id,
             created_at, read_at
      FROM student_notifications
      WHERE recipient_index_number='$idx'
      ORDER BY created_at DESC
      LIMIT 20";
$res = mysqli_query($conn, $q);

$list = [];
while ($row = mysqli_fetch_assoc($res)) {
    $list[] = [
        'id' => (int)($row['id'] ?? 0),
        'type' => $row['type'] ?? '',
        'title' => $row['title'] ?? '',
        'message' => $row['message'] ?? '',
        'week_number' => $row['week_number'] !== null ? (int)$row['week_number'] : null,
        'supervisor_name' => $row['supervisor_name'] ?? null,
        'elogbook_entry_id' => $row['elogbook_entry_id'] !== null ? (int)$row['elogbook_entry_id'] : null,
        'created_at' => $row['created_at'] ?? null,
        'read_at' => $row['read_at'] ?? null,
    ];
}

echo json_encode(['unread_count' => $unread_count, 'notifications' => $list]);

