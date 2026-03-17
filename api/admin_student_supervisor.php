<?php
/**
 * Admin: get and set a specific student's assigned institutional supervisor.
 *
 * GET  /admin/student-supervisor/{index_number}
 * POST /admin/student-supervisor/assign   { index_number, lecturer_id|null }
 */
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(401);
    echo json_encode(['error' => 'Not authorized']);
    return;
}

function iasms_ensure_student_supervisor_table(mysqli $conn): bool
{
    $sql = "CREATE TABLE IF NOT EXISTS student_supervisor_assignments (
        index_number VARCHAR(64) NOT NULL PRIMARY KEY,
        lecturer_id INT NOT NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )";
    return (bool)mysqli_query($conn, $sql);
}

if (!iasms_ensure_student_supervisor_table($conn)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to initialize assignment table']);
    return;
}

// GET: return current assignment + lecturers list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $index_number = isset($segments[2]) ? trim(urldecode($segments[2])) : '';
    if ($index_number === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Index number required']);
        return;
    }

    $idx = mysqli_real_escape_string($conn, $index_number);

    $assigned = null;
    $q = "SELECT ssa.lecturer_id, vl.lecturer_name, vl.staff_id
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
            'staff_id' => $row['staff_id'] ?? null,
        ];
    }

    $lecturers = [];
    $lr = mysqli_query(
        $conn,
        "SELECT id, lecturer_name, lecturer_faculty, lecturer_department, lecturer_region_residence, staff_id
         FROM visiting_lecturers
         ORDER BY lecturer_name"
    );
    while ($lr && ($row = mysqli_fetch_assoc($lr))) {
        $lecturers[] = [
            'id' => (int)$row['id'],
            'lecturer_name' => $row['lecturer_name'] ?? '',
            'lecturer_faculty' => $row['lecturer_faculty'] ?? '',
            'lecturer_department' => $row['lecturer_department'] ?? '',
            'lecturer_region_residence' => $row['lecturer_region_residence'] ?? '',
            'staff_id' => $row['staff_id'] ?? null,
        ];
    }

    echo json_encode([
        'index_number' => $index_number,
        'assigned' => $assigned,
        'lecturers' => $lecturers,
    ]);
    return;
}

// POST: assign or unassign
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?: [];
    $index_number = trim((string)($body['index_number'] ?? ''));
    $lecturer_id_raw = $body['lecturer_id'] ?? null;

    if ($index_number === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Index number required']);
        return;
    }

    $idx = mysqli_real_escape_string($conn, $index_number);

    if ($lecturer_id_raw === null || $lecturer_id_raw === '') {
        // Unassign
        mysqli_query($conn, "DELETE FROM student_supervisor_assignments WHERE index_number = '$idx'");
        echo json_encode(['success' => true]);
        return;
    }

    $lecturer_id = (string)$lecturer_id_raw;
    if (!ctype_digit($lecturer_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid lecturer_id']);
        return;
    }

    $lid = (int)$lecturer_id;
    $check = mysqli_query($conn, "SELECT id FROM visiting_lecturers WHERE id = $lid LIMIT 1");
    if (!$check || mysqli_num_rows($check) !== 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Supervisor not found']);
        return;
    }

    // Upsert by primary key
    $sql = "INSERT INTO student_supervisor_assignments (index_number, lecturer_id)
            VALUES ('$idx', $lid)
            ON DUPLICATE KEY UPDATE lecturer_id = VALUES(lecturer_id), assigned_at = CURRENT_TIMESTAMP";
    if (!mysqli_query($conn, $sql)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save assignment']);
        return;
    }

    echo json_encode(['success' => true]);
    return;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
