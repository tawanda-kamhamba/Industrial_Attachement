<?php
/**
 * Student registration (registered_students). Mirrors index.php btn_signup logic.
 * POST JSON: first_name, last_name, index_number, password
 */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$first_name = trim((string)($body['first_name'] ?? ''));
$last_name = trim((string)($body['last_name'] ?? ''));
$index_number = trim((string)($body['index_number'] ?? ''));
$password = trim((string)($body['password'] ?? ''));

if ($first_name === '' || $last_name === '' || $index_number === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Provide details for all fields.']);
    return;
}

$looks_like_alphanumeric = (bool)preg_match('/[A-Za-z]/', $index_number);
if ($looks_like_alphanumeric) {
    $col = mysqli_query($conn, "SHOW COLUMNS FROM registered_students LIKE 'index_number'");
    if ($col) {
        $col_row = mysqli_fetch_assoc($col) ?: [];
        $type = strtolower((string)($col_row['Type'] ?? ''));
        if ($type !== '' && (str_starts_with($type, 'int') || str_starts_with($type, 'bigint') || str_starts_with($type, 'smallint'))) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Registration number format not supported by current database schema.',
                'hint' => "Fix: change registered_students.index_number from $type to VARCHAR (e.g. VARCHAR(50)) so values like '{$index_number}' do not become 0.",
            ]);
            return;
        }
    }
}

$idx = mysqli_real_escape_string($conn, $index_number);
$check = mysqli_query($conn, "SELECT index_number FROM registered_students WHERE index_number='$idx' LIMIT 1");
if ($check && mysqli_num_rows($check) > 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'An account with this index number already exists.']);
    return;
}

$fname = mysqli_real_escape_string($conn, $first_name);
$lname = mysqli_real_escape_string($conn, $last_name);
$pwd = mysqli_real_escape_string($conn, $password);
$insert = "INSERT INTO registered_students (first_name, last_name, index_number, password) VALUES ('$fname','$lname','$idx','$pwd')";

try {
    if (mysqli_query($conn, $insert)) {
        $_SESSION['role'] = 'student';
        $_SESSION['user_id'] = $index_number;
        $_SESSION['name'] = $first_name . ' ' . $last_name;
        $_SESSION['index_number'] = $index_number;
        $exp = time() + (86400 * 30);
        setcookie('student_first_name', $first_name, $exp, '/');
        setcookie('student_last_name', $last_name, $exp, '/');
        setcookie('student_index_number', $index_number, $exp, '/');
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful.',
            'user' => [
                'id' => $index_number,
                'name' => $first_name . ' ' . $last_name,
                'role' => 'student',
                'indexNumber' => $index_number,
            ],
        ]);
        return;
    }

    $errno = mysqli_errno($conn);
    $err = mysqli_error($conn);
    error_log("registered_students insert failed (errno=$errno): $err");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Unable to register. Please try again.']);
} catch (mysqli_sql_exception $e) {
    error_log("registered_students insert exception: " . $e->getMessage());
    $is_local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
    $debug = $is_local ? ['db_error' => $e->getMessage()] : [];
    http_response_code(500);
    echo json_encode(array_merge(['success' => false, 'error' => 'Unable to register. Please try again.'], $debug));
}
