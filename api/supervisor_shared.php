<?php
/**
 * Shared helper functions for supervisor dashboard APIs.
 *
 * Computes the list of students assigned to the currently logged-in supervisor
 * and the corresponding visit/score summary. This mirrors the logic used in
 * the legacy institutional supervisor dashboard PHP page.
 */

/**
 * Build students list and summary for a supervisor.
 *
 * @param mysqli $conn
 * @param string $supervisorId   Supervisor ID from session (visiting_lecturers.id)
 * @param string $supervisorName Supervisor display name from session
 * @return array{0: array<int, array<string,mixed>>, 1: array<string,int>}
 */
function iasms_get_supervisor_students_and_summary(mysqli $conn, string $supervisorId, string $supervisorName): array
{
    // Ensure we have a valid supervisor context
    $supervisorId = trim($supervisorId);
    $supervisorName = trim($supervisorName);

    if ($supervisorId === '' || $supervisorName === '' || !ctype_digit($supervisorId)) {
        return [[], [
            'total_students' => 0,
            'first_visit' => 0,
            'second_visit' => 0,
            'first_visit_with_scoresheet' => 0,
            'second_visit_with_scoresheet' => 0,
        ]];
    }

    $summary = [
        'total_students' => 0,
        'first_visit' => 0,
        'second_visit' => 0,
        'first_visit_with_scoresheet' => 0,
        'second_visit_with_scoresheet' => 0,
    ];

    $students = [];
    $seen_index = [];

    // Load all direct per-student supervisor assignments once (if table exists).
    // This lets us enforce "override": if a student is directly assigned to a supervisor,
    // they must ONLY appear for that supervisor (not via region/faculty grid).
    $direct_by_index = [];
    $ssa_all = @mysqli_query($conn, "SELECT index_number, lecturer_id FROM student_supervisor_assignments");
    if ($ssa_all) {
        while ($row = mysqli_fetch_assoc($ssa_all)) {
            $idx = trim((string)($row['index_number'] ?? ''));
            $lid = (string)($row['lecturer_id'] ?? '');
            if ($idx !== '' && ctype_digit($lid)) {
                $direct_by_index[$idx] = (int)$lid;
            }
        }
    }

    // Faculty code mapping copied from institutional_supervisor/dashboard.php
    $faculty_db_map = [
        'AGR' => ['AGR'],
        'ARTS' => ['ARTS'],
        'COM' => ['COM', 'FAST'],
        'CIE' => ['CIE'],
        'EDU' => ['EDU'],
        'ENG' => ['ENG', 'FOE'],
        'LAW' => ['LAW'],
        'MED' => ['MED'],
        'SCI' => ['SCI', 'FBNE'],
        'SOC' => ['SOC', 'FBMS'],
        'VET' => ['VET', 'FHAS'],
    ];
    $faculty_codes = ['agr', 'arts', 'com', 'cie', 'edu', 'eng', 'law', 'med', 'sci', 'soc', 'vet'];
    $faculties_upper = ['AGR', 'ARTS', 'COM', 'CIE', 'EDU', 'ENG', 'LAW', 'MED', 'SCI', 'SOC', 'VET'];

    $supervisor_name_esc = mysqli_real_escape_string($conn, $supervisorName);

    // Pull all region/faculty assignments where this supervisor is first or second supervisor
    $al_res = mysqli_query(
        $conn,
        "SELECT regions,
                first_supervisor_agr, second_supervisor_agr,
                first_supervisor_arts, second_supervisor_arts,
                first_supervisor_com, second_supervisor_com,
                first_supervisor_cie, second_supervisor_cie,
                first_supervisor_edu, second_supervisor_edu,
                first_supervisor_eng, second_supervisor_eng,
                first_supervisor_law, second_supervisor_law,
                first_supervisor_med, second_supervisor_med,
                first_supervisor_sci, second_supervisor_sci,
                first_supervisor_soc, second_supervisor_soc,
                first_supervisor_vet, second_supervisor_vet
         FROM assigned_lecturers"
    );

    if ($al_res && $supervisorName !== '') {
        while ($al = mysqli_fetch_assoc($al_res)) {
            $region = $al['regions'] ?? '';
            if ($region === '') {
                continue;
            }
            $region_esc = mysqli_real_escape_string($conn, $region);

            foreach ($faculty_codes as $i => $f) {
                $first = trim($al["first_supervisor_{$f}"] ?? '');
                $second = trim($al["second_supervisor_{$f}"] ?? '');

                if ($first !== $supervisorName && $second !== $supervisorName) {
                    continue;
                }

                $fac_canonical = $faculties_upper[$i];
                $fac_list = $faculty_db_map[$fac_canonical] ?? [$fac_canonical];
                $fac_in = "'" . implode(
                    "','",
                    array_map(
                        static function (string $x) use ($conn): string {
                            return mysqli_real_escape_string($conn, $x);
                        },
                        $fac_list
                    )
                ) . "'";

                // Get students in this region/faculty combination
                $stu_res = mysqli_query(
                    $conn,
                    "SELECT index_number
                     FROM industrial_registration
                     WHERE attachment_region = '$region_esc'
                       AND faculty IN ($fac_in)"
                );
                if (!$stu_res) {
                    continue;
                }

                while ($stu = mysqli_fetch_assoc($stu_res)) {
                    $idx = $stu['index_number'] ?? '';
                    // Direct assignment overrides grid assignment:
                    // if the student is directly assigned to some supervisor, do not include them here.
                    if ($idx !== '' && isset($direct_by_index[$idx])) {
                        continue;
                    }
                    if ($idx !== '' && !isset($seen_index[$idx])) {
                        $seen_index[$idx] = true;
                        $idx_esc = mysqli_real_escape_string($conn, $idx);
                        $qi = "SELECT i.index_number AS student_index,
                                       i.first_name,
                                       i.last_name,
                                       COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS attachment_region,
                                       COALESCE(sa.company_name,'') AS company_name,
                                       COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS company_region,
                                       1 AS visit_number
                                FROM industrial_registration i
                                LEFT JOIN students_assumption sa
                                  ON sa.index_number = i.index_number
                                WHERE i.index_number = '$idx_esc'";
                        $ri = mysqli_query($conn, $qi);
                        if ($ri && ($row = mysqli_fetch_assoc($ri))) {
                            $students[] = $row;
                        }
                    }
                }
            }
        }
    }

    // Also include any students directly assigned to this supervisor (per-student override)
    // Table may not exist in older installs; ignore failures.
    $sid = (int)$supervisorId;
    $ssa_res = @mysqli_query(
        $conn,
        "SELECT ssa.index_number
         FROM student_supervisor_assignments ssa
         WHERE ssa.lecturer_id = $sid"
    );
    if ($ssa_res) {
        while ($row = mysqli_fetch_assoc($ssa_res)) {
            $idx = $row['index_number'] ?? '';
            if ($idx !== '' && !isset($seen_index[$idx])) {
                $seen_index[$idx] = true;
                $idx_esc = mysqli_real_escape_string($conn, $idx);
                $qi = "SELECT i.index_number AS student_index,
                               i.first_name,
                               i.last_name,
                               COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS attachment_region,
                               COALESCE(sa.company_name,'') AS company_name,
                               COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS company_region,
                               1 AS visit_number
                        FROM industrial_registration i
                        LEFT JOIN students_assumption sa
                          ON sa.index_number = i.index_number
                        WHERE i.index_number = '$idx_esc'";
                $ri = mysqli_query($conn, $qi);
                if ($ri && ($row2 = mysqli_fetch_assoc($ri))) {
                    $students[] = $row2;
                }
            }
        }
    }

    $summary['total_students'] = count($students);
    $assigned_indexes = array_keys($seen_index);

    // Visit/scoresheet counts: use student list only (no institutional_supervisor_students)
    if (!empty($assigned_indexes)) {
        // Ensure visit_number column exists on visiting_supervisor_grade (first/second visit support)
        $colCheck = mysqli_query($conn, "SHOW COLUMNS FROM visiting_supervisor_grade LIKE 'visit_number'");
        if (!$colCheck || mysqli_num_rows($colCheck) === 0) {
            @mysqli_query($conn, "ALTER TABLE visiting_supervisor_grade ADD COLUMN visit_number TINYINT(1) NOT NULL DEFAULT 1 AFTER user_index");
        }

        $in_list = "'" . implode(
            "','",
            array_map(
                static function (string $idx) use ($conn): string {
                    return mysqli_real_escape_string($conn, $idx);
                },
                $assigned_indexes
            )
        ) . "'";

        // First visits: all assigned students
        $summary['first_visit'] = count($assigned_indexes);

        // Scoresheets submitted (first visit)
        $res_first_scores = mysqli_query(
            $conn,
            "SELECT COUNT(DISTINCT vsg.user_index) AS c
             FROM visiting_supervisor_grade vsg
             WHERE vsg.user_index IN ($in_list)
               AND COALESCE(vsg.visit_number, 1) = 1"
        );
        $first_with = 0;
        if ($res_first_scores && ($row = mysqli_fetch_assoc($res_first_scores))) {
            $first_with = (int)($row['c'] ?? 0);
        }
        $summary['first_visit_with_scoresheet'] = $first_with;

        // Second visits: students who have completed first visit (eligible for second)
        $summary['second_visit'] = $first_with;

        // Scoresheets submitted (second visit)
        $res_second_scores = mysqli_query(
            $conn,
            "SELECT COUNT(DISTINCT vsg.user_index) AS c
             FROM visiting_supervisor_grade vsg
             WHERE vsg.user_index IN ($in_list)
               AND vsg.visit_number = 2"
        );
        if ($res_second_scores && ($row2 = mysqli_fetch_assoc($res_second_scores))) {
            $summary['second_visit_with_scoresheet'] = (int)($row2['c'] ?? 0);
        } else {
            $summary['second_visit_with_scoresheet'] = 0;
        }
    }

    return [$students, $summary];
}

/**
 * Check if a student (by index_number) is assigned to a lecturer (by name) via assigned_lecturers.
 *
 * @param mysqli $conn
 * @param string $studentIndex
 * @param string $lecturerName
 * @return bool
 */
function iasms_is_student_assigned_to_lecturer(mysqli $conn, string $studentIndex, string $lecturerName): bool
{
    $studentIndex = trim($studentIndex);
    $lecturerName = trim($lecturerName);
    if ($studentIndex === '' || $lecturerName === '') {
        return false;
    }
    $idx_esc = mysqli_real_escape_string($conn, $studentIndex);

    // First: direct per-student assignment (if table exists)
    $name_esc = mysqli_real_escape_string($conn, $lecturerName);
    $direct = @mysqli_query(
        $conn,
        "SELECT 1
         FROM student_supervisor_assignments ssa
         JOIN visiting_lecturers vl ON vl.id = ssa.lecturer_id
         WHERE ssa.index_number = '$idx_esc'
           AND BINARY vl.lecturer_name = '$name_esc'
         LIMIT 1"
    );
    if ($direct && mysqli_num_rows($direct) > 0) {
        return true;
    }

    // If the student has ANY direct assignment, and it wasn't this lecturer, then they are NOT assigned to this lecturer.
    // This enforces "override": grid assignment must not apply when a per-student assignment exists.
    $has_direct = @mysqli_query(
        $conn,
        "SELECT 1
         FROM student_supervisor_assignments ssa
         WHERE ssa.index_number = '$idx_esc'
         LIMIT 1"
    );
    if ($has_direct && mysqli_num_rows($has_direct) > 0) {
        return false;
    }

    $r = mysqli_query(
        $conn,
        "SELECT i.faculty,
                COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS region
         FROM industrial_registration i
         LEFT JOIN students_assumption sa ON sa.index_number = i.index_number
         WHERE i.index_number = '$idx_esc' LIMIT 1"
    );
    if (!$r || mysqli_num_rows($r) !== 1) {
        return false;
    }
    $row = mysqli_fetch_assoc($r);
    $faculty = trim($row['faculty'] ?? '');
    $region = trim($row['region'] ?? '');
    if ($region === '') {
        return false;
    }
    $faculty_db_map = [
        'AGR' => 'agr', 'ARTS' => 'arts', 'COM' => 'com', 'FAST' => 'com', 'CIE' => 'cie', 'EDU' => 'edu',
        'ENG' => 'eng', 'FOE' => 'eng', 'LAW' => 'law', 'MED' => 'med', 'SCI' => 'sci', 'FBNE' => 'sci',
        'SOC' => 'soc', 'FBMS' => 'soc', 'VET' => 'vet', 'FHAS' => 'vet',
    ];
    $fac_key = $faculty_db_map[strtoupper($faculty)] ?? strtolower(preg_replace('/\s+/', '', $faculty));
    if ($fac_key === '') {
        return false;
    }
    $fac_key = strtolower($fac_key);
    $region_esc = mysqli_real_escape_string($conn, $region);
    $col_first = 'first_supervisor_' . $fac_key;
    $col_second = 'second_supervisor_' . $fac_key;
    $check = mysqli_query(
        $conn,
        "SELECT 1 FROM assigned_lecturers
         WHERE regions = '$region_esc'
           AND (BINARY `$col_first` = '$name_esc' OR BINARY `$col_second` = '$name_esc')
         LIMIT 1"
    );
    return $check && mysqli_num_rows($check) > 0;
}

