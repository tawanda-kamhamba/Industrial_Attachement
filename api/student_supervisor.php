<?php
// GET: current student's assigned institutional supervisor (details).
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    http_response_code(401);
    return;
}

$index_number = $_SESSION['index_number'] ?? '';
if ($index_number === '') {
    echo json_encode(['error' => 'Session invalid']);
    http_response_code(401);
    return;
}

// Ensure table exists (same schema as admin endpoint).
$sql = "CREATE TABLE IF NOT EXISTS student_supervisor_assignments (
    index_number VARCHAR(64) NOT NULL PRIMARY KEY,
    lecturer_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)";
@mysqli_query($conn, $sql);

$idx = mysqli_real_escape_string($conn, $index_number);

$assigned = null;
$other_assigned = null;
$q = "SELECT
        ssa.lecturer_id,
        ssa.assigned_at,
        vl.lecturer_name,
        vl.lecturer_faculty,
        vl.lecturer_department,
        vl.lecturer_region_residence,
        vl.staff_id
      FROM student_supervisor_assignments ssa
      JOIN visiting_lecturers vl ON vl.id = ssa.lecturer_id
      WHERE ssa.index_number = '$idx'
      LIMIT 1";
$r = mysqli_query($conn, $q);
if ($r && mysqli_num_rows($r) === 1) {
    $row = mysqli_fetch_assoc($r);
    $assigned = [
        'lecturer_id' => (int)($row['lecturer_id'] ?? 0),
        'lecturer_name' => $row['lecturer_name'] ?? '',
        'lecturer_faculty' => $row['lecturer_faculty'] ?? '',
        'lecturer_department' => $row['lecturer_department'] ?? '',
        'lecturer_region_residence' => $row['lecturer_region_residence'] ?? '',
        'staff_id' => $row['staff_id'] ?? null,
        'assigned_at' => $row['assigned_at'] ?? null,
    ];
}

// Fallback: if the student is NOT specifically assigned a supervisor,
// derive institutional supervisors from assigned_lecturers using attachment_region + faculty.
if ($assigned === null) {
    $q2 = "SELECT i.faculty,
                  COALESCE(NULLIF(TRIM(sa.company_region),''), i.attachment_region) AS region
           FROM industrial_registration i
           LEFT JOIN students_assumption sa ON sa.index_number = i.index_number
           WHERE i.index_number='$idx'
           LIMIT 1";
    $r2 = mysqli_query($conn, $q2);
    if ($r2 && mysqli_num_rows($r2) === 1) {
        $row2 = mysqli_fetch_assoc($r2);
        $faculty = strtoupper(trim((string)($row2['faculty'] ?? '')));
        $region = trim((string)($row2['region'] ?? ''));

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

        $fac_key = '';
        foreach ($faculty_db_map as $canonical => $list) {
            if ($faculty !== '' && in_array($faculty, $list, true)) {
                $fac_key = strtolower($canonical);
                break;
            }
        }

        $allowed_fac_keys = ['agr', 'arts', 'com', 'cie', 'edu', 'eng', 'law', 'med', 'sci', 'soc', 'vet'];
        if ($fac_key !== '' && in_array($fac_key, $allowed_fac_keys, true) && $region !== '') {
            $region_esc = mysqli_real_escape_string($conn, $region);
            $col_first = 'first_supervisor_' . $fac_key;
            $col_second = 'second_supervisor_' . $fac_key;

            $q3 = "SELECT $col_first AS first_name, $col_second AS second_name
                   FROM assigned_lecturers
                   WHERE regions='$region_esc'
                   LIMIT 1";
            $r3 = mysqli_query($conn, $q3);
            if ($r3 && mysqli_num_rows($r3) === 1) {
                $row3 = mysqli_fetch_assoc($r3);
                $first_name = trim((string)($row3['first_name'] ?? ''));
                $second_name = trim((string)($row3['second_name'] ?? ''));

                $buildSupervisor = static function (mysqli $conn, string $name): ?array {
                    if ($name === '') return null;
                    $name_esc = mysqli_real_escape_string($conn, $name);
                    $rr = @mysqli_query(
                        $conn,
                        "SELECT id, lecturer_name, lecturer_faculty, lecturer_department, lecturer_region_residence, staff_id
                         FROM visiting_lecturers
                         WHERE BINARY lecturer_name='$name_esc'
                         LIMIT 1"
                    );
                    if (!$rr || mysqli_num_rows($rr) !== 1) return null;
                    $x = mysqli_fetch_assoc($rr);
                    return [
                        'lecturer_id' => (int)($x['id'] ?? 0),
                        'lecturer_name' => $x['lecturer_name'] ?? '',
                        'lecturer_faculty' => $x['lecturer_faculty'] ?? '',
                        'lecturer_department' => $x['lecturer_department'] ?? '',
                        'lecturer_region_residence' => $x['lecturer_region_residence'] ?? '',
                        'staff_id' => $x['staff_id'] ?? null,
                        'assigned_at' => null,
                    ];
                };

                $firstObj = $buildSupervisor($conn, $first_name);
                $secondObj = $buildSupervisor($conn, $second_name);

                if ($firstObj) {
                    $assigned = $firstObj;
                } elseif ($secondObj) {
                    $assigned = $secondObj;
                }

                if ($firstObj && $secondObj && (($firstObj['lecturer_id'] ?? 0) !== ($secondObj['lecturer_id'] ?? 0))) {
                    $other_assigned = $secondObj;
                } elseif (!$firstObj && $secondObj) {
                    $other_assigned = null;
                }
            }
        }
    }
}

echo json_encode([
    'index_number' => $index_number,
    'assigned' => $assigned,
    'other_assigned' => $other_assigned,
]);
exit;

