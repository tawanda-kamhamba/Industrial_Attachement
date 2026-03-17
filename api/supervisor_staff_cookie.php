<?php
/**
 * Signed cookie for supervisor staff_id so assessment-passwords uses the correct row
 * even when the PHP session is shared or wrong. Only the server can produce a valid cookie.
 */
if (!defined('IASMS_SUPERVISOR_COOKIE_NAME')) {
    define('IASMS_SUPERVISOR_COOKIE_NAME', 'iasms_supervisor_staff_id');
}
if (!defined('IASMS_SUPERVISOR_ID_COOKIE_NAME')) {
    define('IASMS_SUPERVISOR_ID_COOKIE_NAME', 'iasms_supervisor_id');
}
if (!defined('IASMS_SUPERVISOR_COOKIE_SECRET')) {
    define('IASMS_SUPERVISOR_COOKIE_SECRET', 'iasms_supervisor_staff_cookie_v1_' . (__DIR__ ?? ''));
}
if (!defined('IASMS_SUPERVISOR_ID_COOKIE_SECRET')) {
    define('IASMS_SUPERVISOR_ID_COOKIE_SECRET', 'iasms_supervisor_id_cookie_v1_' . (__DIR__ ?? ''));
}

/**
 * Set the signed cookie with the given staff_id. Call on supervisor login.
 */
function iasms_set_supervisor_staff_cookie(string $staff_id): void {
    $payload = $staff_id . ':' . hash_hmac('sha256', $staff_id, IASMS_SUPERVISOR_COOKIE_SECRET);
    $value = base64_encode($payload);
    $exp = time() + (86400 * 30); // 30 days
    // Important: clear any older cookie that may exist on a different path (e.g. "/iasms")
    // to avoid PHP picking a stale staff_id when multiple cookies share the same name.
    foreach (['/iasms', '/'] as $path) {
        @setcookie(IASMS_SUPERVISOR_COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }

    // Set cookie for both app path and root to be robust across dev/prod routing.
    foreach (['/iasms', '/'] as $path) {
        setcookie(IASMS_SUPERVISOR_COOKIE_NAME, $value, [
            'expires' => $exp,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }
}

/**
 * Set signed cookie with the supervisor's numeric visiting_lecturers.id (preferred identifier).
 */
function iasms_set_supervisor_id_cookie(string $supervisor_id): void {
    $payload = $supervisor_id . ':' . hash_hmac('sha256', $supervisor_id, IASMS_SUPERVISOR_ID_COOKIE_SECRET);
    $value = base64_encode($payload);
    $exp = time() + (86400 * 30); // 30 days

    foreach (['/iasms', '/'] as $path) {
        @setcookie(IASMS_SUPERVISOR_ID_COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }
    foreach (['/iasms', '/'] as $path) {
        setcookie(IASMS_SUPERVISOR_ID_COOKIE_NAME, $value, [
            'expires' => $exp,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }
}

/**
 * Read and verify the cookie; return the staff_id or empty string if missing/invalid.
 */
function iasms_get_supervisor_staff_id_from_cookie(): string {
    $raw = $_COOKIE[IASMS_SUPERVISOR_COOKIE_NAME] ?? '';
    if ($raw === '') {
        return '';
    }
    $decoded = base64_decode($raw, true);
    if ($decoded === false || strpos($decoded, ':') === false) {
        return '';
    }
    $parts = explode(':', $decoded, 2);
    $staff_id = $parts[0];
    $sig = $parts[1] ?? '';
    if ($staff_id === '' || $sig === '') {
        return '';
    }
    $expected = hash_hmac('sha256', $staff_id, IASMS_SUPERVISOR_COOKIE_SECRET);
    if (!hash_equals($expected, $sig)) {
        return '';
    }
    return $staff_id;
}

/**
 * Read and verify the supervisor id cookie; return the visiting_lecturers.id or empty string.
 */
function iasms_get_supervisor_id_from_cookie(): string {
    $raw = $_COOKIE[IASMS_SUPERVISOR_ID_COOKIE_NAME] ?? '';
    if ($raw === '') {
        return '';
    }
    $decoded = base64_decode($raw, true);
    if ($decoded === false || strpos($decoded, ':') === false) {
        return '';
    }
    $parts = explode(':', $decoded, 2);
    $id = $parts[0];
    $sig = $parts[1] ?? '';
    if ($id === '' || $sig === '') {
        return '';
    }
    // Basic sanity: must be digits
    if (!ctype_digit($id)) {
        return '';
    }
    $expected = hash_hmac('sha256', $id, IASMS_SUPERVISOR_ID_COOKIE_SECRET);
    if (!hash_equals($expected, $sig)) {
        return '';
    }
    return $id;
}

/**
 * Clear the supervisor staff_id cookie. Call on logout.
 */
function iasms_clear_supervisor_staff_cookie(): void {
    foreach (['/iasms', '/'] as $path) {
        setcookie(IASMS_SUPERVISOR_COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }
}

/**
 * Clear supervisor id cookie. Call on logout.
 */
function iasms_clear_supervisor_id_cookie(): void {
    foreach (['/iasms', '/'] as $path) {
        setcookie(IASMS_SUPERVISOR_ID_COOKIE_NAME, '', [
            'expires' => time() - 3600,
            'path' => $path,
            'samesite' => 'Lax',
            'secure' => false,
            'httponly' => true,
        ]);
    }
}
