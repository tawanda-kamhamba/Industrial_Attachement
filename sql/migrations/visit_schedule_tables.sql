-- Visit scheduling: supervisor availability and student preferred visit days
-- Run once on existing databases (tables are also auto-created by the API).

CREATE TABLE IF NOT EXISTS supervisor_visit_availability (
    id INT(11) NOT NULL AUTO_INCREMENT,
    lecturer_id INT(11) NOT NULL,
    visit_date DATE NOT NULL,
    published_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_lecturer_date (lecturer_id, visit_date),
    INDEX idx_lecturer (lecturer_id),
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS student_visit_selections (
    id INT(11) NOT NULL AUTO_INCREMENT,
    availability_id INT(11) NOT NULL,
    student_index_number VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_availability (student_index_number, availability_id),
    INDEX idx_availability (availability_id),
    INDEX idx_student (student_index_number),
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
