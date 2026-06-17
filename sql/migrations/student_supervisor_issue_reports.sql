-- Student issue reports to assigned institutional supervisor(s)
CREATE TABLE IF NOT EXISTS student_supervisor_issue_reports (
    id INT(11) NOT NULL AUTO_INCREMENT,
    student_index_number VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    issue_message TEXT NOT NULL,
    status ENUM('open','acknowledged') NOT NULL DEFAULT 'open',
    acknowledged_by_lecturer_id INT(11) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_student (student_index_number),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
