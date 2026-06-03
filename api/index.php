<?php
/**
 * IASMS REST API entry point.
 * All requests to /iasms/api/* are routed here. Expects JSON for POST; returns JSON.
 * File-download routes are handled before sending JSON headers.
 */
session_start();

require __DIR__ . '/../database_connection/database_connection.php';

$uri = $_SERVER['REQUEST_URI'] ?? '';
$base = '/iasms/api';
$path = (strpos($uri, $base) === 0) ? trim(substr($uri, strlen($base)), '/?') : '';
$path = preg_replace('/\?.*/', '', $path);
$segments = $path ? explode('/', $path) : [];

// Route: admin contract file download (must run before JSON headers)
// Supports:
// - /iasms/api/admin/contracts/download?id=123
// - /iasms/api/admin/contracts/download/123
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'contracts' && ($segments[2] ?? '') === 'download') {
    if (empty($_GET['id']) && !empty($segments[3]) && ctype_digit($segments[3])) {
        $_GET['id'] = (int)$segments[3];
    }
    require __DIR__ . '/admin_contracts_download.php';
    exit;
}

// Route: supervisor contract file download (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'contracts' && ($segments[2] ?? '') === 'download') {
    if (empty($_GET['id']) && !empty($segments[3]) && ctype_digit($segments[3])) {
        $_GET['id'] = (int)$segments[3];
    }
    require __DIR__ . '/supervisor_contracts_download.php';
    exit;
}

// Route: admin report file download (basename in segment 3, URL-encoded)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'reports' && ($segments[2] ?? '') === 'download' && !empty($segments[3])) {
    $_GET['name'] = rawurldecode($segments[3]);
    require __DIR__ . '/admin_reports_download.php';
    exit;
}

// Route: supervisor report file download (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'reports' && ($segments[2] ?? '') === 'download' && !empty($segments[3])) {
    $_GET['name'] = rawurldecode($segments[3]);
    require __DIR__ . '/supervisor_reports_download.php';
    exit;
}

// Route: student profile photo (serve image, no JSON)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'profile' && ($segments[2] ?? '') === 'photo') {
    require __DIR__ . '/student_profile_photo.php';
    exit;
}

// Route: admin view student profile photo (serve image, no JSON)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'student-profile' && !empty($segments[2]) && ($segments[3] ?? '') === 'photo') {
    require __DIR__ . '/admin_student_profile_photo.php';
    exit;
}

// Route: supervisor view student profile photo (serve image, no JSON)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'student-profile' && !empty($segments[2]) && ($segments[3] ?? '') === 'photo') {
    require __DIR__ . '/supervisor_student_profile_photo.php';
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// Route: auth
if (!empty($segments[0]) && $segments[0] === 'auth') {
    $action = $segments[1] ?? '';
    if ($action === 'login') {
        require __DIR__ . '/auth_login.php';
        exit;
    }
    if ($action === 'logout') {
        require __DIR__ . '/auth_logout.php';
        exit;
    }
    if ($action === 'check') {
        require __DIR__ . '/auth_check.php';
        exit;
    }
    if ($action === 'register') {
        require __DIR__ . '/auth_register.php';
        exit;
    }
    if ($action === 'supervisor-register') {
        require __DIR__ . '/auth_supervisor_register.php';
        exit;
    }
}

// Route: admin dashboard stats
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'stats') {
    require __DIR__ . '/admin_stats.php';
    exit;
}

// Route: admin dashboard charts (real data for registrations, submissions, faculty, region)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'charts') {
    require __DIR__ . '/admin_charts.php';
    exit;
}

// Route: admin students (industrial_registration)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'students') {
    require __DIR__ . '/admin_students.php';
    exit;
}

// Route: admin student profile (full details for any student)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'student-profile' && !empty($segments[2])) {
    require __DIR__ . '/admin_student_profile.php';
    exit;
}

// Route: admin orientation checklists
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'orientation') {
    require __DIR__ . '/admin_orientation.php';
    exit;
}

// Route: admin orientation checklist detail
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'orientation-detail') {
    require __DIR__ . '/admin_orientation_detail.php';
    exit;
}

// Route: admin elogbooks
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'elogbooks') {
    require __DIR__ . '/admin_elogbooks.php';
    exit;
}

// Route: admin contracts
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'contracts') {
    require __DIR__ . '/admin_contracts.php';
    exit;
}

// Route: admin reports (file list) — not /admin/reports/download/* (handled above)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'reports') {
    require __DIR__ . '/admin_reports.php';
    exit;
}

// Route: admin assumptions
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'assumptions') {
    require __DIR__ . '/admin_assumptions.php';
    exit;
}

// Route: admin visiting scores
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'visiting-scores') {
    require __DIR__ . '/admin_visiting_scores.php';
    exit;
}

// Route: admin company scores
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'company-scores') {
    require __DIR__ . '/admin_company_scores.php';
    exit;
}

// Route: admin assign supervisors (GET data)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'assign-supervisors' && ($segments[2] ?? '') === '') {
    require __DIR__ . '/admin_assign_supervisors_data.php';
    exit;
}

// Route: admin assign supervisors - add lecturer (POST)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'assign-supervisors' && ($segments[2] ?? '') === 'lecturer') {
    require __DIR__ . '/admin_assign_supervisors_lecturer.php';
    exit;
}

// Route: admin assign supervisors - save assignments (POST)
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'assign-supervisors' && ($segments[2] ?? '') === 'save') {
    require __DIR__ . '/admin_assign_supervisors_save.php';
    exit;
}

// Route: admin per-student supervisor assignment (GET/POST)
// GET  /admin/student-supervisor/{index_number}
// POST /admin/student-supervisor/assign
if (!empty($segments[0]) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'student-supervisor') {
    require __DIR__ . '/admin_student_supervisor.php';
    exit;
}

// Route: supervisor dashboard stats
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'stats') {
    require __DIR__ . '/supervisor_stats.php';
    exit;
}

// Route: supervisor students (for view logbook list)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'students') {
    require __DIR__ . '/supervisor_students.php';
    exit;
}

// Route: supervisor all scores (company + my visit scores for assigned students)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'scores') {
    require __DIR__ . '/supervisor_scores.php';
    exit;
}

// Route: supervisor final grades (elogbook/report marks + computed final)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'final-grades') {
    require __DIR__ . '/supervisor_final_grades.php';
    exit;
}

// Route: supervisor student profile (full details for one assigned student)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'student-profile' && !empty($segments[2])) {
    require __DIR__ . '/supervisor_student_profile.php';
    exit;
}

// Route: supervisor orientation checklists (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'orientation') {
    require __DIR__ . '/supervisor_orientation.php';
    exit;
}

// Route: supervisor elogbooks (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'elogbooks') {
    require __DIR__ . '/supervisor_elogbooks.php';
    exit;
}

// Route: supervisor logbook week comments (POST)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'elogbook-comment') {
    require __DIR__ . '/supervisor_elogbook_comment.php';
    exit;
}

// Route: supervisor student assumptions (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'assumptions') {
    require __DIR__ . '/supervisor_assumptions.php';
    exit;
}

// Route: supervisor contracts (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'contracts') {
    require __DIR__ . '/supervisor_contracts.php';
    exit;
}

// Route: supervisor submitted reports (assigned students only)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'reports') {
    require __DIR__ . '/supervisor_reports.php';
    exit;
}

// Route: supervisor grade submission (visiting supervisor scores)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'grade') {
    require __DIR__ . '/supervisor_grade.php';
    exit;
}

// Route: supervisor assessment passwords (GET status, POST set visiting/company password)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'assessment-passwords') {
    require __DIR__ . '/supervisor_assessment_passwords.php';
    exit;
}

// Route: supervisor notifications (GET)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'notifications' && ($segments[2] ?? '') === '') {
    require __DIR__ . '/supervisor_notifications.php';
    exit;
}

// Route: supervisor notifications mark-read (POST)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'notifications' && ($segments[2] ?? '') === 'mark-read') {
    require __DIR__ . '/supervisor_notifications_mark_read.php';
    exit;
}

// Route: supervisor visit schedule (GET availability + selections, POST save/notify)
if (!empty($segments[0]) && $segments[0] === 'supervisor' && ($segments[1] ?? '') === 'visit-schedule') {
    require __DIR__ . '/supervisor_visit_schedule.php';
    exit;
}

// Route: elogbook entries for a student
if (!empty($segments[0]) && $segments[0] === 'elogbook' && !empty($segments[1])) {
    require __DIR__ . '/elogbook_student.php';
    exit;
}

// Route: student orientation checklist (GET/POST, requires student session)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'orientation') {
    require __DIR__ . '/student_orientation.php';
    exit;
}

// Route: student e-logbook submit (POST, requires student session)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'elogbook') {
    require __DIR__ . '/student_elogbook.php';
    exit;
}

// Route: student grades (GET, requires student session)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'grades') {
    require __DIR__ . '/student_grades.php';
    exit;
}

// Route: student assigned institutional supervisor (GET, requires student session)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'supervisor' && ($segments[2] ?? '') === '') {
    require __DIR__ . '/student_supervisor.php';
    exit;
}

// Route: student contract (GET status, POST upload) — uses student_contracts table only
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'contract') {
    require __DIR__ . '/student_contract.php';
    exit;
}

// Route: student report upload
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'report') {
    require __DIR__ . '/student_report.php';
    exit;
}

// Route: student notifications (GET)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'notifications' && ($segments[2] ?? '') === '') {
    require __DIR__ . '/student_notifications.php';
    exit;
}

// Route: student notifications mark-read (POST)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'notifications' && ($segments[2] ?? '') === 'mark-read') {
    require __DIR__ . '/student_notifications_mark_read.php';
    exit;
}

// Route: student visit schedule (GET open days + selections, POST select days)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'visit-schedule') {
    require __DIR__ . '/student_visit_schedule.php';
    exit;
}

// Route: student industrial registration (GET status, POST register)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'registration') {
    require __DIR__ . '/student_registration.php';
    exit;
}

// Route: student assumption of duty (GET status, POST submit)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'assumption') {
    require __DIR__ . '/student_assumption.php';
    exit;
}

// Route: student account profile (GET profile, POST update + optional photo)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'profile' && ($segments[2] ?? '') === '') {
    require __DIR__ . '/student_profile.php';
    exit;
}

// Route: student supervisor verify (POST)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'supervisor' && ($segments[2] ?? '') === 'verify') {
    require __DIR__ . '/student_supervisor_verify.php';
    exit;
}

// Route: student supervisor grade submit (POST)
if (!empty($segments[0]) && $segments[0] === 'student' && ($segments[1] ?? '') === 'supervisor' && ($segments[2] ?? '') === 'grade') {
    require __DIR__ . '/student_supervisor_grade.php';
    exit;
}

echo json_encode(['error' => 'Not found']);
http_response_code(404);
