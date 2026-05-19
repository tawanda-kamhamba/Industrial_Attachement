<?php

include '../database_connection/database_connection.php';

// Pagination setup
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = 10;
$offset = ($page - 1) * $per_page;

// Sorting
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'submission_date';
$sort_order = isset($_GET['sort_order']) ? $_GET['sort_order'] : 'DESC';
$allowed_sorts = ['student_name', 'index_number', 'submission_date', 'status'];
if (!in_array($sort_by, $allowed_sorts)) {
    $sort_by = 'submission_date';
}
if (!in_array($sort_order, ['ASC', 'DESC'])) {
    $sort_order = 'DESC';
}

// Filtering
$filter_status = isset($_GET['status']) ? $_GET['status'] : '';
$query_string = '';

// Build query
$where_clause = "1=1";
if (!empty($filter_status)) {
    $filter_status = mysqli_real_escape_string($conn, $filter_status);
    $where_clause .= " AND status = '$filter_status'";
    $query_string = "&status=" . urlencode($filter_status);
}

// Get total count
$count_query = "SELECT COUNT(*) as total FROM student_contracts WHERE $where_clause";
$count_result = mysqli_query($conn, $count_query);
$count_row = mysqli_fetch_assoc($count_result);
$total_records = $count_row['total'];
$total_pages = ceil($total_records / $per_page);

// Validate page number
if ($page < 1) $page = 1;
if ($page > $total_pages && $total_pages > 0) $page = $total_pages;
$offset = ($page - 1) * $per_page;

// Get contracts
$contracts_query = "SELECT * FROM student_contracts WHERE $where_clause ORDER BY $sort_by $sort_order LIMIT $offset, $per_page";
$contracts_result = mysqli_query($conn, $contracts_query);

// Handle contract actions
$message = '';
$alert_type = '';

if (isset($_POST['action'])) {
    $action = $_POST['action'];
    $contract_id = (int)$_POST['contract_id'];
    $admin_comment = mysqli_real_escape_string($conn, $_POST['admin_comment'] ?? '');
    
    if ($action == 'approve') {
        $update_query = "UPDATE student_contracts SET status='approved', admin_comment='$admin_comment' WHERE id=$contract_id";
        if (mysqli_query($conn, $update_query)) {
            $message = "Contract approved successfully!";
            $alert_type = "success";
        } else {
            $message = "Error updating contract.";
            $alert_type = "danger";
        }
    } elseif ($action == 'reject') {
        if (trim($_POST['admin_comment'] ?? '') === '') {
            $message = "Rejection reason is required.";
            $alert_type = "danger";
        } else {
            $update_query = "UPDATE student_contracts SET status='rejected', admin_comment='$admin_comment' WHERE id=$contract_id";
            if (mysqli_query($conn, $update_query)) {
                $message = "Contract rejected.";
                $alert_type = "info";
            } else {
                $message = "Error updating contract.";
                $alert_type = "danger";
            }
        }
    }
    
    // Reload data
    $contracts_result = mysqli_query($conn, $contracts_query);
}

?>

<!DOCTYPE html>
<html lang="en" class="bg-pink">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IASMS - Manage Contracts</title>

  <link rel="stylesheet" href="../css/bootstrap-theme.min.css"/>
  <link rel="stylesheet" href="../css/bootstrap.min.css"/>
  <link rel="stylesheet" href="../css/main_page_style.css"/>
  <style>
    .contract-actions {
      display: flex;
      gap: 5px;
    }
    .status-badge {
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 0.9em;
      font-weight: bold;
    }
    .status-pending {
      background-color: #fff3cd;
      color: #856404;
    }
    .status-approved {
      background-color: #d4edda;
      color: #155724;
    }
    .status-rejected {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>

  <script type="text/javascript" src="../js/jquery-3.1.1.min.js"></script>
  <script type="text/javascript" src="../js/bootstrap.min.js"></script>

</head>
<body>

<?php $topbar_display_name = 'Admin'; $topbar_logo_src = '../img/header_log.png'; include '../includes/topbar.php'; ?>

<div id="left_side_bar">
<ul id="menu_list">
  <a class="menu_items_link" href="view_registered_students/view_registered_students.php"><li class="menu_items_list">Registered Students</li></a>
  <a class="menu_items_link" href="view_orientation_checklists.php"><li class="menu_items_list">Orientation Checklists</li></a>
  <a class="menu_items_link" href="view_elogbooks.php"><li class="menu_items_list">E-Logbooks</li></a>
  <a class="menu_items_link" href="manage_contracts.php"><li class="menu_items_list" style="background-color:orange;padding-left:16px">View Contracts</li></a>
  <a class="menu_items_link" href="view_submitted_reports.php"><li class="menu_items_list">View Submitted Reports</li></a>
  <a class="menu_items_link" href="students_assumptions/students_assumptions.php"><li class="menu_items_list">Student Assumptions</li></a>
  <a class="menu_items_link" href="assign_supervisors/assign_supervisors.php"><li class="menu_items_list">Assign Supervisors</li></a>
  <a class="menu_items_link" href="visiting_score/visiting_supervisors_score.php"><li class="menu_items_list">Visiting Superviors Score</li></a>
  <a class="menu_items_link" href="company_score/company_supervisor_score.php"><li class="menu_items_list">Company Supervisor Score</li></a>
  <a class="menu_items_link" href="change_password/change_password.php"><li class="menu_items_list">Change Password</li></a>
  <a class="menu_items_link" href="../index.php"><li class="menu_items_list">Logout</li></a>
</ul>
</div>

<div id="main_content">
  <div class="container-fluid">
    <div class="panel">
       <div class="panel-heading phead">
          <h2 class="panel-title ptitle">Manage Student Contracts</h2>
       </div>
       <div class="panel-body pbody">

          <?php if (!empty($message)): ?>
            <div class="alert alert-<?php echo $alert_type; ?> alert-dismissible fade in">
              <a href="#" class="close" data-dismiss="alert">&times;</a>
              <?php echo htmlspecialchars($message); ?>
            </div>
          <?php endif; ?>

          <div class="row" style="margin-bottom: 20px;">
            <div class="col-sm-6">
              <form method="get" class="form-inline">
                <label for="status" style="margin-right: 10px;">Filter by Status:</label>
                <select name="status" id="status" class="form-control" style="margin-right: 10px;">
                  <option value="">All Statuses</option>
                  <option value="pending" <?php echo $filter_status == 'pending' ? 'selected' : ''; ?>>Pending</option>
                  <option value="approved" <?php echo $filter_status == 'approved' ? 'selected' : ''; ?>>Approved</option>
                  <option value="rejected" <?php echo $filter_status == 'rejected' ? 'selected' : ''; ?>>Rejected</option>
                </select>
                <button type="submit" class="btn btn-primary">Filter</button>
              </form>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th><a href="?sort_by=student_name&sort_order=<?php echo ($sort_by == 'student_name' && $sort_order == 'ASC') ? 'DESC' : 'ASC'; ?><?php echo $query_string; ?>">Student Name</a></th>
                  <th><a href="?sort_by=index_number&sort_order=<?php echo ($sort_by == 'index_number' && $sort_order == 'ASC') ? 'DESC' : 'ASC'; ?><?php echo $query_string; ?>">Index Number</a></th>
                  <th>Original Filename</th>
                  <th><a href="?sort_by=submission_date&sort_order=<?php echo ($sort_by == 'submission_date' && $sort_order == 'ASC') ? 'DESC' : 'ASC'; ?><?php echo $query_string; ?>">Submission Date</a></th>
                  <th><a href="?sort_by=status&sort_order=<?php echo ($sort_by == 'status' && $sort_order == 'ASC') ? 'DESC' : 'ASC'; ?><?php echo $query_string; ?>">Status</a></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <?php if (mysqli_num_rows($contracts_result) > 0): ?>
                  <?php while ($contract = mysqli_fetch_assoc($contracts_result)): ?>
                    <tr>
                      <td><?php echo htmlspecialchars($contract['student_name']); ?></td>
                      <td><?php echo htmlspecialchars($contract['index_number']); ?></td>
                      <td><?php echo htmlspecialchars($contract['original_filename']); ?></td>
                      <td><?php echo date('Y-m-d H:i', strtotime($contract['submission_date'])); ?></td>
                      <td>
                        <span class="status-badge status-<?php echo strtolower($contract['status']); ?>">
                          <?php echo ucfirst($contract['status']); ?>
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-info" data-toggle="modal" data-target="#viewModal" onclick="loadContractDetails(<?php echo htmlspecialchars(json_encode($contract)); ?>)">
                          <i class="glyphicon glyphicon-eye-open"></i> View
                        </button>
                      </td>
                    </tr>
                  <?php endwhile; ?>
                <?php else: ?>
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">No contracts found.</td>
                  </tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <?php if ($total_pages > 1): ?>
            <nav aria-label="Contract pagination">
              <ul class="pagination justify-content-center">
                <?php if ($page > 1): ?>
                  <li class="page-item"><a class="page-link" href="?page=<?php echo $page - 1; ?><?php echo $query_string; ?>">Previous</a></li>
                <?php endif; ?>

                <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                  <li class="page-item <?php echo ($i == $page) ? 'active' : ''; ?>">
                    <a class="page-link" href="?page=<?php echo $i; ?><?php echo $query_string; ?>"><?php echo $i; ?></a>
                  </li>
                <?php endfor; ?>

                <?php if ($page < $total_pages): ?>
                  <li class="page-item"><a class="page-link" href="?page=<?php echo $page + 1; ?><?php echo $query_string; ?>">Next</a></li>
                <?php endif; ?>
              </ul>
            </nav>
          <?php endif; ?>

       </div>
    </div>
  </div>
</div>

<!-- View Contract Modal -->
<div class="modal fade" id="viewModal" role="dialog">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title">Contract Details</h4>
      </div>
      <div class="modal-body">
        <div id="contractDetails"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>

<script>
function loadContractDetails(contract) {
    let statusColor = 'pending';
    if (contract.status === 'approved') {
        statusColor = 'approved';
    } else if (contract.status === 'rejected') {
        statusColor = 'rejected';
    }
    
    let html = `
        <div class="row">
            <div class="col-sm-6">
                <p><strong>Student Name:</strong> ${escapeHtml(contract.student_name)}</p>
                <p><strong>Index Number:</strong> ${escapeHtml(contract.index_number)}</p>
                <p><strong>Original Filename:</strong> ${escapeHtml(contract.original_filename)}</p>
            </div>
            <div class="col-sm-6">
                <p><strong>Submission Date:</strong> ${formatDate(contract.submission_date)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${statusColor}">${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span></p>
                <p><strong>Contract File:</strong> <a href="../${contract.contract_file}" target="_blank" class="btn btn-sm btn-primary">Download/View</a></p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-12">
                <h4>Admin Comment</h4>
                <p>${escapeHtml(contract.admin_comment || 'No comment')}</p>
            </div>
        </div>
        <hr>
        <div class="row">
            <div class="col-sm-12">
                <h4>Actions</h4>
                <form method="post" style="margin-top: 10px;">
                    <input type="hidden" name="contract_id" value="${contract.id}">
                    <div class="form-group">
                        <label for="comment">Add Comment:</label>
                        <textarea class="form-control" id="comment" name="admin_comment" rows="4">${escapeHtml(contract.admin_comment || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <button type="submit" name="action" value="approve" class="btn btn-success">
                            <i class="glyphicon glyphicon-ok"></i> Approve
                        </button>
                        <button type="submit" name="action" value="reject" class="btn btn-danger">
                            <i class="glyphicon glyphicon-remove"></i> Reject
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('contractDetails').innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
</script>

</body>
</html>
