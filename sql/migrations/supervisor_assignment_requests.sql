-- Student requests for direct institutional supervisor assignment
CREATE TABLE IF NOT EXISTS supervisor_assignment_requests (
    id INT(11) NOT NULL AUTO_INCREMENT,
    student_index_number VARCHAR(100) NOT NULL,
    lecturer_id INT(11) NOT NULL,
    student_message TEXT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    response_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    INDEX idx_student (student_index_number),
    INDEX idx_lecturer_status (lecturer_id, status),
    INDEX idx_student_status (student_index_number, status)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
