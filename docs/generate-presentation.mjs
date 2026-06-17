import pptxgen from "pptxgenjs";

const pres = new pptxgen();
pres.author = "Tawanda Kamhamba";
pres.title = "Industrial Attachment Management System (IAMS)";
pres.subject = "Capstone Presentation R223985C";

const TITLE = { x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true, color: "1E40AF" };
const H2 = { x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 22, bold: true, color: "1E40AF" };
const BODY = { x: 0.55, y: 1.15, w: 9, h: 5.5, fontSize: 14, color: "1F2937", valign: "top" };
const PLACE = { x: 5.2, y: 1.2, w: 4.2, h: 4.5, fontSize: 12, color: "B45309", align: "center", valign: "middle", fill: { color: "FEF3C7" }, line: { color: "F59E0B", width: 1, dashType: "dash" } };

function bullets(items, opts = {}) {
  return items.map(t => ({ text: t, options: { bullet: true, breakLine: true, ...opts } }));
}

function titleSlide(title, lines) {
  const s = pres.addSlide();
  s.addText(title, { ...TITLE, y: 1.6, align: "center", w: 9.5, x: 0.25 });
  s.addText(lines.join("\n"), { x: 0.5, y: 2.8, w: 9, h: 2.5, fontSize: 16, align: "center", color: "475569" });
}

function contentSlide(title, items, placeholder) {
  const s = pres.addSlide();
  s.addText(title, H2);
  s.addText(bullets(items), BODY);
  if (placeholder) s.addText(placeholder, PLACE);
}

titleSlide("Industrial Attachment Management System (IAMS)", [
  "Tawanda Kamhamba | R223985C",
  "BSc Honours Computer Science — FCEIC",
  "Supervisor: Mr. Gombiro",
  "University of Zimbabwe | June 2026"
]);

contentSlide("1. Introduction", [
  "Student: Tawanda Kamhamba",
  "Registration Number: R223985C",
  "Project Title: Industrial Attachment Management System (IAMS)",
  "Supervisor: Mr. Gombiro — Department of Computer Science, FCEIC",
  "Web-based platform centralising industrial attachment workflows"
]);

contentSlide("1(d) Brief Background of the Problem", [
  "Industrial attachment connects academic learning with workplace practice",
  "Coordination required among students, companies, supervisors, and administrators",
  "Many institutions still use paper forms, email, WhatsApp, and scattered storage",
  "This causes delays, lost documents, and poor visibility of student progress",
  "Faculty needs a central digital system to manage attachment at scale"
]);

contentSlide("2(a) What Problem Is Being Addressed?", [
  "Fragmented, manual management of industrial attachment programmes",
  "No single platform for registration, assumption, orientation, contracts, logbooks, reports, visits, grades",
  "Difficulty assigning and monitoring students to supervisors and host companies",
  "Assessment records stored separately and inconsistently"
]);

contentSlide("2(b) Why Is It Important?", [
  "Attachment quality depends on timely monitoring and accurate records",
  "Manual processes are error-prone and hard to scale (Sulaiman et al., 2022)",
  "Institutions cannot easily demonstrate programme effectiveness",
  "Poor coordination frustrates students, supervisors, and industry partners"
]);

contentSlide("2(c) Who Is Affected by the Problem?", [
  "Students — delayed feedback, unclear requirements, lost submissions",
  "Institutional supervisors — difficulty tracking assigned students and visits",
  "Company supervisors — informal grading and communication channels",
  "Faculty administrators — heavy workload counting registrations and reports",
  "Host companies — limited structured feedback mechanisms"
]);

contentSlide("3(a) General Objective", [
  "Develop IAMS: a role-based web application centralising industrial attachment management",
  "Support students, institutional supervisors, company supervisors, and administrators",
  "Replace fragmented manual processes with one integrated digital platform",
  "Enable monitoring, scheduling, assessment, and reporting from one source of truth"
]);

contentSlide("3(b) Specific Objectives — Student Module", [
  "Secure login using registration number and password",
  "Instructions page and onboarding guidance",
  "Industrial registration and assumption of duty submission",
  "Orientation checklist, contract upload, weekly e-logbook, final report upload",
  "Visit date selection, supervisor assignment requests, issue reporting"
]);

contentSlide("3(b) Specific Objectives — Supervisor & Admin", [
  "Supervisor dashboard for assigned students and document review",
  "Visit scheduling: publish dates → students select → notifications",
  "Visit grading, e-logbook marks, report marks, final grade computation",
  "Password-protected company and visiting supervisor assessment forms",
  "Admin analytics, supervisor assignment, in-system notifications"
]);

contentSlide("3(c) Expected Outcomes", [
  "Working web prototype replacing paper-based processes",
  "Centralised MySQL database of attachment records",
  "Faster supervisor monitoring and grade aggregation",
  "Real-time admin analytics and improved audit trail",
  "Foundation for future integration with institutional systems (e.g. Emhare)"
]);

contentSlide("4(a) System Architecture Diagram", [
  "Three-tier architecture:",
  "Presentation: React 18 SPA (TypeScript, Vite, Tailwind CSS)",
  "Application: PHP REST JSON API with session-based RBAC",
  "Data: MySQL relational database (IASMS)",
  "Flow: Browser → React (/iasms/app) → PHP API → MySQL + file storage"
], "[INSERT IMAGE]\nSystem Architecture Diagram");

contentSlide("4(b) Database Design — ER Diagram", [
  "Normalised MySQL schema (iasms.sql)",
  "Core: registered_students, industrial_registration, students_assumption",
  "Documents: student_contracts, student_reports, orientation_checklist",
  "Activity: elogbook_entries, supervisor_visit_availability, student_visit_selections",
  "Assessment: visiting_supervisor_grade, company_supervisor_grade"
], "[INSERT IMAGE]\nEntity-Relationship Diagram");

contentSlide("4(c) Class Diagram", [
  "Frontend: StudentLayout, SupervisorLayout, AdminLayout",
  "Pages: RegisterPage, ELogbookPage, SupervisorDashboard, AdminDashboard",
  "Backend: auth_login.php, student_*.php, supervisor_*.php, admin_*.php",
  "Helpers: grading_helpers, notification_helpers, visit_schedule_helpers"
], "[INSERT IMAGE]\nUML Class Diagram");

contentSlide("4(d) Use Case Diagram", [
  "Actors: Student, Institutional Supervisor, Company Supervisor, Administrator",
  "Student: login, register, submit forms, e-logbook, upload documents, select visit",
  "Supervisor: review documents, publish visits, enter scores",
  "Admin: view analytics, assign supervisors, monitor submissions"
], "[INSERT IMAGE]\nUse Case Diagram");

contentSlide("4(e) Workflow / Process Flowchart", [
  "Student journey: Login → Registration → Assumption → Orientation → E-Logbook → Contract → Report",
  "Visit workflow: Supervisor publishes dates → Student selects → Visit → Scores recorded",
  "Grading: Company score + Visit scores + E-logbook mark + Report mark → Final grade"
], "[INSERT IMAGE]\nProcess Flowchart");

contentSlide("Technology Stack", [
  "Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router",
  "Backend: PHP 8 on Apache (XAMPP), REST JSON API",
  "Database: MySQL / MariaDB",
  "Tools: Postman, Git, Draw.io, jsPDF | Methodology: Agile Scrum (16 weeks)"
]);

contentSlide("5(a) Demo — Login & Registration", [
  "Multi-role login: Student (index + password), Supervisor (staff ID), Admin",
  "Onboarding guard blocks modules until registration and assumption complete",
  "Industrial registration: programme, faculty, level, session",
  "Assumption form: company, region, supervisor contacts, attachment period"
], "[INSERT SCREENSHOT]\nLogin & Registration");

contentSlide("5(b) Main System Features", [
  "Student portal: dashboard, orientation, e-logbook, contract, report, visit schedule",
  "Supervisor portal: assigned students, logbook review, visit scheduling, scores, grades",
  "Admin portal: student lists, document viewers, assign supervisors, score overviews",
  "Supervisor assignment requests and student issue reporting"
], "[INSERT SCREENSHOT]\nDashboards (3 roles)");

contentSlide("5(c) Data Input and Processing", [
  "Weekly e-logbook: Mon–Fri job assigned & skill acquired → elogbook_entries",
  "PDF contract upload; single final report (PDF/DOC/DOCX)",
  "Supervisor logbook comments trigger student notifications",
  "Final grade computed from company, visit, e-logbook, and report marks"
], "[INSERT SCREENSHOT]\nE-logbook & Grading");

contentSlide("5(d) Reports and Dashboards", [
  "Admin charts: registrations by month, assumptions trend, faculty bar chart, region pie chart",
  "Printable admin dashboard PDF summary (jsPDF)",
  "Authenticated download of contracts and reports",
  "UAT pass rate: 97.8% (44/45 tasks)"
], "[INSERT SCREENSHOT]\nAdmin Charts & PDF");

contentSlide("5(e) AI / ML Functionality", [
  "Not applicable to this project",
  "IAMS is an administrative information system — not a machine learning product",
  "Evaluation: functional correctness, usability, response time, RBAC",
  "Future work: predictive analytics on placement success"
]);

contentSlide("5(f) Mobile App Functionality", [
  "No native mobile application (Android/iOS) was developed",
  "IAMS is a responsive web application on desktop and mobile browsers",
  "Tested on Chrome, Edge, Firefox and Android mobile viewport",
  "Tailwind CSS responsive layouts support field attachment use"
]);

contentSlide("5(g) Security & Conclusion", [
  "RBAC via PHP sessions on all protected API endpoints",
  "ProtectedRoute and StudentOnboardingGuard on frontend",
  "File upload validation; SQL injection mitigation; HTTPS on production",
  "Conclusion: IAMS centralises attachment management using React + PHP + MySQL",
  "Thank you — Questions?"
]);

await pres.writeFile({ fileName: "IAMS_Capstone_Presentation.pptx" });
console.log("Created IAMS_Capstone_Presentation.pptx");
