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

echo json_encode([
    'index_number' => $index_number,
    'assigned' => $assigned,
]);
exit;

