<?php
require_once __DIR__ . '/notification_helpers.php';

// POST: save or update e-logbook entry for current student (session required)
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
$student_name = $_SESSION['name'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    http_response_code(405);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$week_number = (int)($body['week_number'] ?? 0);
if ($week_number < 1) {
    echo json_encode(['success' => false, 'error' => 'Invalid week number']);
    return;
}

$idx = mysqli_real_escape_string($conn, $index_number);
$name_esc = mysqli_real_escape_string($conn, $student_name);

$monday_job = mysqli_real_escape_string($conn, $body['monday_job_assigned'] ?? '');
$monday_skill = mysqli_real_escape_string($conn, $body['monday_skill_acquired'] ?? '');
$tuesday_job = mysqli_real_escape_string($conn, $body['tuesday_job_assigned'] ?? '');
$tuesday_skill = mysqli_real_escape_string($conn, $body['tuesday_skill_acquired'] ?? '');
$wednesday_job = mysqli_real_escape_string($conn, $body['wednesday_job_assigned'] ?? '');
$wednesday_skill = mysqli_real_escape_string($conn, $body['wednesday_skill_acquired'] ?? '');
$thursday_job = mysqli_real_escape_string($conn, $body['thursday_job_assigned'] ?? '');
$thursday_skill = mysqli_real_escape_string($conn, $body['thursday_skill_acquired'] ?? '');
$friday_job = mysqli_real_escape_string($conn, $body['friday_job_assigned'] ?? '');
$friday_skill = mysqli_real_escape_string($conn, $body['friday_skill_acquired'] ?? '');

$check = mysqli_query($conn, "SELECT id FROM elogbook_entries WHERE index_number='$idx' AND week_number=$week_number LIMIT 1");
$exists = $check && mysqli_num_rows($check) > 0;

if ($exists) {
    $upd = "UPDATE elogbook_entries SET
        monday_job_assigned='$monday_job', monday_skill_acquired='$monday_skill',
        tuesday_job_assigned='$tuesday_job', tuesday_skill_acquired='$tuesday_skill',
        wednesday_job_assigned='$wednesday_job', wednesday_skill_acquired='$wednesday_skill',
        thursday_job_assigned='$thursday_job', thursday_skill_acquired='$thursday_skill',
        friday_job_assigned='$friday_job', friday_skill_acquired='$friday_skill'
        WHERE index_number='$idx' AND week_number=$week_number";
    if (mysqli_query($conn, $upd)) {
        echo json_encode(['success' => true, 'updated' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Update failed']);
    }
} else {
    $ins = "INSERT INTO elogbook_entries
        (student_name, index_number, week_number, monday_job_assigned, monday_skill_acquired,
         tuesday_job_assigned, tuesday_skill_acquired, wednesday_job_assigned, wednesday_skill_acquired,
         thursday_job_assigned, thursday_skill_acquired, friday_job_assigned, friday_skill_acquired)
        VALUES ('$name_esc', '$idx', $week_number, '$monday_job', '$monday_skill',
         '$tuesday_job', '$tuesday_skill', '$wednesday_job', '$wednesday_skill',
         '$thursday_job', '$thursday_skill', '$friday_job', '$friday_skill')";
    if (mysqli_query($conn, $ins)) {
        echo json_encode(['success' => true, 'updated' => false]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Insert failed']);
    }
}
