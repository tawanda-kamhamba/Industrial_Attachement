<?php
/**
 * Shared grading utilities for supervisor final marks.
 */

/** @return array<string, int> component key => weight percent (sums to 100) */
function iasms_final_grade_weights(): array
{
    return [
        'first_visit' => 20,
        'second_visit' => 20,
        'company' => 20,
        'report' => 20,
        'elogbook' => 20,
    ];
}

/** Ensure company_supervisor_grade.id is PRIMARY KEY + AUTO_INCREMENT (older DBs may lack this). */
function iasms_ensure_company_supervisor_grade_autoincrement(mysqli $conn): void
{
    $tableCheck = @mysqli_query($conn, "SHOW TABLES LIKE 'company_supervisor_grade'");
    if (!$tableCheck || mysqli_num_rows($tableCheck) === 0) {
        return;
    }

    $colCheck = @mysqli_query($conn, "SHOW COLUMNS FROM company_supervisor_grade WHERE Field = 'id'");
    if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
        return;
    }

    $col = mysqli_fetch_assoc($colCheck) ?: [];
    $extra = strtolower((string)($col['Extra'] ?? ''));
    if (strpos($extra, 'auto_increment') !== false) {
        return;
    }

    // Duplicate or zero ids cause #1062 when enabling AUTO_INCREMENT — resequence first.
    $pkCheck = @mysqli_query($conn, "SHOW KEYS FROM company_supervisor_grade WHERE Key_name = 'PRIMARY'");
    if ($pkCheck && mysqli_num_rows($pkCheck) > 0) {
        @mysqli_query($conn, 'ALTER TABLE company_supervisor_grade DROP PRIMARY KEY');
    }

    @mysqli_query($conn, 'SET @iasms_csg_id := 0');
    @mysqli_query(
        $conn,
        'UPDATE company_supervisor_grade SET `id` = (@iasms_csg_id := @iasms_csg_id + 1) ORDER BY `date` ASC, `id` ASC'
    );

    $next = 1;
    $maxRes = @mysqli_query($conn, 'SELECT COALESCE(MAX(`id`), 0) + 1 AS n FROM company_supervisor_grade');
    if ($maxRes && ($maxRow = mysqli_fetch_assoc($maxRes))) {
        $next = max(1, (int)($maxRow['n'] ?? 1));
    }

    @mysqli_query(
        $conn,
        "ALTER TABLE company_supervisor_grade MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, AUTO_INCREMENT=$next"
    );
}

function iasms_ensure_supervisor_student_marks_table(mysqli $conn): void
{
    @mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS supervisor_student_marks (
            id INT(11) NOT NULL AUTO_INCREMENT,
            index_number VARCHAR(100) NOT NULL,
            supervisor_id INT(11) NOT NULL,
            elogbook_mark DECIMAL(5,2) DEFAULT NULL,
            report_mark DECIMAL(5,2) DEFAULT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_index_number (index_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=latin1"
    );
}

function iasms_validate_mark_input($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value)) {
        return null;
    }
    $n = (float)$value;
    if ($n < 0 || $n > 100) {
        return null;
    }
    return round($n, 2);
}

/**
 * Weighted final mark (0–100). Returns null until all five components are present.
 */
function iasms_compute_weighted_final_mark(
    ?float $first_visit,
    ?float $second_visit,
    ?float $company,
    ?float $report,
    ?float $elogbook
): ?float {
    $parts = [
        'first_visit' => $first_visit,
        'second_visit' => $second_visit,
        'company' => $company,
        'report' => $report,
        'elogbook' => $elogbook,
    ];
    foreach ($parts as $v) {
        if ($v === null) {
            return null;
        }
    }
    $weights = iasms_final_grade_weights();
    $total = 0.0;
    foreach ($parts as $key => $score) {
        $total += ($score * $weights[$key]) / 100;
    }
    return round($total, 2);
}

/**
 * Institutional class grade from final mark (0–100).
 * 1 (85+), 2.1 (70-84), 2.2 (60-69), 3 (50-59), F (below 50)
 */
function iasms_score_to_letter(?float $mark): ?string
{
    if ($mark === null) {
        return null;
    }
    if ($mark >= 85) {
        return '1';
    }
    if ($mark >= 70) {
        return '2.1';
    }
    if ($mark >= 60) {
        return '2.2';
    }
    if ($mark >= 50) {
        return '3';
    }
    return 'F';
}

/** @return string[] keys among first_visit, second_visit, company, report, elogbook */
function iasms_missing_final_components(
    ?float $first_visit,
    ?float $second_visit,
    ?float $company,
    ?float $report,
    ?float $elogbook
): array {
    $map = [
        'first_visit' => $first_visit,
        'second_visit' => $second_visit,
        'company' => $company,
        'report' => $report,
        'elogbook' => $elogbook,
    ];
    $missing = [];
    foreach ($map as $key => $val) {
        if ($val === null) {
            $missing[] = $key;
        }
    }
    return $missing;
}

/**
 * Load component scores + computed final/class for many students.
 *
 * @param string[] $indexes
 * @param string|null $visiting_supervisor_user Username without spaces; null loads best visit score per student (admin).
 * @return array<string, array<string, mixed>>
 */
function iasms_load_final_grades_for_indexes(mysqli $conn, array $indexes, ?string $visiting_supervisor_user = null): array
{
    iasms_ensure_supervisor_student_marks_table($conn);

    $colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
    if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
        @mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
    }

    $indexes = array_values(array_unique(array_filter(array_map('strval', $indexes))));
    if (empty($indexes)) {
        return [];
    }

    $by_index = [];
    foreach ($indexes as $idx) {
        $by_index[$idx] = [
            'first_visit_grade' => null,
            'second_visit_grade' => null,
            'company_supervisor_grade' => null,
            'elogbook_mark' => null,
            'report_mark' => null,
            'final_mark' => null,
            'letter_grade' => null,
            'is_complete' => false,
        ];
    }

    $in_list = "'" . implode("','", array_map(function ($idx) use ($conn) {
        return mysqli_real_escape_string($conn, $idx);
    }, $indexes)) . "'";

    $regQ = mysqli_query($conn, "SELECT index_number, company_supervisor_grade, visiting_supervisor_grade FROM industrial_registration WHERE index_number IN ($in_list)");
    $has_v2 = false;
    $v2Check = mysqli_query($conn, "SHOW COLUMNS FROM industrial_registration LIKE 'visiting_supervisor_grade_2'");
    if ($v2Check && mysqli_num_rows($v2Check) > 0) {
        $has_v2 = true;
        $regQ = mysqli_query(
            $conn,
            "SELECT index_number, company_supervisor_grade, visiting_supervisor_grade, visiting_supervisor_grade_2
             FROM industrial_registration WHERE index_number IN ($in_list)"
        );
    }

    if ($regQ) {
        while ($row = mysqli_fetch_assoc($regQ)) {
            $idx = $row['index_number'] ?? '';
            if ($idx === '' || !isset($by_index[$idx])) {
                continue;
            }
            if ($row['company_supervisor_grade'] !== null && $row['company_supervisor_grade'] !== '') {
                $by_index[$idx]['company_supervisor_grade'] = (float)$row['company_supervisor_grade'];
            }
            if ($row['visiting_supervisor_grade'] !== null && $row['visiting_supervisor_grade'] !== '') {
                $by_index[$idx]['first_visit_grade'] = (float)$row['visiting_supervisor_grade'];
            }
            if ($has_v2 && isset($row['visiting_supervisor_grade_2']) && $row['visiting_supervisor_grade_2'] !== null && $row['visiting_supervisor_grade_2'] !== '') {
                $by_index[$idx]['second_visit_grade'] = (float)$row['visiting_supervisor_grade_2'];
            }
        }
    }

    $visitSql = "SELECT user_index, visit_number, grade FROM visiting_supervisor_grade WHERE user_index IN ($in_list)";
    if ($visiting_supervisor_user !== null && $visiting_supervisor_user !== '') {
        $userEsc = mysqli_real_escape_string($conn, $visiting_supervisor_user);
        $visitSql .= " AND username='$userEsc'";
    }
    $vr = mysqli_query($conn, $visitSql);
    if ($vr) {
        while ($vrow = mysqli_fetch_assoc($vr)) {
            $idx = $vrow['user_index'] ?? '';
            if ($idx === '' || !isset($by_index[$idx])) {
                continue;
            }
            $vn = (int)($vrow['visit_number'] ?? 1);
            $g = $vrow['grade'] !== null && $vrow['grade'] !== '' ? (float)$vrow['grade'] : null;
            if ($g === null) {
                continue;
            }
            if ($vn === 1) {
                $cur = $by_index[$idx]['first_visit_grade'];
                $by_index[$idx]['first_visit_grade'] = $cur === null ? $g : max($cur, $g);
            } elseif ($vn === 2) {
                $cur = $by_index[$idx]['second_visit_grade'];
                $by_index[$idx]['second_visit_grade'] = $cur === null ? $g : max($cur, $g);
            }
        }
    }

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

    return $by_index;
}

/**
 * @param array<int, array<string, mixed>> $rows
 * @param array<string, array<string, mixed>> $gradesByIndex
 */
function iasms_attach_grades_to_rows(array &$rows, array $gradesByIndex, string $indexField = 'index_number'): void
{
    foreach ($rows as &$row) {
        $idx = (string)($row[$indexField] ?? '');
        if ($idx === '' || !isset($gradesByIndex[$idx])) {
            $row['final_mark'] = null;
            $row['letter_grade'] = null;
            $row['elogbook_mark'] = null;
            $row['report_mark'] = null;
            continue;
        }
        $g = $gradesByIndex[$idx];
        $row['final_mark'] = $g['final_mark'];
        $row['letter_grade'] = $g['letter_grade'];
        $row['elogbook_mark'] = $g['elogbook_mark'];
        $row['report_mark'] = $g['report_mark'];
    }
    unset($row);
}

/**
 * Student dashboard: assessments actually received (scoresheet submitted).
 * Ignores industrial_registration placeholder zeros set at attachment registration.
 *
 * @return array<string, mixed>
 */
function iasms_student_assessments_received(mysqli $conn, string $index_number): array
{
    iasms_ensure_company_supervisor_grade_autoincrement($conn);

    $idx_esc = mysqli_real_escape_string($conn, $index_number);

    $colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
    if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
        @mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
    }

    $first_received = false;
    $second_received = false;
    $first_grade = null;
    $second_grade = null;

    $vq = "SELECT visit_number, grade FROM visiting_supervisor_grade WHERE user_index='$idx_esc'";
    $vr = mysqli_query($conn, $vq);
    if ($vr) {
        while ($vrow = mysqli_fetch_assoc($vr)) {
            if ($vrow['grade'] === null || $vrow['grade'] === '') {
                continue;
            }
            $vn = (int)($vrow['visit_number'] ?? 1);
            $g = (float)$vrow['grade'];
            if ($vn === 2) {
                $second_received = true;
                $second_grade = $g;
            } else {
                $first_received = true;
                $first_grade = $g;
            }
        }
    }

    $company_received = false;
    $company_grade = null;
    $company_date = null;
    $cq = "SELECT grade, date FROM company_supervisor_grade WHERE user_index='$idx_esc' ORDER BY date DESC LIMIT 1";
    $cr = mysqli_query($conn, $cq);
    if ($cr && ($crow = mysqli_fetch_assoc($cr))) {
        if ($crow['grade'] !== null && $crow['grade'] !== '') {
            $company_received = true;
            $company_grade = (float)$crow['grade'];
            $company_date = $crow['date'] ?? null;
        }
    }

    $assessments_received = ($first_received ? 1 : 0) + ($second_received ? 1 : 0) + ($company_received ? 1 : 0);

    return [
        'assessmentsReceived' => $assessments_received,
        'assessmentsExpected' => 3,
        'firstVisitReceived' => $first_received,
        'secondVisitReceived' => $second_received,
        'companyReceived' => $company_received,
        'firstVisitGrade' => $first_grade,
        'secondVisitGrade' => $second_grade,
        'companySupervisorGrade' => $company_grade,
        'visitingSupervisorGrade' => $first_grade,
        'visitingDate' => null,
        'companyDate' => $company_date,
    ];
}
