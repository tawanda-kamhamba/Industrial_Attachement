<?php
/**
 * GET: Chart data for admin dashboard (real data from DB).
 * Returns: registrationsByMonth, submissionsTrend, studentsByFaculty, studentsByRegion
 */
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

$monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Registrations by month (industrial_registration.date), last 12 months
$registrationsByMonth = [];
$qr = mysqli_query($conn, "
    SELECT YEAR(date) AS y, MONTH(date) AS m, COUNT(*) AS c
    FROM industrial_registration
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY y, m
    ORDER BY y, m
");
if ($qr) {
    while ($row = mysqli_fetch_assoc($qr)) {
        $m = (int)($row['m'] ?? 0);
        $label = ($m >= 1 && $m <= 12) ? $monthNames[$m - 1] : (string)$m;
        $registrationsByMonth[] = ['name' => $label, 'value' => (int)($row['c'] ?? 0)];
    }
}
if (empty($registrationsByMonth)) {
    $registrationsByMonth = array_map(function ($m) {
        return ['name' => $m, 'value' => 0];
    }, array_slice($monthNames, -6, 6));
}

// Submissions trend: assumptions submitted by month (students_assumption.date), last 6 months
$byMonth = [];
$qs = mysqli_query($conn, "
    SELECT YEAR(date) AS y, MONTH(date) AS m, COUNT(*) AS c
    FROM students_assumption
    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY y, m
    ORDER BY y, m
");
if ($qs) {
    while ($row = mysqli_fetch_assoc($qs)) {
        $m = (int)($row['m'] ?? 0);
        $label = ($m >= 1 && $m <= 12) ? $monthNames[$m - 1] : (string)$m;
        $byMonth[$label] = (int)($row['c'] ?? 0);
    }
}
$submissionsTrend = [];
for ($i = 5; $i >= 0; $i--) {
    $d = new DateTime();
    $d->modify("-$i months");
    $label = $monthNames[(int)$d->format('n') - 1];
    $submissionsTrend[] = ['name' => $label, 'value' => (int)($byMonth[$label] ?? 0)];
}

// Students by faculty (industrial_registration.faculty)
$studentsByFaculty = [];
$qf = mysqli_query($conn, "
    SELECT faculty AS name, COUNT(*) AS value
    FROM industrial_registration
    WHERE TRIM(COALESCE(faculty,'')) != ''
    GROUP BY faculty
    ORDER BY value DESC
");
if ($qf) {
    while ($row = mysqli_fetch_assoc($qf)) {
        $studentsByFaculty[] = ['name' => $row['name'] ?? '', 'value' => (int)($row['value'] ?? 0)];
    }
}

// Students by region (students_assumption.company_region)
$regions = ['Bulawayo', 'Harare', 'Manicaland', 'Mashonaland Central', 'Mashonaland East', 'Mashonaland West', 'Masvingo', 'Matabeleland North', 'Matabeleland South', 'Midlands'];
$studentsByRegion = [];
foreach ($regions as $reg) {
    $reg_esc = mysqli_real_escape_string($conn, $reg);
    $qr = mysqli_query($conn, "SELECT COUNT(*) AS c FROM students_assumption WHERE company_region = '$reg_esc'");
    $c = 0;
    if ($qr && $row = mysqli_fetch_assoc($qr)) {
        $c = (int)($row['c'] ?? 0);
    }
    $studentsByRegion[] = ['name' => $reg, 'value' => $c];
}

echo json_encode([
    'registrationsByMonth' => $registrationsByMonth,
    'submissionsTrend' => $submissionsTrend,
    'studentsByFaculty' => $studentsByFaculty,
    'studentsByRegion' => $studentsByRegion,
]);
