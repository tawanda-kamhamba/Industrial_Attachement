<?php
include 'database_connection/database_connection.php';

// Fix the orientation_checklist table to have proper AUTO_INCREMENT id

// First, fix any duplicate ids (especially id=0)
$max_result = mysqli_query($conn, "SELECT MAX(id) as max_id FROM orientation_checklist");
$max_row = mysqli_fetch_assoc($max_result);
$current_max = $max_row['max_id'] ?? 0;

echo "<p>Current max id: $current_max</p>";

// Update rows with id=0 to new unique ids
$update_sql = "SET @new_id = $current_max;
UPDATE orientation_checklist SET id = (@new_id := @new_id + 1) WHERE id = 0 ORDER BY completed_at ASC";
if (mysqli_multi_query($conn, $update_sql)) {
    echo "<p>Updated duplicate id=0 rows to unique ids.</p>";
    // Consume the results
    do {
        if ($result = mysqli_store_result($conn)) {
            mysqli_free_result($result);
        }
    } while (mysqli_next_result($conn));
} else {
    echo "<p>Error updating ids: " . mysqli_error($conn) . "</p>";
}

// Now, check if id is already AUTO_INCREMENT
$result = mysqli_query($conn, "SHOW COLUMNS FROM orientation_checklist LIKE 'id'");
if ($result) {
    $row = mysqli_fetch_assoc($result);
    $extra = $row['Extra'] ?? '';
    if (strpos($extra, 'auto_increment') !== false) {
        echo "<p>id is already AUTO_INCREMENT.</p>";
    } else {
        // Check if id is primary key
        $pk_result = mysqli_query($conn, "SHOW KEYS FROM orientation_checklist WHERE Key_name = 'PRIMARY' AND Column_name = 'id'");
        if (mysqli_num_rows($pk_result) == 0) {
            // Add primary key
            if (mysqli_query($conn, "ALTER TABLE orientation_checklist ADD PRIMARY KEY (id)")) {
                echo "<p>Added PRIMARY KEY to id.</p>";
            } else {
                echo "<p>Error adding PRIMARY KEY: " . mysqli_error($conn) . "</p>";
            }
        }

        // Now set AUTO_INCREMENT
        if (mysqli_query($conn, "ALTER TABLE orientation_checklist MODIFY id INT(11) NOT NULL AUTO_INCREMENT")) {
            echo "<p>Set id to AUTO_INCREMENT.</p>";
        } else {
            echo "<p>Error setting AUTO_INCREMENT: " . mysqli_error($conn) . "</p>";
        }
    }
}

// Get new max id after updates
$max_result2 = mysqli_query($conn, "SELECT MAX(id) as max_id FROM orientation_checklist");
$max_row2 = mysqli_fetch_assoc($max_result2);
$new_max = $max_row2['max_id'] ?? 0;

// Set AUTO_INCREMENT to new_max + 1
$new_auto = $new_max + 1;
if (mysqli_query($conn, "ALTER TABLE orientation_checklist AUTO_INCREMENT = $new_auto")) {
    echo "<p>Set AUTO_INCREMENT to $new_auto.</p>";
} else {
    echo "<p>Error setting AUTO_INCREMENT value: " . mysqli_error($conn) . "</p>";
}

echo "<h2>✅ Table fixed!</h2>";
?>