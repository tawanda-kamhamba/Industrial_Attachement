<?php
// POST: submit supervisor grade (visiting or company). Requires student session.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Method not allowed']);
    http_response_code(405);
    exit;
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    exit;
}

$index_number = $_SESSION['index_number'] ?? '';
$name = $_SESSION['name'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$type = $body['type'] ?? '';
if ($type !== 'visiting' && $type !== 'company') {
    echo json_encode(['error' => 'Invalid type']);
    http_response_code(400);
    exit;
}

$student_full_name = str_replace(' ', '', $name);
$idx = mysqli_real_escape_string($conn, $index_number);
$user = mysqli_real_escape_string($conn, $student_full_name);

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

$grade_score = $s1v + $s2v + $s3v + $s4v + $s5v + $b1 + $b2 + $b3 + $b4 + $b5 + $b6 + $b7 + $c1 + $c2 + $c3 + $c4 + $d1 + $d2 + $d3 + 5;

$table = $type === 'visiting' ? 'visiting_supervisor_grade' : 'company_supervisor_grade';
$col = $type === 'visiting' ? 'visiting_supervisor_grade' : 'company_supervisor_grade';

if ($type === 'company') {
    require_once __DIR__ . '/grading_helpers.php';
    iasms_ensure_company_supervisor_grade_autoincrement($conn);
}

$ins = "INSERT INTO `$table` (`username`, `user_index`, `specific_skill_1`, `specific_skill_1_score`, `specific_skill_2`, `specific_skill_2_score`, `specific_skill_3`, `specific_skill_3_score`, `specific_skill_4`, `specific_skill_4_score`, `specific_skill_5`, `specific_skill_5_score`, `ability_to_complete_work_on_time`, `ability_to_follow_instructions_carefully`, `ability_to_take_initiatives`, `ability_to_work_with_little_supervision`, `adherence_to_organizations_rules`, `adherence_to_safety`, `resourcefulness`, `attendance_to_work`, `punctuality`, `desire_to_work`, `williness_to_accept_new_ideas`, `relationship_with_colleagues`, `relationship_with_supervisors`, `ability_to_control_emotions_when_provoked`, `grade`) VALUES ('$user', '$idx', '$s1', $s1v, '$s2', $s2v, '$s3', $s3v, '$s4', $s4v, '$s5', $s5v, $b1, $b2, $b3, $b4, $b5, $b6, $b7, $c1, $c2, $c3, $c4, $d1, $d2, $d3, $grade_score)";

if (!mysqli_query($conn, $ins)) {
    echo json_encode(['error' => 'Failed to save grade']);
    http_response_code(500);
    exit;
}

$chk = mysqli_query($conn, "SELECT 1 FROM industrial_registration WHERE index_number='$idx' LIMIT 1");
if ($chk && mysqli_num_rows($chk) === 1) {
    mysqli_query($conn, "UPDATE industrial_registration SET `$col` = '$grade_score' WHERE index_number = '$idx'");
}

echo json_encode(['success' => true, 'grade' => $grade_score]);
exit;
