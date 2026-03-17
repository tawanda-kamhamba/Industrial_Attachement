<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    http_response_code(405);
    return;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$role = $body['role'] ?? '';

if ($role === 'student') {
    $index_number = trim($body['indexNumber'] ?? '');
    $password = trim($body['password'] ?? '');
    if ($index_number === '' || $password === '') {
        echo json_encode(['success' => false, 'error' => 'Index number and password required']);
        return;
    }
    $idx = mysqli_real_escape_string($conn, $index_number);
    $pwd = mysqli_real_escape_string($conn, $password);
    $q = "SELECT first_name, last_name, index_number FROM registered_students WHERE index_number='$idx' AND password='$pwd' LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) !== 1) {
        echo json_encode(['success' => false, 'error' => 'Invalid index number or password']);
        return;
    }
    $row = mysqli_fetch_assoc($res);
    $_SESSION['role'] = 'student';
    $_SESSION['user_id'] = $row['index_number'];
    $_SESSION['name'] = $row['first_name'] . ' ' . $row['last_name'];
    $_SESSION['index_number'] = $row['index_number'];
    // Set cookies for legacy PHP pages (e-logbook, orientation, contract, report, assumption)
    $exp = time() + (86400 * 30);
    setcookie('student_first_name', $row['first_name'], $exp, '/');
    setcookie('student_last_name', $row['last_name'], $exp, '/');
    setcookie('student_index_number', $row['index_number'], $exp, '/');
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $row['index_number'],
            'name' => $row['first_name'] . ' ' . $row['last_name'],
            'role' => 'student',
            'indexNumber' => $row['index_number'],
        ],
    ]);
    return;
}

if ($role === 'admin') {
    $password = trim($body['password'] ?? '');
    if ($password === '') {
        echo json_encode(['success' => false, 'error' => 'Password required']);
        return;
    }
    $pwd = mysqli_real_escape_string($conn, $password);
    $q = "SELECT * FROM system_admin WHERE password='$pwd' LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) !== 1) {
        echo json_encode(['success' => false, 'error' => 'Invalid password']);
        return;
    }
    $_SESSION['role'] = 'admin';
    $_SESSION['user_id'] = 'admin';
    $_SESSION['name'] = 'Admin';
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => 'admin-1',
            'name' => 'Admin',
            'role' => 'admin',
        ],
    ]);
    return;
}

if ($role === 'supervisor') {
    $staffId = trim($body['staffId'] ?? '');
    $password = trim($body['password'] ?? '');
    if ($staffId === '' || $password === '') {
        echo json_encode(['success' => false, 'error' => 'Staff ID and password required']);
        return;
    }
    $sid = mysqli_real_escape_string($conn, $staffId);
    $pwd = mysqli_real_escape_string($conn, $password);
    $q = "SELECT id, lecturer_name, staff_id FROM visiting_lecturers WHERE staff_id='$sid' AND password='$pwd' AND staff_id IS NOT NULL LIMIT 1";
    $res = mysqli_query($conn, $q);
    if (!$res || mysqli_num_rows($res) !== 1) {
        echo json_encode(['success' => false, 'error' => 'Invalid Staff ID or password']);
        return;
    }
    $row = mysqli_fetch_assoc($res);
    session_regenerate_id(true);
    $_SESSION['role'] = 'supervisor';
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['name'] = $row['lecturer_name'];
    $_SESSION['staff_id'] = $row['staff_id'];
    require_once __DIR__ . '/supervisor_staff_cookie.php';
    iasms_set_supervisor_staff_cookie($row['staff_id']);
    iasms_set_supervisor_id_cookie((string)$row['id']);
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => 'sup-' . $row['id'],
            'name' => $row['lecturer_name'],
            'role' => 'supervisor',
            'staffId' => $row['staff_id'],
        ],
    ]);
    return;
}

echo json_encode(['success' => false, 'error' => 'Unknown role']);
http_response_code(400);
