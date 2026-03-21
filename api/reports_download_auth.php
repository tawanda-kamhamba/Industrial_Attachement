<?php
/**
 * Shared authorization for serving report files from submit_report/uploads.
 */

function iasms_ensure_student_reports_table(mysqli $conn): void
{
    mysqli_query(
        $conn,
        "CREATE TABLE IF NOT EXISTS student_reports (
      id INT(11) NOT NULL AUTO_INCREMENT,
      student_name VARCHAR(255) NOT NULL,
      index_number VARCHAR(100) NOT NULL,
      report_files_json LONGTEXT NOT NULL,
      original_filenames_json LONGTEXT NOT NULL,
      submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      admin_comment TEXT,
      PRIMARY KEY (id),
      UNIQUE KEY index_number_unique (index_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1"
    );
}

/**
 * @return string|false realpath to uploads directory
 */
function iasms_reports_uploads_realpath()
{
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'submit_report' . DIRECTORY_SEPARATOR . 'uploads';
    return realpath($dir);
}

function iasms_report_basename_safe(string $name): string
{
    $name = str_replace(["\0", '/', '\\'], '', $name);
    $name = basename($name);
    if (strpos($name, '..') !== false) {
        return '';
    }

    return $name;
}

function iasms_report_extension_allowed(string $basename): bool
{
    $ext = strtolower(pathinfo($basename, PATHINFO_EXTENSION));

    return in_array($ext, ['pdf', 'doc', 'docx'], true);
}

/**
 * Admin may download if file exists under uploads and matches admin_reports.php visibility rules.
 */
function iasms_admin_may_download_report(mysqli $conn, string $basename, string $uploadsReal): bool
{
    iasms_ensure_student_reports_table($conn);

    $path = $uploadsReal . DIRECTORY_SEPARATOR . $basename;
    if (!is_file($path)) {
        return false;
    }
    $fileReal = realpath($path);
    if ($fileReal === false || strpos($fileReal, $uploadsReal) !== 0) {
        return false;
    }
    if (!iasms_report_extension_allowed($basename)) {
        return false;
    }

    $nRows = 0;
    $cnt = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM student_reports');
    if ($cnt && ($row = mysqli_fetch_assoc($cnt))) {
        $nRows = (int)($row['c'] ?? 0);
    }

    $res = mysqli_query($conn, 'SELECT report_files_json FROM student_reports');
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $files = json_decode($row['report_files_json'] ?? '[]', true);
            if (!is_array($files)) {
                continue;
            }
            foreach ($files as $f) {
                if (iasms_report_basename_safe((string)$f) === $basename) {
                    return true;
                }
            }
        }
    }

    // Legacy folder scan (only when no student_reports rows), same as admin_reports.php
    if ($nRows === 0) {
        return true;
    }

    return false;
}

/**
 * Filenames a supervisor may open — mirrors supervisor_reports.php list rules.
 *
 * @return string[] basenames
 */
function iasms_supervisor_allowed_report_filenames(mysqli $conn, array $assigned): array
{
    $uploadsDir = dirname(__DIR__) . '/submit_report/uploads';
    $names = [];

    if (empty($assigned)) {
        return [];
    }

    $inList = array_map(
        static function (string $idx) use ($conn): string {
            return "'" . mysqli_real_escape_string($conn, $idx) . "'";
        },
        $assigned
    );
    $inSql = implode(',', $inList);

    $res = mysqli_query(
        $conn,
        "SELECT index_number, report_files_json
         FROM student_reports
         WHERE index_number IN ($inSql)
         ORDER BY submission_date DESC"
    );

    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $filesJson = $row['report_files_json'] ?? '[]';
            $files = json_decode($filesJson, true);
            if (!is_array($files)) {
                continue;
            }
            foreach ($files as $f) {
                $filename = iasms_report_basename_safe((string)$f);
                $path = $uploadsDir . DIRECTORY_SEPARATOR . $filename;
                if ($filename !== '' && is_file($path)) {
                    $names[$filename] = true;
                }
            }
        }
    }

    if (!empty($names)) {
        return array_keys($names);
    }

    // Legacy: filename stem matches assigned index_number
    if (!is_dir($uploadsDir)) {
        return [];
    }
    $assignedMap = [];
    foreach ($assigned as $idx) {
        $assignedMap[$idx] = true;
    }
    $files = array_diff(scandir($uploadsDir), ['.', '..']);
    foreach ($files as $f) {
        $path = $uploadsDir . DIRECTORY_SEPARATOR . $f;
        if (!is_file($path)) {
            continue;
        }
        if (!iasms_report_extension_allowed($f)) {
            continue;
        }
        $base = pathinfo($f, PATHINFO_FILENAME);
        if (isset($assignedMap[$base])) {
            $names[$f] = true;
            continue;
        }
        foreach (array_keys($assignedMap) as $idx) {
            $alt = str_replace(['/', '\\'], '_', $idx);
            if ($base === $alt) {
                $names[$f] = true;
                break;
            }
        }
    }

    return array_keys($names);
}

function iasms_supervisor_may_download_report(mysqli $conn, string $basename, string $uploadsReal): bool
{
    require_once __DIR__ . '/supervisor_helpers.php';

    iasms_ensure_student_reports_table($conn);

    $path = $uploadsReal . DIRECTORY_SEPARATOR . $basename;
    if (!is_file($path)) {
        return false;
    }
    $fileReal = realpath($path);
    if ($fileReal === false || strpos($fileReal, $uploadsReal) !== 0) {
        return false;
    }
    if (!iasms_report_extension_allowed($basename)) {
        return false;
    }

    $assigned = iasms_get_assigned_indexes_for_current_supervisor($conn);
    $allowed = iasms_supervisor_allowed_report_filenames($conn, $assigned);

    return in_array($basename, $allowed, true);
}

function iasms_report_mime_for_basename(string $basename): string
{
    $ext = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
    if ($ext === 'pdf') {
        return 'application/pdf';
    }
    if ($ext === 'doc') {
        return 'application/msword';
    }
    if ($ext === 'docx') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    return 'application/octet-stream';
}
