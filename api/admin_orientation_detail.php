<?php
/**
 * Orientation checklist detail for admin.
 * GET /iasms/api/admin/orientation-detail/{id}
 */

$id = 0;
// Prefer path param: /admin/orientation-detail/{id}
if (!empty($segments) && $segments[0] === 'admin' && ($segments[1] ?? '') === 'orientation-detail' && !empty($segments[2])) {
    $id = (int)$segments[2];
}
// Fallback: allow ?id=123 for extra safety
if ($id <= 0 && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
}

$q = "SELECT * FROM orientation_checklist WHERE id = $id LIMIT 1";
$res = mysqli_query($conn, $q);
if (!$res || mysqli_num_rows($res) === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Checklist not found']);
    return;
}

$checklist = mysqli_fetch_assoc($res);

$general_items = [
    'general_staff_introduction' => 'Introduction to key staff members and their roles explained',
    'general_facilities_location' => 'Location of facilities such as rest rooms, canteen, etc.',
    'general_tea_coffee_lunch' => 'Tea/coffee and lunch arrangements',
    'general_transport_arrangements' => 'Transport arrangements (if applicable)',
    'general_dress_code' => 'Dress code',
    'general_code_of_conduct' => 'Code of conduct',
    'general_policies_regulations' => 'Policies and regulations',
];

$work_items = [
    'work_workspace' => 'Work space',
    'work_duty_arrangements' => 'Duty arrangements',
    'work_schedule_meetings' => 'Schedule of meetings',
    'work_first_meeting_supervisor' => 'First meeting with host supervisor',
];

$health_items = [
    'health_emergency_procedures' => 'Emergency procedures',
    'health_safety_policy' => 'Safety policy received or location known',
    'health_first_aid_arrangements' => 'First aid arrangements such as location of first aid box, names of first aiders, etc.',
    'health_fire_procedures' => 'Fire procedures and location of fire extinguishers',
    'health_accident_reporting' => 'Accident reporting and location of accident book',
    'health_manual_handling' => 'Manual handling procedures',
    'health_safety_regulations' => 'Safety regulations',
    'health_equipment_instruction' => 'Instruction on equipment and their use',
];

$others_items = [
    'others_student_info_form' => 'Student information form (Contract form)',
    'others_social_media_guidelines' => 'Social media guidelines',
    'others_it_systems_equipment' => 'IT systems and equipment',
];

$sections = [];
$total_items = 0;
$completed_items = 0;

foreach (
    [
        ['title' => 'General', 'items' => $general_items],
        ['title' => 'Work-related', 'items' => $work_items],
        ['title' => 'Health and Safety', 'items' => $health_items],
        ['title' => 'Others', 'items' => $others_items],
    ] as $group
) {
    $items = [];
    foreach ($group['items'] as $field => $label) {
        $is_completed = !empty($checklist[$field]);
        $items[] = [
            'field' => $field,
            'label' => $label,
            'completed' => $is_completed,
        ];
        $total_items++;
        if ($is_completed) {
            $completed_items++;
        }
    }
    $sections[] = [
        'title' => $group['title'],
        'items' => $items,
    ];
}

$pct = $total_items > 0 ? round(($completed_items / $total_items) * 100) : 0;

$signatures = [
    'student' => [
        'name' => $checklist['student_signature'] ?? '',
        'date' => $checklist['student_signature_date'] ?? null,
    ],
    'host_supervisor' => [
        'name' => $checklist['host_supervisor_signature'] ?? '',
        'date' => $checklist['host_supervisor_date'] ?? null,
    ],
    'wrl_coordinator' => [
        'name' => $checklist['wrl_coordinator_signature'] ?? '',
        'date' => $checklist['wrl_coordinator_date'] ?? null,
    ],
];

echo json_encode([
    'id' => (int)$checklist['id'],
    'student_name' => $checklist['student_name'] ?? '',
    'index_number' => $checklist['index_number'] ?? '',
    'host_institution' => $checklist['host_institution'] ?? '',
    'completed_at' => $checklist['completed_at'] ?? null,
    'completed_items' => $completed_items,
    'total_items' => $total_items,
    'completion_percent' => $pct,
    'sections' => $sections,
    'signatures' => $signatures,
]);

