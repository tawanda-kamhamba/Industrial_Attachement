<?php
/**
 * GET /api/admin/contracts/download?id=123
 * Streams the contract PDF for admin from student_contracts. No JSON; sends file headers and body.
 */
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not authorized']);
    exit;
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
// Fallback if query string was stripped but path is .../download/123
if ($id < 1) {
    $reqUri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('~/contracts/download/(\d+)(?:\?|$)~', $reqUri, $m)) {
        $id = (int)$m[1];
    }
}
if ($id < 1) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid contract id']);
    exit;
}

$q = "SELECT contract_file, original_filename FROM student_contracts WHERE id=$id LIMIT 1";
$res = mysqli_query($conn, $q);
$row = $res ? mysqli_fetch_assoc($res) : null;
if (!$row || empty($row['contract_file'])) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Contract not found']);
    exit;
}

$contract_file = $row['contract_file'];
$base = dirname(__DIR__);
$path = $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $contract_file);

if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'File not found']);
    exit;
}

$filename = !empty($row['original_filename']) ? $row['original_filename'] : basename($path);
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . str_replace('"', '\\"', $filename) . '"');
header('Content-Length: ' . filesize($path));
readfile($path);
exit;
