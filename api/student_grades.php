<?php
// GET: current student's assessment status (2 institutional visits + 1 company).
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}

require_once __DIR__ . '/grading_helpers.php';

echo json_encode(iasms_student_assessments_received($conn, $index_number));
exit;
