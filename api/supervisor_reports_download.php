<?php
/**
 * GET /iasms/api/supervisor/reports/download/{filename}
 * Stream a report file for assigned students only.
 */
require_once __DIR__ . '/reports_download_auth.php';
require_once __DIR__ . '/supervisor_helpers.php';

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Not authorized']);
    exit;
}

$name = isset($_GET['name']) ? (string)$_GET['name'] : '';
$name = iasms_report_basename_safe($name);
if ($name === '') {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'File name required']);
    exit;
}

$uploadsReal = iasms_reports_uploads_realpath();
if ($uploadsReal === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Uploads directory missing']);
    exit;
}

if (!iasms_supervisor_may_download_report($conn, $name, $uploadsReal)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Report not found']);
    exit;
}

$path = $uploadsReal . DIRECTORY_SEPARATOR . $name;
$mime = iasms_report_mime_for_basename($name);

header('Content-Type: ' . $mime);
header('Content-Disposition: inline; filename="' . str_replace('"', '\\"', $name) . '"');
header('Content-Length: ' . (string)filesize($path));
readfile($path);
exit;
