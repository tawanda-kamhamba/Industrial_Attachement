<?php

include 'database_connection/database_connection.php';

$_SESSION["wrong_password"]="";

if(isset($_POST["btn_signin"])){
  $login_index_number = $_POST["txtusername"];
  $login_password = $_POST["txtpassword"];

  $check_user_existence = "SELECT * FROM registered_students WHERE index_number='$login_index_number' AND password='$login_password' LIMIT 1";
  $run_query = mysqli_query($conn,$check_user_existence);
  $user_exist = mysqli_num_rows($run_query);
  if($user_exist==1){
    $get_user_details = "SELECT * FROM registered_students WHERE index_number='$login_index_number'";
    $run_get_details = mysqli_query($conn,$get_user_details);
    $get_detail = mysqli_fetch_assoc($run_get_details);

    $user_first_name = $get_detail["first_name"];
    $user_last_name = $get_detail["last_name"];
    setcookie("student_first_name",$user_first_name,time() + (86400 * 30),"/");
    setcookie("student_last_name",$user_last_name,time() + (86400 * 30),"/");
    setcookie("student_index_number",$login_index_number,time() + (86400 * 30),"/");

    header("Location:instructions_page/instructions_page.php");

  }else{
    $_SESSION["wrong_password"]="Wrong Username or Password";
  }
}

if(isset($_POST["btn_signup"])){
  $reg_first_name = trim((string)($_POST["txt_signup_firstname"] ?? ""));
  $reg_last_name = trim((string)($_POST["txt_signup_lastname"] ?? ""));
  $reg_index_number = trim((string)($_POST["txt_signup_indexnumber"] ?? ""));
  $reg_password = trim((string)($_POST["txt_signup_password"] ?? ""));

  if($reg_first_name !="" && $reg_last_name!="" && $reg_index_number!="" && $reg_password!=""){
  $reg_first_name_esc = mysqli_real_escape_string($conn, $reg_first_name);
  $reg_last_name_esc = mysqli_real_escape_string($conn, $reg_last_name);
  $reg_index_number_esc = mysqli_real_escape_string($conn, $reg_index_number);
  $reg_password_esc = mysqli_real_escape_string($conn, $reg_password);

  $check_existence = "SELECT * FROM registered_students WHERE index_number='$reg_index_number_esc'";
  $execute_check_existence = mysqli_query($conn,$check_existence);
  $data_existence = mysqli_num_rows($execute_check_existence);

  if($data_existence==1){
      $message ="Sorry, Account Already Exists";
      echo "<script>alert('$message')</script>";

  }else{
    $register_student_query = "INSERT INTO registered_students (first_name,last_name,index_number,password) VALUES ('$reg_first_name_esc','$reg_last_name_esc','$reg_index_number_esc','$reg_password_esc')";
    if($execute_register_student = mysqli_query($conn,$register_student_query)){

      setcookie("student_first_name",$reg_first_name,time() + (86400 * 30),"/");
      setcookie("student_last_name",$reg_last_name,time() + (86400 * 30),"/");
      setcookie("student_index_number",$reg_index_number,time() + (86400 * 30),"/");

      header("Location:instructions_page/instructions_page.php");
    }else{
      $errno = mysqli_errno($conn);
      $err = mysqli_error($conn);
      error_log("registered_students insert failed (errno=$errno): $err");

      $is_local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
      $error_message = $is_local ? "Unable to register: ($errno) $err" : "Unable to register due to errors";
      echo "<script>alert('$error_message')</script>";
    }
  }
}else{
  $fill_spaces_message ="Provide Details For All Spaces";
  echo "<script>alert('$fill_spaces_message')</script>";
}

  }
 ?>

<!DOCTYPE html>
<html >
<head>
  <meta charset="UTF-8">
  <title>Login</title>


  <link rel="stylesheet" href="css/style.css">

  <script type="text/javascript" src="js/jquery-3.1.1.min.js"/></script>
  <script type="text/javascript" src="js/bootstrap.min.js"/></script>

</head>

<body>
 
  <div class="login-wrap">
	<div class="login-html">

		<div id="text_holder">
			<h2><span style="color:rgba(255, 152, 0, 0.91);text-align:center;font-family:sans">UNIVERSITY OF ZIMBABWE <br><br> ATTACHMENT <br><br>MANAGEMENT SYSTEM</span></h2>
		</div>
		<input id="tab-1" type="radio" name="tab" class="sign-in" checked><label for="tab-1" class="tab">Sign In</label>
		<input id="tab-2" type="radio" name="tab" class="sign-up"><label for="tab-2" class="tab">Sign Up</label>
		<div class="login-form">
      <form method="post" action="">
			<div class="sign-in-htm">
				<div class="group">
					<label for="user" class="label">Reg Number</label>
					<input id="user" type="text" class="input" name="txtusername">
				</div>
				<div class="group">
					<label for="pass" class="label">Password</label>
					<input id="pass" type="password" class="input" data-type="password" name="txtpassword">
				</div>
				<div class="group">
					<input id="check" type="checkbox" class="check" checked>
					<label for="check"><span class="icon"></span> Keep me Signed in</label>
				</div>
				<div class="group">
					<input type="submit" class="button" value="Sign In" name="btn_signin" id="btn_signin"/>
				</div>
				
				<div class="group" style="text-align: center">
					<a href="admin/index.php"><u style="color:#26e2f7">Administrator</u></a>
				</div>
        <div class="group" style="text-align: center; margin-top:10px;">
          <a href="institutional_supervisor/institutional_supervisor_login.php">
            <u style="color:#26e2f7">Institutional Supervisor</u>
          </a>
        </div>
				
				<div class="hr"></div>
				<div class="error_message_holder"><span><?php echo $_SESSION["wrong_password"]?></span></div>
			</div>
    </form>

      <form method="post" action="">
			<div class="sign-up-htm">
				<div class="group">
					<label for="firstname" class="label">First Name</label>
					<input id="firstname" type="text" class="input" name="txt_signup_firstname">
				</div>
        <div class="group">
          <label for="lastname" class="label">Last Name</label>
          <input id="lastname" type="text" class="input" name="txt_signup_lastname">
        </div>
        <div class="group">
          <label for="index_number" class="label">Reg Number</label>
          <input id="index_number" type="text" class="input" name="txt_signup_indexnumber">
        </div>
				<div class="group">
					<label for="pass" class="label">Password</label>
					<input id="pass" type="password" class="input" data-type="password" name="txt_signup_password">
				</div>
				<div class="group">
					<input type="submit" class="button" value="Sign Up" name="btn_signup" id="btn_signup"/>
				</div>
				<div class="hr"></div>
			</div>
    </form>
		</div>
	</div>
</div>

</body>
</html>
