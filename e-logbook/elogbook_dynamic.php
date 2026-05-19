<?php

include '../database_connection/database_connection.php';

$student_fname = $_COOKIE["student_first_name"];
$student_lname = $_COOKIE["student_last_name"];
$student_full_name = $student_fname." ".$student_lname;
$student_index_number = $_COOKIE["student_index_number"];

// Get current week from URL parameter, default to 1
$current_week = isset($_GET['week']) ? (int)$_GET['week'] : 1;

// Handle form submissions
$message = "";
$status = "";

if(isset($_POST["btn_save"]) || isset($_POST["btn_update"])){
    $monday_job_assigned = $_POST["job_assigned_1"] ?? "";
    $monday_skill_acquired = $_POST["skill_acquired_1"] ?? "";
    $tuesday_job_assigned = $_POST["job_assigned_2"] ?? "";
    $tuesday_skill_acquired = $_POST["skill_acquired_2"] ?? "";
    $wednesday_job_assigned = $_POST["job_assigned_3"] ?? "";
    $wednesday_skill_acquired = $_POST["skill_acquired_3"] ?? "";
    $thursday_job_assigned = $_POST["job_assigned_4"] ?? "";
    $thursday_skill_acquired = $_POST["skill_acquired_4"] ?? "";
    $friday_job_assigned = $_POST["job_assigned_5"] ?? "";
    $friday_skill_acquired = $_POST["skill_acquired_5"] ?? "";

    // Check if entry exists
    $check_query = "SELECT id FROM elogbook_entries WHERE index_number='$student_index_number' AND week_number='$current_week'";
    $check_result = mysqli_query($conn, $check_query);
    $exists = mysqli_num_rows($check_result) > 0;

    if($exists && isset($_POST["btn_update"])){
            // Update existing entry
            $update_query = "UPDATE elogbook_entries SET
                monday_job_assigned='$monday_job_assigned',
                monday_skill_acquired='$monday_skill_acquired',
                tuesday_job_assigned='$tuesday_job_assigned',
                tuesday_skill_acquired='$tuesday_skill_acquired',
                wednesday_job_assigned='$wednesday_job_assigned',
                wednesday_skill_acquired='$wednesday_skill_acquired',
                thursday_job_assigned='$thursday_job_assigned',
                thursday_skill_acquired='$thursday_skill_acquired',
                friday_job_assigned='$friday_job_assigned',
                friday_skill_acquired='$friday_skill_acquired'
                WHERE index_number='$student_index_number' AND week_number='$current_week'";

            if(mysqli_query($conn, $update_query)){
                $message = "Week $current_week updated successfully!";
                $status = "success";
            } else {
                $message = "Error updating week $current_week.";
                $status = "error";
            }
        } elseif(!$exists && isset($_POST["btn_save"])){
            // Insert new entry
            $insert_query = "INSERT INTO elogbook_entries
                (student_name, index_number, week_number, monday_job_assigned, monday_skill_acquired,
                 tuesday_job_assigned, tuesday_skill_acquired, wednesday_job_assigned, wednesday_skill_acquired,
                 thursday_job_assigned, thursday_skill_acquired, friday_job_assigned, friday_skill_acquired)
                VALUES ('$student_full_name', '$student_index_number', '$current_week',
                 '$monday_job_assigned', '$monday_skill_acquired', '$tuesday_job_assigned', '$tuesday_skill_acquired',
                 '$wednesday_job_assigned', '$wednesday_skill_acquired', '$thursday_job_assigned', '$thursday_skill_acquired',
                 '$friday_job_assigned', '$friday_skill_acquired')";

            if(mysqli_query($conn, $insert_query)){
                $message = "Week $current_week saved successfully!";
                $status = "success";
            } else {
                $message = "Error saving week $current_week.";
                $status = "error";
            }
    } elseif($exists && isset($_POST["btn_save"])){
        $message = "Week $current_week already exists. Use Update to save changes.";
        $status = "warning";
    } elseif(!$exists && isset($_POST["btn_update"])){
        $message = "No data for week $current_week yet. Use Save to create an entry.";
        $status = "warning";
    }
}

// Handle adding new week
if(isset($_POST["add_week"])){
    // Find the next available week number
    $max_week_query = "SELECT MAX(week_number) as max_week FROM elogbook_entries WHERE index_number='$student_index_number'";
    $max_week_result = mysqli_query($conn, $max_week_query);
    $max_week_row = mysqli_fetch_assoc($max_week_result);
    $next_week = ($max_week_row['max_week'] ?? 0) + 1;

    header("Location: elogbook_dynamic.php?week=$next_week");
    exit();
}

// Get data for current week
$get_data_query = "SELECT * FROM elogbook_entries WHERE index_number='$student_index_number' AND week_number='$current_week'";
$get_data_result = mysqli_query($conn, $get_data_query);
$week_data = mysqli_fetch_assoc($get_data_result);

// Get all weeks for this student
$all_weeks_query = "SELECT week_number FROM elogbook_entries WHERE index_number='$student_index_number' ORDER BY week_number";
$all_weeks_result = mysqli_query($conn, $all_weeks_query);
$existing_weeks = [];
while($week_row = mysqli_fetch_assoc($all_weeks_result)){
    $existing_weeks[] = $week_row['week_number'];
}

// Determine button states
$has_data = $week_data !== null;
$btn_update_status = $has_data ? "enabled" : "disabled";
$btn_save_status = $has_data ? "disabled" : "enabled";

?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IASMS - Dynamic E-LogBook</title>

  <link rel="stylesheet" href="../css/bootstrap-theme.min.css"/>
  <link rel="stylesheet" href="../css/bootstrap.min.css"/>
  <link rel="stylesheet" href="../css/bootstrap-select.css"/>
  <link rel="stylesheet" href="../css/main_page_style.css"/>
  <link rel="stylesheet" href="elogbook.css"/>

  <script type="text/javascript" src="../js/jquery-3.1.1.min.js"/></script>
  <script type="text/javascript" src="../js/bootstrap.min.js"/></script>

  <style>
    .week-navigation {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .week-nav-item {
      display: inline-block;
      margin: 0 5px 5px 0;
      padding: 8px 12px;
      background-color: #e9ecef;
      border-radius: 4px;
      text-decoration: none;
      color: #495057;
    }
    .week-nav-item.active {
      background-color: #007bff;
      color: white;
    }
    .week-nav-item:hover {
      background-color: #0056b3;
      color: white;
      text-decoration: none;
    }
  </style>
</head>
<body>

<?php $topbar_logo_src = '../img/header_log.png'; include '../includes/student_topbar.php'; ?>

<div id="left_side_bar">
<ul id="menu_list">
  <a class="menu_items_link" href="../instructions_page/instructions_page.php"><li class="menu_items_list">Instructions</li></a>
  <a class="menu_items_link" href="../Register_page/Register_page.php"><li class="menu_items_list">Register</li></a>
  <a class="menu_items_link" href="../student_assumption/student_assumption.php"><li class="menu_items_list">Submit Assupmtion</li></a>
  <a class="menu_items_link" href="elogbook_dynamic.php"><li class="menu_items_list">E-Logbook</li></a>
  <a class="menu_items_link" href="../orientation_checklist.php"><li class="menu_items_list">Orientation Checklist</li></a>
  <a class="menu_items_link" href="../company_supervisor/company_supervisor_login.php"><li class="menu_items_list">Company Supervisor</li></a>
  <a class="menu_items_link" href="../visiting_supervisor/visiting_supervisor_login.php"><li class="menu_items_list">Visiting Supervisor</li></a>
  <a class="menu_items_link" href="../submit_contract.php"><li class="menu_items_list">Submit Contract</li></a>
  <a class="menu_items_link" href="../submit_report/submit_report.php"><li class="menu_items_list">Submit Report</li></a>
  <a class="menu_items_link" href="../index.php"><li class="menu_items_list">Logout</li></a>
</ul>
</div>

<div id="main_content">
  <div class="container-fluid">
    <div class = "panel">
      <div class = "panel-heading phead">
         <h2 class = "panel-title ptitle"> E-LogBook</h2>
      </div>
      <div class="panel-body pbody">

        <?php if($message != ""): ?>
        <div class="alert alert-<?php echo ($status == 'success') ? 'success' : 'danger'; ?> alert-dismissible fade in">
          <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
          <?php echo $message; ?>
        </div>
        <?php endif; ?>

        <!-- Week Navigation -->
        <div class="week-navigation">
          <h4>Your E-LogBook Weeks:</h4>
          <?php if(empty($existing_weeks)): ?>
            <p>No weeks recorded yet. Start with Week 1 below.</p>
          <?php else: ?>
            <?php foreach($existing_weeks as $week_num): ?>
              <a href="?week=<?php echo $week_num; ?>" class="week-nav-item <?php echo ($week_num == $current_week) ? 'active' : ''; ?>">
                Week <?php echo $week_num; ?>
              </a>
            <?php endforeach; ?>
          <?php endif; ?>

          <form method="post" style="display: inline; margin-left: 20px;">
            <button type="submit" name="add_week" class="btn btn-success btn-sm">
              <i class="glyphicon glyphicon-plus"></i> Add New Week
            </button>
          </form>
        </div>

        <div id="week_holder">
          <span style="font-size:1.3em;font-weight:bold;">Week <?php echo $current_week; ?></span>
        </div>
        <hr>

        <form method="post" action="">
        <table class="table table-bordered">
        <thead>
            <tr>
                <th style='text-align:center'>Day</th>
                <th style='text-align:center'>Job Assigned To Student</th>
                <th style='text-align:center'>Special Skill Acquired</th>
            </tr>
        </thead>
        <tbody>
          <?php
            // Get form data from database or set defaults
            $monday_job = $week_data["monday_job_assigned"] ?? "";
            $monday_skill = $week_data["monday_skill_acquired"] ?? "";
            $tuesday_job = $week_data["tuesday_job_assigned"] ?? "";
            $tuesday_skill = $week_data["tuesday_skill_acquired"] ?? "";
            $wednesday_job = $week_data["wednesday_job_assigned"] ?? "";
            $wednesday_skill = $week_data["wednesday_skill_acquired"] ?? "";
            $thursday_job = $week_data["thursday_job_assigned"] ?? "";
            $thursday_skill = $week_data["thursday_skill_acquired"] ?? "";
            $friday_job = $week_data["friday_job_assigned"] ?? "";
            $friday_skill = $week_data["friday_skill_acquired"] ?? "";

            echo "<tr>";
            echo "<td style='padding:20px;text-align:center'>Monday</td>";
            echo "<td><textarea name='job_assigned_1' class='form-control adjusted_text_area'>$monday_job</textarea></td>";
            echo "<td><textarea name='skill_acquired_1' class='form-control adjusted_text_area'>$monday_skill</textarea></td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td style='padding:20px;text-align:center'>Tuesday</td>";
            echo "<td><textarea name='job_assigned_2' class='form-control adjusted_text_area'>$tuesday_job</textarea></td>";
            echo "<td><textarea name='skill_acquired_2' class='form-control adjusted_text_area'>$tuesday_skill</textarea></td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td style='padding:20px;text-align:center'>Wednesday</td>";
            echo "<td><textarea name='job_assigned_3' class='form-control adjusted_text_area'>$wednesday_job</textarea></td>";
            echo "<td><textarea name='skill_acquired_3' class='form-control adjusted_text_area'>$wednesday_skill</textarea></td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td style='padding:20px;text-align:center'>Thursday</td>";
            echo "<td><textarea name='job_assigned_4' class='form-control adjusted_text_area'>$thursday_job</textarea></td>";
            echo "<td><textarea name='skill_acquired_4' class='form-control adjusted_text_area'>$thursday_skill</textarea></td>";
            echo "</tr>";

            echo "<tr>";
            echo "<td style='padding:20px;text-align:center'>Friday</td>";
            echo "<td><textarea name='job_assigned_5' class='form-control adjusted_text_area'>$friday_job</textarea></td>";
            echo "<td><textarea name='skill_acquired_5' class='form-control adjusted_text_area'>$friday_skill</textarea></td>";
            echo "</tr>";
          ?>
        </tbody>
    </table>
      <div id="buttons_holder">
      <input type="submit" value="Update" class="btn btn-primary" name="btn_update" <?php echo $btn_update_status; ?>>
      <input type="submit" value="Save"   class="btn btn-primary" name="btn_save" <?php echo $btn_save_status; ?> >
    </div>
        </form>
      </div>
</div>
</div>
</div>

</body>
</html>