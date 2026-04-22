<?php
/**
 * Student industrial registration: GET = current registration; POST = register/update.
 * Uses industrial_registration table. Student identity from session (index_number).
 */
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

$idx = mysqli_real_escape_string($conn, $index_number);

// Get first_name, last_name from registered_students for form/insert
$user_q = "SELECT first_name, last_name FROM registered_students WHERE index_number='$idx' LIMIT 1";
$user_res = mysqli_query($conn, $user_q);
if (!$user_res || mysqli_num_rows($user_res) !== 1) {
    echo json_encode(['error' => 'Student record not found']);
    http_response_code(403);
    return;
}
$user_row = mysqli_fetch_assoc($user_res);
$first_name = $user_row['first_name'] ?? '';
$last_name = $user_row['last_name'] ?? '';

// GET: return current registration if any
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $q = "SELECT index_number, first_name, last_name, other_name, programme, level, `session`, faculty
          FROM industrial_registration WHERE index_number='$idx' LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) === 0) {
        echo json_encode([
            'registered' => false,
            'first_name' => $first_name,
            'last_name' => $last_name,
        ]);
        return;
    }
    $row = mysqli_fetch_assoc($res);
    echo json_encode([
        'registered' => true,
        'index_number' => $row['index_number'],
        'first_name' => $row['first_name'],
        'last_name' => $row['last_name'],
        'other_name' => $row['other_name'] ?? '',
        'programme' => $row['programme'] ?? '',
        'level' => $row['level'] ?? '',
        'session' => $row['session'] ?? '',
        'faculty' => $row['faculty'] ?? '',
    ]);
    return;
}

// POST: register (insert or already registered)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$other_name = trim($body['other_name'] ?? '');
$programme = trim($body['programme'] ?? '');
$level = trim($body['level'] ?? '');
$session = trim($body['session'] ?? '');
$faculty = trim($body['faculty'] ?? '');

if ($programme === '' || $level === '' || $session === '' || $faculty === '') {
    echo json_encode(['success' => false, 'error' => 'Programme, level, session and faculty are required.']);
    return;
}

$other_esc = mysqli_real_escape_string($conn, $other_name);
$programme_esc = mysqli_real_escape_string($conn, $programme);
$level_esc = mysqli_real_escape_string($conn, $level);
$session_esc = mysqli_real_escape_string($conn, $session);
$faculty_esc = mysqli_real_escape_string($conn, $faculty);
$first_esc = mysqli_real_escape_string($conn, $first_name);
$last_esc = mysqli_real_escape_string($conn, $last_name);

$check = mysqli_query($conn, "SELECT id FROM industrial_registration WHERE index_number='$idx' LIMIT 1");
if ($check && mysqli_num_rows($check) > 0) {
    echo json_encode(['success' => false, 'error' => 'You have already registered.']);
    return;
}

$insert = "INSERT INTO industrial_registration (first_name, last_name, other_name, level, programme, `session`, faculty, index_number)
           VALUES ('$first_esc', '$last_esc', '$other_esc', '$level_esc', '$programme_esc', '$session_esc', '$faculty_esc', '$idx')";

if (!mysqli_query($conn, $insert)) {
    $errno = mysqli_errno($conn);
    $err = mysqli_error($conn);
    error_log("industrial_registration insert failed (errno=$errno): $err");

    $is_local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
    $debug = $is_local ? ['errno' => $errno, 'db_error' => $err] : [];
    echo json_encode(array_merge(['success' => false, 'error' => 'Registration failed. Please try again.'], $debug));
    return;
}

echo json_encode([
    'success' => true,
    'message' => 'Registration submitted successfully.',
    'registered' => true,
]);
