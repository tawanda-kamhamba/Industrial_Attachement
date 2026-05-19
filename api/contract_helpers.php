<?php
/**
 * Shared student_contracts helpers (status changes, resubmission flag).
 */

require_once __DIR__ . '/notification_helpers.php'; // student_notifications + contract_rejected

function iasms_ensure_student_contracts_columns(mysqli $conn): void
{
    $check = @mysqli_query($conn, "SHOW COLUMNS FROM student_contracts LIKE 'allow_resubmit'");
    if (!$check || mysqli_num_rows($check) === 0) {
        @mysqli_query($conn, "ALTER TABLE student_contracts ADD COLUMN allow_resubmit TINYINT(1) NOT NULL DEFAULT 0");
    }
}

/**
 * @return array{success: bool, error?: string, index_number?: string}
 */
function iasms_apply_contract_status_action(
    mysqli $conn,
    int $contract_id,
    string $action,
    string $comment_raw = '',
    ?string $index_number_in_clause = null
): array {
    iasms_ensure_student_contracts_columns($conn);

    $action = strtolower(trim($action));
    $allowed = ['approve', 'reject', 'allow_resubmit', 'set_pending'];
    if ($contract_id < 1 || !in_array($action, $allowed, true)) {
        return ['success' => false, 'error' => 'Invalid action or contract id'];
    }

    if ($action === 'reject' && trim($comment_raw) === '') {
        return ['success' => false, 'error' => 'Rejection reason is required'];
    }

    $comment_esc = mysqli_real_escape_string($conn, trim($comment_raw));
    $where_extra = $index_number_in_clause !== null && $index_number_in_clause !== ''
        ? " AND index_number IN ($index_number_in_clause)"
        : '';

    if ($action === 'approve') {
        $sql = "UPDATE student_contracts
                SET status='approved', allow_resubmit=0, admin_comment='$comment_esc'
                WHERE id=$contract_id$where_extra";
    } elseif ($action === 'reject') {
        $sql = "UPDATE student_contracts
                SET status='rejected', allow_resubmit=0, admin_comment='$comment_esc'
                WHERE id=$contract_id$where_extra";
    } elseif ($action === 'allow_resubmit') {
        $sql = "UPDATE student_contracts
                SET status='pending', allow_resubmit=1, admin_comment='$comment_esc'
                WHERE id=$contract_id$where_extra";
    } else {
        // set_pending — review existing file again without a new upload
        $sql = "UPDATE student_contracts
                SET status='pending', allow_resubmit=0, admin_comment='$comment_esc'
                WHERE id=$contract_id$where_extra";
    }

    if (!mysqli_query($conn, $sql) || mysqli_affected_rows($conn) < 1) {
        return ['success' => false, 'error' => 'Update failed or not allowed'];
    }

    $lookup = mysqli_query(
        $conn,
        "SELECT index_number FROM student_contracts WHERE id=$contract_id LIMIT 1"
    );
    $index_number = '';
    if ($lookup && ($row = mysqli_fetch_assoc($lookup))) {
        $index_number = (string)($row['index_number'] ?? '');
    }

    if ($index_number !== '') {
        if ($action === 'reject') {
            iasms_notify_student_contract_rejected($conn, $index_number, trim($comment_raw));
        } elseif ($action === 'allow_resubmit') {
            iasms_notify_student_contract_resubmit_allowed($conn, $index_number, trim($comment_raw));
        }
    }

    return ['success' => true, 'index_number' => $index_number];
}

function iasms_notify_student_contract_resubmit_allowed(mysqli $conn, string $index_number, string $note): void
{
    $index_number = trim($index_number);
    if ($index_number === '') {
        return;
    }

    iasms_ensure_student_notifications_table($conn);

    $idx_esc = mysqli_real_escape_string($conn, $index_number);
    $title = 'Contract resubmission requested';
    $message = trim($note) !== ''
        ? 'Please upload a new contract PDF. Note: ' . trim($note)
        : 'Please upload a new contract PDF on the Submit Contract page.';
    $title_esc = mysqli_real_escape_string($conn, $title);
    $message_esc = mysqli_real_escape_string($conn, $message);

    @mysqli_query(
        $conn,
        "INSERT INTO student_notifications
            (recipient_index_number, type, title, message)
         VALUES
            ('$idx_esc', 'contract_resubmit_allowed', '$title_esc', '$message_esc')"
    );
}
