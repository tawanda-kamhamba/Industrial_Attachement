<?php
/**
 * GET  /supervisor/final-grades — assigned students with component scores + computed final
 * POST /supervisor/final-grades — save elogbook_mark and/or report_mark for one student
 */

if (($_SESSION['role'] ?? '') !== 'supervisor') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

require_once __DIR__ . '/supervisor_helpers.php';
require_once __DIR__ . '/grading_helpers.php';

iasms_ensure_supervisor_student_marks_table($conn);

// Ensure visit_number on visiting_supervisor_grade
$colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
    @mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
}

$assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
$supervisor_id = (int)($_SESSION['user_id'] ?? 0);
$supervisor_name = (string)($_SESSION['name'] ?? '');
$vsg_user = $supervisor_name !== '' ? mysqli_real_escape_string($conn, str_replace(' ', '', $supervisor_name)) : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];

    $index_number = trim((string)($body['index_number'] ?? ''));
    if ($index_number === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Student index number is required']);
        return;
    }
    if (!iasms_supervisor_can_access_student_index($conn, $index_number)) {
        http_response_code(403);
        echo json_encode(['error' => 'Student not assigned to you']);
        return;
    }

    $has_elogbook = array_key_exists('elogbook_mark', $body);
    $has_report = array_key_exists('report_mark', $body);
    if (!$has_elogbook && !$has_report) {
        http_response_code(400);
        echo json_encode(['error' => 'Provide elogbook_mark and/or report_mark']);
        return;
    }

    $elogbook_mark = $has_elogbook ? iasms_validate_mark_input($body['elogbook_mark']) : null;
    $report_mark = $has_report ? iasms_validate_mark_input($body['report_mark']) : null;

    if ($has_elogbook && $body['elogbook_mark'] !== null && $body['elogbook_mark'] !== '' && $elogbook_mark === null) {
        http_response_code(400);
        echo json_encode(['error' => 'E-logbook mark must be between 0 and 100']);
        return;
    }
    if ($has_report && $body['report_mark'] !== null && $body['report_mark'] !== '' && $report_mark === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Report mark must be between 0 and 100']);
        return;
    }

    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    // Load existing row
    $existing = ['elogbook_mark' => null, 'report_mark' => null];
    $sel = mysqli_query($conn, "SELECT elogbook_mark, report_mark FROM supervisor_student_marks WHERE index_number='$idx_esc' LIMIT 1");
    if ($sel && $row = mysqli_fetch_assoc($sel)) {
        $existing['elogbook_mark'] = $row['elogbook_mark'] !== null && $row['elogbook_mark'] !== '' ? (float)$row['elogbook_mark'] : null;
        $existing['report_mark'] = $row['report_mark'] !== null && $row['report_mark'] !== '' ? (float)$row['report_mark'] : null;
    }

    $new_elogbook = $has_elogbook ? $elogbook_mark : $existing['elogbook_mark'];
    $new_report = $has_report ? $report_mark : $existing['report_mark'];

    $elog_sql = $new_elogbook === null ? 'NULL' : (string)$new_elogbook;
    $rep_sql = $new_report === null ? 'NULL' : (string)$new_report;

    $chk = mysqli_query($conn, "SELECT id FROM supervisor_student_marks WHERE index_number='$idx_esc' LIMIT 1");
    if ($chk && mysqli_num_rows($chk) > 0) {
        $upd = "UPDATE supervisor_student_marks SET
            elogbook_mark=$elog_sql,
            report_mark=$rep_sql,
            supervisor_id=$supervisor_id
            WHERE index_number='$idx_esc' LIMIT 1";
        if (!mysqli_query($conn, $upd)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save marks']);
            return;
        }
    } else {
        $ins = "INSERT INTO supervisor_student_marks (index_number, supervisor_id, elogbook_mark, report_mark)
                VALUES ('$idx_esc', $supervisor_id, $elog_sql, $rep_sql)";
        if (!mysqli_query($conn, $ins)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save marks']);
            return;
        }
    }

    echo json_encode([
        'success' => true,
        'index_number' => $index_number,
        'elogbook_mark' => $new_elogbook,
        'report_mark' => $new_report,
    ]);
    return;
}

// GET
if (empty($assigned)) {
    echo json_encode(['weights' => iasms_final_grade_weights(), 'students' => []]);
    return;
}

$in_list = "'" . implode("','", array_map(function ($idx) use ($conn) {
    return mysqli_real_escape_string($conn, $idx);
}, $assigned)) . "'";

$by_index = [];
$q = "SELECT i.index_number AS student_index,
       i.first_name,
       i.last_name,
       i.company_supervisor_grade,
       COALESCE(sa.company_name,'') AS company_name
FROM industrial_registration i
LEFT JOIN students_assumption sa ON sa.index_number = i.index_number
WHERE i.index_number IN ($in_list)
ORDER BY i.index_number";
$res = mysqli_query($conn, $q);
while ($res && $row = mysqli_fetch_assoc($res)) {
    $idx = $row['student_index'] ?? '';
    if ($idx === '') {
        continue;
    }
    $company = $row['company_supervisor_grade'] !== null && $row['company_supervisor_grade'] !== ''
        ? (float)$row['company_supervisor_grade'] : null;
    $by_index[$idx] = [
        'student_index' => $idx,
        'first_name' => $row['first_name'] ?? '',
        'last_name' => $row['last_name'] ?? '',
        'company_name' => $row['company_name'] ?? '',
        'first_visit_grade' => null,
        'second_visit_grade' => null,
        'company_supervisor_grade' => $company,
        'elogbook_mark' => null,
        'report_mark' => null,
        'final_mark' => null,
        'letter_grade' => null,
        'is_complete' => false,
        'missing_components' => [],
    ];
}

// Visit scores (current supervisor)
if ($vsg_user !== '') {
    $vq = "SELECT user_index, visit_number, grade FROM visiting_supervisor_grade WHERE username='$vsg_user' AND user_index IN ($in_list)";
    $vr = mysqli_query($conn, $vq);
    if ($vr) {
        while ($vrow = mysqli_fetch_assoc($vr)) {
            $idx = $vrow['user_index'] ?? '';
            if ($idx === '' || !isset($by_index[$idx])) {
                continue;
            }
            $vn = (int)($vrow['visit_number'] ?? 1);
            $g = $vrow['grade'] !== null && $vrow['grade'] !== '' ? (float)$vrow['grade'] : null;
            if ($vn === 1) {
                $by_index[$idx]['first_visit_grade'] = $g;
            } elseif ($vn === 2) {
                $by_index[$idx]['second_visit_grade'] = $g;
            }
        }
    }
}

// Fallback visit grades from industrial_registration
$regQ = mysqli_query($conn, "SHOW COLUMNS FROM industrial_registration LIKE 'visiting_supervisor_grade_2'");
$has_v2 = $regQ && mysqli_num_rows($regQ) > 0;
$regCols = 'index_number, visiting_supervisor_grade' . ($has_v2 ? ', visiting_supervisor_grade_2' : '');
$regRes = mysqli_query($conn, "SELECT $regCols FROM industrial_registration WHERE index_number IN ($in_list)");
if ($regRes) {
    while ($rrow = mysqli_fetch_assoc($regRes)) {
        $idx = $rrow['index_number'] ?? '';
        if ($idx === '' || !isset($by_index[$idx])) {
            continue;
        }
        if ($by_index[$idx]['first_visit_grade'] === null && isset($rrow['visiting_supervisor_grade']) && $rrow['visiting_supervisor_grade'] !== '' && $rrow['visiting_supervisor_grade'] !== null) {
            $by_index[$idx]['first_visit_grade'] = (float)$rrow['visiting_supervisor_grade'];
        }
        if ($has_v2 && $by_index[$idx]['second_visit_grade'] === null && isset($rrow['visiting_supervisor_grade_2']) && $rrow['visiting_supervisor_grade_2'] !== '' && $rrow['visiting_supervisor_grade_2'] !== null) {
            $by_index[$idx]['second_visit_grade'] = (float)$rrow['visiting_supervisor_grade_2'];
        }
    }
}

// Company grade fallback from company_supervisor_grade table
foreach (array_keys($by_index) as $idx) {
    if ($by_index[$idx]['company_supervisor_grade'] !== null) {
        continue;
    }
    $idx_esc = mysqli_real_escape_string($conn, $idx);
    $cq = mysqli_query($conn, "SELECT grade FROM company_supervisor_grade WHERE user_index='$idx_esc' ORDER BY date DESC LIMIT 1");
    if ($cq && $crow = mysqli_fetch_assoc($cq)) {
        if ($crow['grade'] !== null && $crow['grade'] !== '') {
            $by_index[$idx]['company_supervisor_grade'] = (float)$crow['grade'];
        }
    }
}

// Supervisor-entered elogbook + report marks
$marksRes = mysqli_query($conn, "SELECT index_number, elogbook_mark, report_mark FROM supervisor_student_marks WHERE index_number IN ($in_list)");
if ($marksRes) {
    while ($mrow = mysqli_fetch_assoc($marksRes)) {
        $idx = $mrow['index_number'] ?? '';
        if ($idx === '' || !isset($by_index[$idx])) {
            continue;
        }
        if ($mrow['elogbook_mark'] !== null && $mrow['elogbook_mark'] !== '') {
            $by_index[$idx]['elogbook_mark'] = (float)$mrow['elogbook_mark'];
        }
        if ($mrow['report_mark'] !== null && $mrow['report_mark'] !== '') {
            $by_index[$idx]['report_mark'] = (float)$mrow['report_mark'];
        }
    }
}

foreach ($by_index as $idx => &$student) {
    $missing = iasms_missing_final_components(
        $student['first_visit_grade'],
        $student['second_visit_grade'],
        $student['company_supervisor_grade'],
        $student['report_mark'],
        $student['elogbook_mark']
    );
    $student['missing_components'] = $missing;
    $student['is_complete'] = count($missing) === 0;
    $final = iasms_compute_weighted_final_mark(
        $student['first_visit_grade'],
        $student['second_visit_grade'],
        $student['company_supervisor_grade'],
        $student['report_mark'],
        $student['elogbook_mark']
    );
    $student['final_mark'] = $final;
    $student['letter_grade'] = iasms_score_to_letter($final);
}
unset($student);

echo json_encode([
    'weights' => iasms_final_grade_weights(),
    'students' => array_values($by_index),
]);
