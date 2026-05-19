<?php
// POST: submit visiting supervisor grade on behalf of a student. Requires supervisor session.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    http_response_code(405);
    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'supervisor') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    exit;
}

require_once __DIR__ . '/supervisor_helpers.php';

// Ensure visit_number column exists on visiting_supervisor_grade (allows first and second visit scores)
$colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
    mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$index_number = trim((string)($body['index_number'] ?? ''));
if ($index_number === '') {
    echo json_encode(['error' => 'Student index number is required']);
    http_response_code(400);
    exit;
}

if (!iasms_supervisor_can_access_student_index($conn, $index_number)) {
    echo json_encode(['error' => 'Student not assigned to you']);
    http_response_code(403);
    exit;
}

$visit_number = (int)($body['visitNumber'] ?? $body['visit_number'] ?? 1);
if ($visit_number !== 1 && $visit_number !== 2) {
    $visit_number = 1;
}

$idx = mysqli_real_escape_string($conn, $index_number);
if ($idx === false || $idx === '') {
    echo json_encode(['error' => 'Invalid index number']);
    http_response_code(400);
    exit;
}

// Supervisor name (for username column)
$supervisor_name = (string)($_SESSION['name'] ?? '');
if ($supervisor_name === '') {
    $supervisor_name = 'Supervisor';
}
$supervisor_user = str_replace(' ', '', $supervisor_name);
$user = mysqli_real_escape_string($conn, $supervisor_user);

// Map body fields (mirrors student_supervisor_grade.php)
$s1 = mysqli_real_escape_string($conn, (string)($body['specificSkill1'] ?? ''));
$s1v = (int)($body['specificSkill1Score'] ?? 0);
$s2 = mysqli_real_escape_string($conn, (string)($body['specificSkill2'] ?? ''));
$s2v = (int)($body['specificSkill2Score'] ?? 0);
$s3 = mysqli_real_escape_string($conn, (string)($body['specificSkill3'] ?? ''));
$s3v = (int)($body['specificSkill3Score'] ?? 0);
$s4 = mysqli_real_escape_string($conn, (string)($body['specificSkill4'] ?? ''));
$s4v = (int)($body['specificSkill4Score'] ?? 0);
$s5 = mysqli_real_escape_string($conn, (string)($body['specificSkill5'] ?? ''));
$s5v = (int)($body['specificSkill5Score'] ?? 0);

$b1 = (int)($body['abilityToCompleteWorkOnTime'] ?? 0);
$b2 = (int)($body['abilityToFollowInstructionsCarefully'] ?? 0);
$b3 = (int)($body['abilityToTakeInitiatives'] ?? 0);
$b4 = (int)($body['abilityToWorkWithLittleSupervision'] ?? 0);
$b5 = (int)($body['adherenceToOrganizationsRules'] ?? 0);
$b6 = (int)($body['adherenceToSafety'] ?? 0);
$b7 = (int)($body['resourcefulness'] ?? 0);
$c1 = (int)($body['attendanceToWork'] ?? 0);
$c2 = (int)($body['punctuality'] ?? 0);
$c3 = (int)($body['desireToWork'] ?? 0);
$c4 = (int)($body['willingnessToAcceptIdeas'] ?? 0);
$d1 = (int)($body['relationshipWithColleagues'] ?? 0);
$d2 = (int)($body['relationshipWithSuperiors'] ?? 0);
$d3 = (int)($body['abilityToControlEmotions'] ?? 0);

$grade_score = $s1v + $s2v + $s3v + $s4v + $s5v
    + $b1 + $b2 + $b3 + $b4 + $b5 + $b6 + $b7
    + $c1 + $c2 + $c3 + $c4
    + $d1 + $d2 + $d3 + 5;

// Visiting supervisor only (institutional supervisor). Update existing row if this supervisor already scored this student+visit.
$table = 'visiting_supervisor_grade';

// Resolve existing row by bound parameters (avoids quoting/encoding mismatches on user_index).
$existingId = 0;
$stmtFind = mysqli_prepare($conn, "SELECT id FROM `$table` WHERE username = ? AND user_index = ? AND visit_number = ? LIMIT 1");
if (!$stmtFind) {
    echo json_encode(['error' => 'Database error']);
    http_response_code(500);
    exit;
}
mysqli_stmt_bind_param($stmtFind, 'ssi', $supervisor_user, $index_number, $visit_number);
mysqli_stmt_execute($stmtFind);
mysqli_stmt_bind_result($stmtFind, $foundId);
if (mysqli_stmt_fetch($stmtFind)) {
    $existingId = (int)$foundId;
}
mysqli_stmt_close($stmtFind);

if ($existingId > 0) {
    $upd = "UPDATE `$table` SET
        `specific_skill_1`='$s1', `specific_skill_1_score`=$s1v,
        `specific_skill_2`='$s2', `specific_skill_2_score`=$s2v,
        `specific_skill_3`='$s3', `specific_skill_3_score`=$s3v,
        `specific_skill_4`='$s4', `specific_skill_4_score`=$s4v,
        `specific_skill_5`='$s5', `specific_skill_5_score`=$s5v,
        `ability_to_complete_work_on_time`=$b1,
        `ability_to_follow_instructions_carefully`=$b2,
        `ability_to_take_initiatives`=$b3,
        `ability_to_work_with_little_supervision`=$b4,
        `adherence_to_organizations_rules`=$b5,
        `adherence_to_safety`=$b6,
        `resourcefulness`=$b7,
        `attendance_to_work`=$c1,
        `punctuality`=$c2,
        `desire_to_work`=$c3,
        `williness_to_accept_new_ideas`=$c4,
        `relationship_with_colleagues`=$d1,
        `relationship_with_supervisors`=$d2,
        `ability_to_control_emotions_when_provoked`=$d3,
        `grade`=$grade_score
        WHERE id=$existingId";
    if (!mysqli_query($conn, $upd)) {
        echo json_encode(['error' => 'Failed to update grade']);
        http_response_code(500);
        exit;
    }
} else {
    $ins = "INSERT INTO `$table` (
        `username`,
        `user_index`,
        `visit_number`,
        `specific_skill_1`, `specific_skill_1_score`,
        `specific_skill_2`, `specific_skill_2_score`,
        `specific_skill_3`, `specific_skill_3_score`,
        `specific_skill_4`, `specific_skill_4_score`,
        `specific_skill_5`, `specific_skill_5_score`,
        `ability_to_complete_work_on_time`,
        `ability_to_follow_instructions_carefully`,
        `ability_to_take_initiatives`,
        `ability_to_work_with_little_supervision`,
        `adherence_to_organizations_rules`,
        `adherence_to_safety`,
        `resourcefulness`,
        `attendance_to_work`,
        `punctuality`,
        `desire_to_work`,
        `williness_to_accept_new_ideas`,
        `relationship_with_colleagues`,
        `relationship_with_supervisors`,
        `ability_to_control_emotions_when_provoked`,
        `grade`
    ) VALUES (
        '$user',
        '$idx',
        $visit_number,
        '$s1', $s1v,
        '$s2', $s2v,
        '$s3', $s3v,
        '$s4', $s4v,
        '$s5', $s5v,
        $b1, $b2, $b3, $b4, $b5, $b6, $b7,
        $c1, $c2, $c3, $c4,
        $d1, $d2, $d3,
        $grade_score
    )";

    if (!mysqli_query($conn, $ins)) {
        echo json_encode(['error' => 'Failed to save grade']);
        http_response_code(500);
        exit;
    }
}

// Update industrial_registration for this student only (prepared + LIMIT 1).
$stmtReg = mysqli_prepare($conn, "SELECT 1 FROM industrial_registration WHERE index_number = ? LIMIT 1");
if ($stmtReg) {
    mysqli_stmt_bind_param($stmtReg, 's', $index_number);
    mysqli_stmt_execute($stmtReg);
    mysqli_stmt_store_result($stmtReg);
    $hasReg = mysqli_stmt_num_rows($stmtReg) === 1;
    mysqli_stmt_close($stmtReg);

    if ($hasReg) {
        if ($visit_number === 1) {
            $stmtUp = mysqli_prepare($conn, "UPDATE industrial_registration SET visiting_supervisor_grade = ? WHERE index_number = ? LIMIT 1");
        } else {
            $col2Check = mysqli_query($conn, "SHOW COLUMNS FROM industrial_registration LIKE 'visiting_supervisor_grade_2'");
            if (!$col2Check || mysqli_num_rows($col2Check) === 0) {
                mysqli_query($conn, "ALTER TABLE industrial_registration ADD COLUMN visiting_supervisor_grade_2 INT(11) NULL DEFAULT NULL AFTER visiting_supervisor_grade");
            }
            $stmtUp = mysqli_prepare($conn, "UPDATE industrial_registration SET visiting_supervisor_grade_2 = ? WHERE index_number = ? LIMIT 1");
        }
        if ($stmtUp) {
            mysqli_stmt_bind_param($stmtUp, 'is', $grade_score, $index_number);
            mysqli_stmt_execute($stmtUp);
            mysqli_stmt_close($stmtUp);
        }
    }
}

echo json_encode(['success' => true, 'grade' => $grade_score, 'index_number' => $index_number]);
exit;

