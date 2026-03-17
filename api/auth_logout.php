<?php
require_once __DIR__ . '/supervisor_staff_cookie.php';
iasms_clear_supervisor_staff_cookie();
iasms_clear_supervisor_id_cookie();
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();
echo json_encode(['success' => true]);
