<?php
/**
 * Legacy student contract submission. All contract data is stored in student_contracts only.
 * For the React student portal, use the API: POST /api/student/contract (same table).
 */

// Allow AJAX uploads from the React dev server (http://localhost:3000)
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === 'http://localhost:3000') {
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Credentials: true');
}

include 'database_connection/database_connection.php';
require_once __DIR__ . '/api/notification_helpers.php';

$student_fname = $_COOKIE["student_first_name"];
$student_lname = $_COOKIE["student_last_name"];
$student_full_name = $student_fname." ".$student_lname;
$student_index_number = $_COOKIE["student_index_number"];

$message = "";
$status = "";

// Check if student has already submitted a contract
$check_contract_query = "SELECT * FROM student_contracts WHERE index_number='$student_index_number'";
$contract_result = mysqli_query($conn, $check_contract_query);
$has_submitted = mysqli_num_rows($contract_result) > 0;

if(isset($_POST["submit_contract"])){
    if($has_submitted){
        $message = "You have already submitted your contract. Contract submissions are final and cannot be changed.";
        $status = "warning";
    } else {
        // Check if file was uploaded
        if(isset($_FILES['contract_file']) && $_FILES['contract_file']['error'] == 0){
            $file_name = $_FILES['contract_file']['name'];
            $file_tmp = $_FILES['contract_file']['tmp_name'];
            $file_size = $_FILES['contract_file']['size'];
            $file_type = $_FILES['contract_file']['type'];

            // Check file type (only PDF allowed)
            $allowed_types = array('application/pdf');
            if(!in_array($file_type, $allowed_types)){
                $message = "Only PDF files are allowed.";
                $status = "error";
            }
            // Check file size (max 5MB)
            elseif($file_size > 5242880){
                $message = "File size must be less than 5MB.";
                $status = "error";
            }
            else {
                // Generate unique filename
                $timestamp = time();
                $new_filename = "contract_" . str_replace('/', '_', $student_index_number) . "_" . $timestamp . ".pdf";
                $upload_path = "uploads/contracts/" . $new_filename;

                // Move uploaded file
                if(move_uploaded_file($file_tmp, $upload_path)){
                    // Save to database
                    $insert_query = "INSERT INTO student_contracts (student_name, index_number, contract_file, original_filename, status)
                                   VALUES ('$student_full_name', '$student_index_number', '$upload_path', '$file_name', 'pending')";

                    if(mysqli_query($conn, $insert_query)){
                        $contract_id = (int)mysqli_insert_id($conn);
                        iasms_notify_supervisors_contract_submitted(
                            $conn,
                            $student_index_number,
                            $student_full_name,
                            $contract_id > 0 ? $contract_id : null
                        );
                        $message = "Contract submitted successfully! Your contract is pending approval.";
                        $status = "success";
                        $has_submitted = true;
                    } else {
                        $message = "Error saving contract information to database.";
                        $status = "error";
                        // Delete uploaded file if database insert failed
                        unlink($upload_path);
                    }
                } else {
                    $message = "Error uploading file. Please try again.";
                    $status = "error";
                }
            }
        } else {
            $message = "Please select a contract file to upload.";
            $status = "error";
        }
    }
}

// Get contract status if already submitted
$contract_status = "";
if($has_submitted){
    $contract_data = mysqli_fetch_assoc($contract_result);
    $contract_status = $contract_data['status'];
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IASMS - Submit Contract</title>

  <link rel="stylesheet" href="css/bootstrap-theme.min.css"/>
  <link rel="stylesheet" href="css/bootstrap.min.css"/>
  <link rel="stylesheet" href="css/bootstrap-select.css"/>
  <link rel="stylesheet" href="css/main_page_style.css"/>

  <script type="text/javascript" src="js/jquery-3.1.1.min.js"/></script>
  <script type="text/javascript" src="js/bootstrap.min.js"/></script>

  <style>
    .contract-upload {
      max-width: 600px;
      margin: 50px auto;
      padding: 30px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background-color: #f9f9f9;
    }
    .status-badge {
      font-size: 14px;
      padding: 5px 10px;
      border-radius: 4px;
    }
    .status-pending { background-color: #ffc107; color: #000; }
    .status-approved { background-color: #28a745; color: #fff; }
    .status-rejected { background-color: #dc3545; color: #fff; }
  </style>
</head>
<body>

<?php $topbar_logo_src = 'img/header_log.png'; include 'includes/student_topbar.php'; ?>

<div id="left_side_bar">
<ul id="menu_list">
  <a class="menu_items_link" href="instructions_page/instructions_page.php"><li class="menu_items_list">Instructions</li></a>
  <a class="menu_items_link" href="Register_page/Register_page.php"><li class="menu_items_list">Register</li></a>
  <a class="menu_items_link" href="student_assumption/student_assumption.php"><li class="menu_items_list">Submit Assupmtion</li></a>
  <a class="menu_items_link" href="e-logbook/elogbook_dynamic.php"><li class="menu_items_list">E-Logbook</li></a>
  <a class="menu_items_link" href="submit_contract.php"><li class="menu_items_list" style="background-color:orange;padding-left:16px">Submit Contract</li></a>
  <a class="menu_items_link" href="company_supervisor/company_supervisor_login.php"><li class="menu_items_list">Company Supervisor</li></a>
  <a class="menu_items_link" href="visiting_supervisor/visiting_supervisor_login.php"><li class="menu_items_list">Visiting Supervisor</li></a>
  <a class="menu_items_link" href="submit_report/submit_report.php"><li class="menu_items_list">Submit Report</li></a>
  <a class="menu_items_link" href="index.php"><li class="menu_items_list">Logout</li></a>
</ul>
</div>

<div id="main_content">
  <div class="container-fluid">
    <div class="panel">
      <div class="panel-heading phead">
         <h2 class="panel-title ptitle"> Submit Industrial Attachment Contract</h2>
      </div>
      <div class="panel-body pbody">

        <?php if($message != ""): ?>
        <div class="alert alert-<?php echo ($status == 'success') ? 'success' : (($status == 'warning') ? 'warning' : 'danger'); ?> alert-dismissible fade in">
          <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
          <?php echo $message; ?>
        </div>
        <?php endif; ?>

        <div class="contract-upload">
          <?php if($has_submitted): ?>
            <div class="text-center">
              <h3>Contract Submission Status</h3>
              <p>You have already submitted your industrial attachment contract.</p>

              <?php if($contract_status == 'pending'): ?>
                <span class="status-badge status-pending">Status: Pending Approval</span>
                <p class="mt-3">Your contract is being reviewed by the administration. You will be notified once it's approved.</p>
              <?php elseif($contract_status == 'approved'): ?>
                <span class="status-badge status-approved">Status: Approved</span>
                <p class="mt-3">Your contract has been approved. You may proceed with your industrial attachment.</p>
              <?php elseif($contract_status == 'rejected'): ?>
                <span class="status-badge status-rejected">Status: Rejected</span>
                <p class="mt-3">Your contract was rejected. Please contact the administration for more details.</p>
              <?php endif; ?>

              <div class="mt-4">
                <a href="submit_contract.php" class="btn btn-primary">Refresh Status</a>
              </div>
            </div>
          <?php else: ?>
            <h3 class="text-center mb-4">Upload Your Industrial Attachment Contract</h3>

            <form method="post" enctype="multipart/form-data">
              <div class="form-group">
                <label for="contract_file">Select Contract File (PDF only, max 5MB)</label>
                <input type="file" class="form-control" id="contract_file" name="contract_file" accept=".pdf" required>
                <small class="form-text text-muted">Please ensure your contract is signed by all required parties before uploading.</small>
              </div>

              <div class="text-center">
                <button type="submit" name="submit_contract" class="btn btn-success btn-lg">
                  <i class="glyphicon glyphicon-upload"></i> Submit Contract
                </button>
              </div>
            </form>

            <div class="mt-4">
              <h4>Contract Requirements:</h4>
              <ul class="list-unstyled">
                <li><i class="glyphicon glyphicon-check text-success"></i> Must be in PDF format</li>
                <li><i class="glyphicon glyphicon-check text-success"></i> Maximum file size: 5MB</li>
                <li><i class="glyphicon glyphicon-check text-success"></i> Must be signed by student, company supervisor, and institution representative</li>
                <li><i class="glyphicon glyphicon-check text-success"></i> Must include all required terms and conditions</li>
                <li><i class="glyphicon glyphicon-warning-sign text-warning"></i> <strong>Important:</strong> Contract submissions are final and cannot be changed once submitted</li>
              </ul>
            </div>
          <?php endif; ?>
        </div>

      </div>
    </div>
  </div>
</div>

</body>
</html>