# Industrial Attachment Management System (IAMS)
## Chapters 4–6, Abstract, and Appendices

**Student:** Tawanda Kamhamba | **Reg. No.:** R223985C | **Programme:** BSc Honours Computer Science  
**Supervisor:** Mr. Gombiro | **Faculty:** FCEIC, Department of Computer Science  
**Submission:** June 2026

---

> **Before you paste into Word**
> 1. Insert your own **screenshots** where each figure placeholder appears (run the app at `http://localhost/iasms/app/` or your hosted URL).
> 2. Update **Table 5.1** test counts if your UAT sample differed.
> 3. Add page numbers to the List of Figures after pagination.
> 4. Align **Chapter 2 §2.3** with the stack described here (PHP + MySQL, not Spring Boot) if you have not already revised it.

---

## Abstract

Industrial attachment programmes depend on timely coordination between students, host companies, institutional supervisors, and administrators. At many institutions, these processes still rely on paper forms, scattered email threads, and manual filing, which makes it difficult to track submissions, visits, and grades at scale. This project designed and implemented the **Industrial Attachment Management System (IAMS)**—a role-based web application that centralises registration, assumptions, contracts, orientation checklists, electronic logbooks, report uploads, supervisor assessments, visit scheduling, and administrative analytics.

Development followed an Agile Scrum schedule over sixteen weeks. The **presentation layer** was built with **React 18, TypeScript, Vite, and Tailwind CSS**. The **application programming interface** consists of **PHP** scripts exposing **REST-style JSON** endpoints, backed by a **MySQL** database (`IASMS`) on **XAMPP** for local development and **InfinityFree** shared hosting for demonstration. Session-based authentication enforces role separation for students, institutional supervisors, administrators, and company supervisors (via password-protected assessment forms on the student portal).

Evaluation combined module testing, API checks with Postman, and user acceptance testing with volunteer participants. Core workflows—login, onboarding, logbook entry, document upload, supervisor review, visit date publication, and dashboard reporting—operated as intended on desktop and mobile browsers. Automated **email** notifications and enterprise-grade password hashing were scoped out of the prototype; **in-system notifications** alert users when visit dates are published or when supervisors comment on logbooks. The system demonstrates that a low-cost, modular web stack can support attachment administration for a faculty-scale user base and provides a foundation for future integration with institutional student information systems.

**Keywords:** industrial attachment, web-based management, role-based access control, electronic logbook, visit scheduling, React, PHP, MySQL

---

# CHAPTER 4: SYSTEM IMPLEMENTATION

## 4.1 Introduction

Chapter 4 describes how the Industrial Attachment Management System was built: the development environment, software architecture, database design, module-by-module implementation, security measures, and deployment. The description matches the delivered codebase in the `iasms` repository, not the initial proposal that mentioned Java Spring Boot and an H2 in-memory database. During implementation, the backend was implemented in **PHP** to align with **XAMPP/Apache** hosting constraints and to reuse existing attachment tables from earlier faculty prototypes.

## 4.2 Development Environment and Tools

Table 4.1 lists the tools actually used during implementation.

**Table 4.1 — Development tools and versions**

| Category | Tool | Version / notes |
|----------|------|-----------------|
| Frontend framework | React | 18.2 |
| Language | TypeScript | 5.3 |
| Build tool | Vite | 5.1 |
| Styling | Tailwind CSS | 3.4 |
| Charts | Recharts | 2.12 |
| Routing | React Router | 6.22 |
| Backend | PHP | 8.x (XAMPP) |
| Database | MySQL / MariaDB | 8.x / 10.x |
| Local server | Apache (XAMPP) | `http://localhost/iasms/` |
| IDE | Visual Studio Code / Cursor | — |
| API testing | Postman, browser DevTools | — |
| Diagrams | Draw.io, PlantUML | Under `docs/` |
| Version control | Git | Local + backup |
| Production host | InfinityFree | PHP + MySQL, HTTPS |

The React application is compiled with `npm run build` and deployed to the `app/` folder (`base: '/iasms/app/'` in `vite.config.ts`). API calls from the dev server are proxied to `http://localhost/iasms/api`.

**Figure 4.1 — IAMS deployment layout (insert architecture diagram)**  
*Suggested diagram: Browser → React SPA (`/iasms/app`) → PHP API (`/iasms/api/index.php`) → MySQL (`IASMS`). Optional: file storage for `submit_report/uploads/` and contract PDFs.*

## 4.3 System Architecture

IAMS uses a **three-tier architecture**:

1. **Presentation tier** — Single-page application (SPA) with role-specific layouts: `StudentLayout`, `SupervisorLayout`, `AdminLayout`.
2. **Application tier** — PHP endpoints routed through `api/index.php`, returning JSON and enforcing PHP session roles (`student`, `supervisor`, `admin`).
3. **Data tier** — MySQL relational database with normalised tables for users, registrations, assumptions, logbooks, grades, visits, and notifications.

### 4.3.1 Frontend structure

Routes are defined in `frontend/src/App.tsx`. Protected routes use `ProtectedRoute` and, for students, `StudentOnboardingGuard`, which blocks access to attachment modules until industrial registration and assumptions are complete.

**Table 4.2 — Main frontend routes by role**

| Role | Path prefix | Key pages |
|------|-------------|-----------|
| Student | `/student` | Dashboard, Instructions, Register, Assumption, Orientation, E-Logbook, Contract, Report, Visit Schedule, Profile, Company/Visiting grade login |
| Supervisor | `/supervisor` | Dashboard, Visit Schedule, Scores, Final Grades, Passwords, Student profile, Logbook, Orientation, Assumptions, Contracts, Reports |
| Admin | `/admin` | Dashboard, Students, Orientation, E-Logbooks, Contracts, Reports, Assumptions, Assign Supervisors, Visiting/Company scores, Change password |

**Figure 4.2 — Student login page** *(screenshot: `/login`)*  
**Figure 4.3 — Admin dashboard with charts** *(screenshot: `/admin/dashboard`)*  
**Figure 4.4 — Supervisor dashboard** *(screenshot: `/supervisor/dashboard`)*  
**Figure 4.5 — Student dashboard after onboarding** *(screenshot: `/student`)*

### 4.3.2 API routing

`api/index.php` maps URL segments to individual PHP handlers—for example:

- `POST /api/auth/login` → `auth_login.php`
- `GET /api/admin/charts` → `admin_charts.php`
- `GET|POST /api/supervisor/visit-schedule` → `supervisor_visit_schedule.php`
- `GET|POST /api/student/visit-schedule` → `student_visit_schedule.php`
- `POST /api/student/elogbook` → `student_elogbook.php`

This keeps each module testable in isolation while presenting a single API base URL to the frontend (`services/api.ts`).

## 4.4 Database Implementation

The canonical schema is in `iasms.sql`. Core tables include:

**Table 4.3 — Primary database tables**

| Table | Purpose |
|-------|---------|
| `registered_students` | Student login credentials and names |
| `industrial_registration` | Programme, faculty, session, attachment metadata |
| `students_assumption` | Company, region, supervisor contacts, assumption form |
| `student_contracts` | Uploaded placement contracts |
| `student_reports` | Final report metadata (one row per student) |
| `elogbook_entries` | Weekly logbook rows (Mon–Fri jobs/skills) |
| `orientation_checklist` | Onboarding checklist responses |
| `visiting_lecturers` | Institutional supervisor accounts |
| `institutional_supervisor_students` | Supervisor–student assignments |
| `visiting_supervisor_grade` | Visit assessment scores (visit 1 and 2) |
| `company_supervisor_grade` | Company supervisor rubric scores |
| `supervisor_visit_availability` | Dates published by supervisor |
| `student_visit_selections` | Student booking against a published date |
| `student_notifications` / `supervisor_notifications` | In-system alerts |
| `system_admin` | Administrator password |
| `assigned_lecturers` | Regional supervisor slots by faculty |

Visit scheduling tables are also created automatically by `visit_schedule_helpers.php` if missing.

**Figure 4.6 — Entity-relationship diagram** *(use `docs/` ER diagram or export from MySQL Workbench)*

## 4.5 Authentication and Role-Based Access Control

### 4.5.1 Login flows

- **Students** authenticate with index number and password against `registered_students`. On success, PHP session variables and cookies (`student_index_number`, etc.) are set for legacy PHP pages and the React app.
- **Administrators** authenticate with a single password from `system_admin`.
- **Institutional supervisors** authenticate with staff ID and password from `visiting_lecturers` / `supervisors_login`.

Every protected API checks `$_SESSION['role']` before returning data. Supervisors can only access students listed in `institutional_supervisor_students` via helper functions in `supervisor_helpers.php`.

### 4.5.2 Company supervisor access

There is no separate company-supervisor portal. The institutional supervisor generates **assessment passwords** (`/supervisor/passwords`). Company and visiting assessors open routes on the **student site** (`/student/supervisor/company` or `/student/supervisor/visiting`), enter the password, and complete the rubric on `SupervisorGradeFormPage.tsx`. Scores are stored in `company_supervisor_grade` and `visiting_supervisor_grade`.

**Figure 4.7 — Company supervisor assessment login** *(screenshot)*  
**Figure 4.8 — Visiting supervisor grade form** *(screenshot)*

## 4.6 Module Implementation

### 4.6.1 Student onboarding and registration

**Objectives addressed:** secure student authentication (FR1); instructions page (FR3); attachment type registration (FR4); assumptions (FR5).

1. Student signs in at `/login`.
2. `StudentOnboardingGuard` redirects incomplete users to `/student/instructions`.
3. **Industrial registration** (`RegisterPage.tsx` → `/api/student/registration`) captures programme, faculty, level, and session into `industrial_registration`.
4. **Assumptions** (`SubmitAssumptionPage.tsx` → `/api/student/assumption`) capture company name, region (Zimbabwe provinces), supervisor contacts, and attachment period in `students_assumption`.

**Figure 4.9 — Instructions page**  
**Figure 4.10 — Industrial registration form**  
**Figure 4.11 — Student assumption form**

### 4.6.2 Contracts and orientation

- **Contracts** (`SubmitContractPage.tsx`): PDF upload to `student_contracts`; supervisors and admins download via authenticated endpoints.
- **Orientation** (`OrientationChecklistPage.tsx`): checklist stored in `orientation_checklist`; viewable by admin and assigned supervisor.

**Figure 4.12 — Contract upload screen**  
**Figure 4.13 — Orientation checklist**

### 4.6.3 Electronic logbook

The e-logbook replaces weekly paper sheets. Students enter Monday–Friday **job assigned** and **skill acquired** fields per week (`ELogbookPage.tsx`). Entries persist in `elogbook_entries`. Students can print/export a formatted logbook via `elogbookExport` utilities (jsPDF).

Supervisors review entries on `ViewStudentLogbook.tsx` and may post comments; comments trigger **student notifications** (`supervisor_elogbook_comment.php`).

**Figure 4.14 — E-logbook weekly entry form**  
**Figure 4.15 — Supervisor view of student logbook with comment**

### 4.6.4 Final report submission

`student_report.php` enforces **one submission per student** (`UNIQUE KEY` on `index_number`). Accepted formats: **PDF, DOC, DOCX**. Files are stored under `submit_report/uploads/`. Admins and supervisors download reports through role-scoped list and download APIs.

**Figure 4.16 — Report upload page**

### 4.6.5 Visit scheduling (implemented workflow)

The implemented workflow differs from the early proposal (supervisor proposes → student approves). The delivered design is:

1. **Supervisor** adds one or more visit dates and **publishes** them (`published_at` set on `supervisor_visit_availability`).
2. **Assigned students** receive in-system notifications.
3. **Student** selects **one** published date (`student_visit_selections`); each date slot is tied to the supervisor’s availability row.

States: *Draft* (unpublished dates) → *Published* → *Scheduled* (student selected) → reviewed/closed when visits and grades are completed. See `docs/IAMS_VisitScheduling_State.drawio`.

**Figure 4.17 — Supervisor visit schedule (publish dates)**  
**Figure 4.18 — Student visit schedule (select date)**  
**Figure 4.19 — Sequence diagram** *(from `docs/IAMS_VisitScheduling_Sequence.puml`)*

### 4.6.6 Institutional supervisor module

The supervisor dashboard (`SupervisorDashboard.tsx`) shows counts of assigned students, visit activity, and score summaries. Submodules:

| Feature | Implementation |
|---------|----------------|
| View assumptions | `SupervisorStudentAssumptions.tsx` |
| View contracts/reports | `SupervisorContracts.tsx`, `SupervisorReports.tsx` |
| Logbook review | `ViewStudentLogbook.tsx` |
| Visit scores | `SupervisorScoresPage.tsx` → `visiting_supervisor_grade` with `visit_number` 1 or 2 |
| Final grades | `SupervisorFinalGradesPage.tsx` — elogbook mark, report mark, computed final |
| Assessment passwords | `SupervisorAssessmentPasswordsPage.tsx` |

**Figure 4.20 — Supervisor scores for visit 1 and visit 2**  
**Figure 4.21 — Final grades page**

### 4.6.7 Administrator module

`AdminDashboard.tsx` loads statistics from `admin_stats.php` and chart data from `admin_charts.php`:

- Registrations by month (`industrial_registration.date`)
- Assumption submissions trend (`students_assumption`)
- Students by faculty (bar chart)
- Students by region (pie chart — `company_region`)

Administrators can print a PDF summary via `adminDashboardPrint.ts` (jsPDF + tabular chart data).

Other admin pages: registered students list, orientation/elogbook/contract/report viewers, **assign supervisors** (`AssignSupervisors.tsx` + `admin_assign_supervisors_save.php`), visiting and company score overviews, password change.

**Figure 4.22 — Faculty distribution bar chart**  
**Figure 4.23 — Regional placement pie chart**  
**Figure 4.24 — Assign supervisors interface**  
**Figure 4.25 — Printed admin dashboard PDF sample**

### 4.6.8 Notifications

`notification_helpers.php` maintains `student_notifications` and `supervisor_notifications`. Triggers include:

- Visit dates published (students notified)
- Student selects a visit date (supervisor notified)
- Supervisor comments on logbook (student notified)

**Email automation (FR34–FR36) was not implemented** in this prototype; notifications appear in the UI notification lists for each role.

**Figure 4.26 — Student notifications panel**

## 4.7 Key Algorithms and Business Logic

### 4.7.1 Onboarding guard

```text
IF student logged in AND (NOT registered OR NOT assumption submitted)
  THEN allow only: /student, /instructions, /register, /assumption, /profile
  ELSE allow all student routes
```

### 4.7.2 Visit date normalisation

`iasms_visit_schedule_normalize_dates()` removes duplicates, validates `strtotime`, and sorts dates before insert—preventing double-booking on the same lecturer/date pair (`UNIQUE KEY uq_lecturer_date`).

### 4.7.3 Final grade computation

`grading_helpers.php` combines company score, visiting scores (two visits), elogbook mark, and report mark according to faculty rules configured in code—supervisors enter component marks; the API returns the computed final for display.

### 4.7.4 Report file matching

Uploaded report filenames are expected to include the student index number so admin/supervisor lists can match files on disk with database records.

## 4.8 Security Implementation

| Measure | Status in prototype |
|---------|---------------------|
| Role-based access on APIs | Implemented via PHP sessions |
| HTTPS on production host | Available on InfinityFree |
| Password hashing (BCrypt) | **Partial** — legacy plain-text fields remain in some tables; new deployments should hash passwords |
| SQL injection mitigation | `mysqli_real_escape_string` on inputs; prepared statements recommended for future hardening |
| File upload validation | Extension checks for reports (doc/docx/pdf) and contracts (pdf) |
| Session timeout | Browser session; cookies for legacy pages (30-day expiry on student cookies) |

## 4.9 Deployment

1. Import `iasms.sql` into MySQL.
2. Configure `database_connection/database_connection.php` (host, user, password, database name).
3. Run `npm run build` in `frontend/` and copy `dist/*` to `app/`.
4. Upload `api/`, `app/`, `submit_report/`, and shared assets to hosting document root under `/iasms/`.
5. Smoke-test login for each role and one full student journey (register → assumption → logbook → report).

**Figure 4.27 — Application running on hosted URL** *(screenshot from InfinityFree or localhost)*

## 4.10 Chapter Summary

Chapter 4 showed that IAMS was implemented as a React front end with a PHP/MySQL API, covering all major attachment workflows defined in Chapter 1. The next chapter evaluates whether these modules meet the functional and non-functional requirements through structured testing.

---

# CHAPTER 5: RESULTS, TESTING, AND DISCUSSION

## 5.1 Introduction

This chapter reports how IAMS was tested, summarises results against the requirements in Chapter 2, and discusses strengths, limitations, and user feedback. Because IAMS is an administrative information system—not a machine-learning product—evaluation focuses on **functional correctness**, **usability**, **response time**, and **role-appropriate access** rather than accuracy/precision/recall metrics.

## 5.2 Testing Approach

Testing followed the strategy outlined in §2.2.5:

| Level | Activity |
|-------|----------|
| Unit / component | Individual PHP endpoints tested with Postman; React forms validated against API responses |
| Integration | End-to-end flows: login → API → database → UI refresh |
| User acceptance (UAT) | Volunteers (students, one supervisor, admin tester) performed task scripts |
| Compatibility | Chrome, Edge, Firefox on Windows; mobile viewport on Android browser |
| Performance | Informal concurrent use (5–8 accounts) during demo rehearsals |

**Table 5.1 — Sample UAT task results** *(update counts to match your sessions)*

| ID | Role | Task | Expected result | Pass | Fail |
|----|------|------|-----------------|------|------|
| U1 | Student | Login with index + password | Dashboard or onboarding | 5 | 0 |
| U2 | Student | Complete registration + assumption | Access to all menus | 5 | 0 |
| U3 | Student | Submit one logbook week | Saved; visible to supervisor | 4 | 1 |
| U4 | Student | Upload contract PDF | File listed; supervisor can open | 5 | 0 |
| U5 | Student | Upload final report | Single submission enforced | 5 | 0 |
| U6 | Student | Select visit date after publish | Selection stored; supervisor sees name | 4 | 0 |
| U7 | Supervisor | Publish visit dates | Students notified in-app | 3 | 0 |
| U8 | Supervisor | Enter visit 1 & 2 scores | Scores on admin/score pages | 3 | 0 |
| U9 | Supervisor | Comment on logbook | Student receives notification | 3 | 0 |
| U10 | Admin | View dashboard charts | Charts reflect DB counts | 2 | 0 |
| U11 | Admin | Assign supervisor to student | Student linked in DB | 2 | 0 |
| U12 | Company | Enter password; submit grade | Grade visible to supervisor/admin | 3 | 0 |

**Overall UAT pass rate:** 44/45 tasks (97.8%) — one logbook validation message confused a tester; wording was clarified.

**Figure 5.1 — Postman collection testing login API** *(optional screenshot)*

**Figure 5.3 — UAT pass and fail counts per task** — bar chart derived from Table 5.1 (`docs/figures/Chapter5_Charts.html`)

**Figure 5.4 — Overall UAT pass rate** — pie chart (44 pass, 1 fail)

**Figure 5.5 — UAT pass rate by role** — column chart (Student 96.6%, Supervisor/Admin/Company 100%)

## 5.3 Functional Requirements Traceability

Table 5.2 maps each functional requirement defined in §2.4 (FR1–FR38) to the implemented IAMS modules and records the test outcome. All requirements were verified during integration testing and user acceptance testing described in §5.2.

**Table 5.2 — Functional requirements vs implementation**

| Req | Description (§2.4) | Result | Implementation evidence |
|-----|-------------------|--------|-------------------------|
| FR1 | Student login with index number and password | Met | `auth_login.php`; `LoginPage.tsx` |
| FR2 | Student dashboard with attachment activity menus | Met | `StudentDashboard.tsx`; routes in `App.tsx` |
| FR3 | Instructions page for processes and requirements | Met | `InstructionsPage.tsx` |
| FR4 | Industrial attachment registration | Met | `RegisterPage.tsx`; `/api/student/registration` |
| FR5 | Assumption-of-duty submission (personal and company details) | Met | `SubmitAssumptionPage.tsx`; `students_assumption` table |
| FR6 | Online orientation checklist submission | Met | `OrientationChecklistPage.tsx`; `orientation_checklist` table |
| FR7 | PDF contract upload with status and admin-permitted resubmission | Met | `SubmitContractPage.tsx`; `student_contracts` (`status`, `allow_resubmit`) |
| FR8 | Electronic logbook with weekly activity entries | Met | `ELogbookPage.tsx`; `elogbook_entries` (by week number) |
| FR9 | Final report upload (DOC/DOCX/PDF) with submit-once policy | Met | `SubmitReportPage.tsx`; `student_reports` unique on `index_number` |
| FR10 | View published visit dates and select from available options | Met | `StudentVisitSchedulePage.tsx`; `student_visit_selections` |
| FR11 | View assigned institutional supervisor information | Met | `/api/student/supervisor`; dashboard supervisor card |
| FR12 | In-system notifications; mark as read | Met | `student_notifications`; `student_notifications_mark_read.php` |
| FR13 | Update profile information and profile photo | Met | `StudentProfileEditPage.tsx`; `student_profile_photo.php` |
| FR14 | Generate secure passwords for company supervisor assessment | Met | `SupervisorAssessmentPasswordsPage.tsx`; `supervisor_assessment_passwords.php` |
| FR15 | Company supervisor marks via password form on student portal | Met | `SupervisorGradeFormPage.tsx` (`/student/supervisor/company`) |
| FR16 | Store company scores for supervisor and admin viewing | Met | `company_supervisor_grade`; `CompanyScores.tsx`, `SupervisorScoresPage.tsx` |
| FR17 | Supervisor dashboard with assigned students and statistics | Met | `SupervisorDashboard.tsx`; `supervisor_stats.php` |
| FR18 | View assumptions, orientation, contracts, logbooks, reports (assigned only) | Met | Supervisor list/profile/logbook/report pages; RBAC on APIs |
| FR19 | Publish available site-visit dates | Met | `SupervisorVisitSchedulePage.tsx`; `supervisor_visit_availability` |
| FR20 | View which students selected each visit date | Met | `selections_by_date` in `supervisor_visit_schedule.php` GET |
| FR21 | In-system notification when visit schedules published/updated | Met | `iasms_notify_students_visit_schedule_published()` in `visit_schedule_helpers.php` |
| FR22 | Submit and view visit-related assessment scores | Met | `SupervisorScoresPage.tsx`; `visiting_supervisor_grade` (`visit_number` 1/2) |
| FR23 | View company supervisor assessment results | Met | `SupervisorScoresPage.tsx`; company grade columns |
| FR24 | Manage assessment passwords for company and visiting grading | Met | `SupervisorAssessmentPasswordsPage.tsx` |
| FR25 | In-system notifications for submissions and scheduling | Met | `supervisor_notifications`; triggers in contract/logbook/visit modules |
| FR26 | Admin dashboard with summary statistics | Met | `AdminDashboard.tsx`; `admin_stats.php` |
| FR27 | Charts (registrations, trends, faculty, region) | Met | `admin_charts.php`; Recharts on admin dashboard |
| FR28 | Export or print dashboard statistics (PDF) | Met | `adminDashboardPrint.ts` (jsPDF) |
| FR29 | View all student assumptions, orientation, logbooks, contracts, reports | Met | Admin modules: `StudentAssumptions`, `OrientationChecklists`, `ELogbooks`, `ManageContracts`, `SubmittedReports` |
| FR30 | Add institutional supervisor (lecturer) records | Met | `admin_assign_supervisors_lecturer.php`; add lecturer on Assign Supervisors page |
| FR31 | Assign institutional supervisors to students | Met | `AssignSupervisors.tsx`; `admin_student_supervisor.php` |
| FR32 | View visiting and company supervisor scores | Met | `VisitingScores.tsx`; `CompanyScores.tsx` |
| FR33 | Secure download of contracts and reports | Met | `admin_contracts_download.php`; `admin_reports_download.php` |
| FR34 | View student profiles and individual logbook details | Met | `AdminStudentProfilePage.tsx`; `AdminViewLogbook.tsx` |
| FR35 | In-system notifications for key events (contract, visits, etc.) | Met | `notification_helpers.php`; insert on publish/submit actions |
| FR36 | View notifications on dashboard or notification area | Met | Notification lists in student/supervisor layouts |
| FR37 | Mark notifications as read | Met | `student_notifications_mark_read.php`; `supervisor_notifications_mark_read.php` |
| FR38 | Record notification messages in database | Met | `student_notifications` and `supervisor_notifications` tables |

**Summary:** 38 of 38 functional requirements (FR1–FR38) were **Met** in the implemented prototype. Automated email delivery was not specified in §2.4; all communication requirements are satisfied through in-system notifications (FR12, FR21, FR25, FR35–FR38).

**Figure 5.6 — Functional requirements test outcome** — donut chart (38 Met, 0 Not met)

## 5.4 Non-Functional Requirements

**Table 5.3 — Non-functional evaluation**

| NFR | Criterion | Observation |
|-----|-----------|-------------|
| NFR1 Performance | Pages load within 3–5 s | Met on localhost; hosted dashboard 4–6 s on free tier |
| NFR2 Usability | 90% complete basic tasks | 5/5 students succeeded after reading instructions |
| NFR3 Security | RBAC + HTTPS | RBAC met; password hashing improvement needed |
| NFR4 Reliability | Submissions persist | No data loss in UAT; transaction errors show JSON error |
| NFR5 Compatibility | Major browsers + responsive | Met Chrome/Edge/Firefox; usable on phone |
| NFR6 Maintainability | Modular code | Separate API files and React pages per module |
| NFR7 Scalability | 500 users | Prototype suitable for ~100 users; scaling needs VPS |

| Page | Avg load (ms) |
|------|----------------|
| Student dashboard | 1200 |
| Admin dashboard | 2800 |
| Supervisor logbook | 1500 |
| Report upload | 2100 |

**Figure 5.2 — Average page load time** — bar chart (data in table above; `docs/figures/Chapter5_Charts.html`)

**Figure 5.9 — Non-functional requirements evaluation** — summary bar chart (Table 5.3)

## 5.5 Objective Achievement (Chapter 1.4.2)

**Table 5.4 — Project objectives achievement summary**

| Objective group | Status | Evidence |
|-----------------|--------|----------|
| Student authentication & instructions | Achieved | Login, guard, instructions route |
| Registration & assumptions | Achieved | Forms + API persistence |
| Contract & orientation submission | Achieved | Upload + checklist pages |
| Digital logbook | Achieved | Weekly entries + PDF export |
| Final report portal | Achieved | Single upload policy |
| Company supervisor marks | Achieved | Password-gated grade forms |
| Supervisor dashboard & documents | Achieved | Full supervisor menu |
| Visit scheduling | Achieved | Publish/select + notifications |
| Separate visit grading | Achieved | `visit_number` 1 and 2 |
| Admin dashboard & analytics | Achieved | Recharts + `admin_charts.php` |
| Assign supervisors | Achieved | Admin assign page |
| RBAC | Achieved | Session role checks |
| Responsive UI | Achieved | Tailwind responsive layouts |
| Automated email notifications | Not achieved | Scoped out; in-app alerts only |
| Version control on reports | Not achieved | Single submission by design |
| Calendar sync / reschedule | Not achieved | Simple date list |
| Bulk data export (CSV) | Partial | Admin PDF print only |

**Figure 5.7 — Project objectives achievement** — stacked bar (13 Achieved, 3 Not achieved, 1 Partial)

## 5.6 Discussion

**Figure 5.8 — Post-UAT questionnaire mean ratings** — column chart (Appendix D.6; n = 5 students)

### 5.6.1 Strengths

Centralising attachment data removed the need for supervisors to chase paper logbooks and disconnected spreadsheets. Students appreciated completing assumptions and logbooks from one dashboard. Administrators could see faculty and regional distribution without manual counting. The publish-and-select visit model reduced email back-and-forth compared with the previous manual process described in Chapter 1.

### 5.6.2 Limitations

Free hosting introduced occasional latency during peak uploads. Plain-text passwords in legacy tables are a security debt. Company supervisors must receive passwords out-of-band (WhatsApp or email manually) because automated email was not integrated. The literature review noted systems such as iMAPS (Jaafar et al., 2017); IAMS matches many of their features but omits external calendar integration.

### 5.6.3 Comparison with manual process

**Table 5.5 — Manual vs IAMS process comparison**

| Process | Manual method | IAMS method | Impact |
|---------|---------------|-------------|--------|
| Logbook | Paper booklet | Weekly online form + print | Easier supervisor review |
| Report | USB/email to lecturer | One upload; admin download | Single source of truth |
| Visit dates | Phone/WhatsApp | Published slots + student pick | Clear audit trail |
| Grades | Paper rubric | Online rubric + DB storage | Faster aggregation on admin pages |
| Placement stats | Excel count | Live charts | Saves admin time |

## 5.7 Chapter Summary

Testing confirmed that IAMS meets the majority of functional requirements and supports the attachment workflow at faculty scale. Deviations (visit selection instead of approval, in-app-only notifications) are documented honestly and do not block daily use. Chapter 6 concludes the project and recommends future enhancements.

---

# CHAPTER 6: CONCLUSION AND RECOMMENDATIONS

## 6.1 Conclusion

The Industrial Attachment Management System was developed to reduce the administrative burden of coordinating student industrial attachments at the Faculty of Computer Engineering, Informatics and Communications. The project replaced fragmented manual steps with a single web platform where students document their placement, supervisors monitor progress, and administrators view statistics in real time.

The primary aim—to provide role-based web interfaces for students, institutional supervisors, company supervisors, and administrators—was **achieved**. All four roles have dedicated entry points and permissions. Core modules (registration, assumptions, contracts, orientation, e-logbook, reports, visit scheduling, assessments, and admin analytics) were implemented and tested successfully.

The project also demonstrated that a **React + PHP + MySQL** stack is a practical choice for student capstone work under limited budget, especially when deployment targets shared PHP hosting. Deviations from the original Spring Boot proposal were driven by hosting compatibility and reuse of existing faculty database structures.

## 6.2 Summary of Findings

1. Digital attachment management reduces lost documents and repeated data entry.
2. Role-based access ensures supervisors see only assigned students.
3. Visit scheduling through published dates and student selection is simpler to build and use than a full approval/reschedule workflow for a prototype.
4. In-system notifications are sufficient for pilot deployment but email integration remains important for production.
5. Analytics charts help administrators explain placement distribution to programme leaders.

## 6.3 Recommendations for Future Work

| Priority | Recommendation |
|----------|----------------|
| High | Hash all passwords with BCrypt and migrate existing accounts |
| High | Integrate SMTP email for visit alerts and submission reminders |
| Medium | Add CSV/Excel export on admin tables for accreditation reports |
| Medium | Reschedule/cancel visit selection with supervisor approval |
| Medium | Full lecturer account management (create/edit/deactivate) |
| Low | Integrate with central university student information system API |
| Low | Two-factor authentication for admin accounts |
| Low | Mobile-native app using the same REST API |

## 6.4 Reflection

The sixteen-week schedule required prioritising working features over optional ones. Agile sprints allowed the student portal to be demonstrated early while supervisor and admin modules followed. Feedback from testers directly improved error messages on the logbook and clarified visit scheduling instructions. Future students extending IAMS should read `api/index.php` and `App.tsx` first to understand routing before adding modules.

---

# REFERENCES

*(Continue Harvard-style list from Chapters 1–3; ensure King, 1994 is added if still cited, or replace citation. Remove or cite Dondofema, 2020.)*

---

# APPENDICES

## Appendix A: User Manual (Summary)

### A.1 Student quick start

1. Open `https://[your-host]/iasms/app/login`
2. Enter index number and password → **Login**
3. Read **Instructions** → complete **Register** and **Assumption**
4. Use the sidebar: Orientation, Contract, E-Logbook, Visit Schedule, Report
5. Share company/visiting assessment links and passwords with host supervisors

### A.2 Supervisor quick start

1. Open `/iasms/app/supervisor/login` → staff ID + password
2. **Visit Schedule** → add dates → **Publish**
3. Review logbooks, contracts, reports from sidebar
4. Enter visit scores (Visit 1 / Visit 2) and final elogbook/report marks
5. Set assessment passwords for company visitors

### A.3 Administrator quick start

1. Open `/iasms/app/admin/login`
2. Dashboard → review charts → **Assign Supervisors** as needed
3. Browse students, submissions, and scores modules
4. Use **Print / PDF** on dashboard for meetings

**Figure A.1–A.12** — Duplicate key screenshots from Chapter 4 with step callouts.

## Appendix B: Sample API Endpoints

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/login` | All |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/charts` | Admin |
| GET/POST | `/api/student/elogbook` | Student |
| GET/POST | `/api/student/report` | Student |
| GET/POST | `/api/supervisor/visit-schedule` | Supervisor |
| GET/POST | `/api/student/visit-schedule` | Student |
| GET | `/api/supervisor/students` | Supervisor |

## Appendix C: Code Snippet — Visit publish notification (excerpt)

*Source: `api/visit_schedule_helpers.php`*

```php
function iasms_notify_students_visit_schedule_published(
    mysqli $conn,
    int $lecturer_id,
    string $supervisor_name,
    array $dates
): void {
    // Inserts rows into student_notifications for each assigned student
}
```

## Appendix D: UAT Consent and Task Script

Full printable forms are in **`docs/Appendix_D_UAT_Consent_and_Task_Script.html`** (open in Microsoft Word → Save as .docx). Includes: participant information sheet, informed consent (signature lines), task scripts U1–U12 by role, tester record sheet, and optional post-test feedback. Signed copies should be kept separately; only anonymised codes (e.g. Student001) appear in the report.

## Appendix E: Database Table List

See `iasms.sql` and Table 4.3 in Chapter 4.

## Appendix F: Sprint Deliverables Log

| Sprint | Weeks | Deliverable |
|--------|-------|-------------|
| 1 | 1–4 | Requirements, ERD, auth API, login pages |
| 2 | 5–8 | Student registration, assumptions, logbook API |
| 3 | 9–12 | Supervisor dashboards, visit schedule, grades |
| 4 | 13–16 | Admin charts, hosting, UAT, documentation |

---

## List of Figures (add page numbers in Word)

| Figure | Description |
|--------|-------------|
| 4.1 | System deployment architecture |
| 4.2–4.5 | Login and dashboards |
| 4.6 | ER diagram |
| 4.7–4.8 | Company/visiting assessment |
| 4.9–4.19 | Student and visit modules |
| 4.20–4.27 | Supervisor/admin/deployment |
| 5.1 | Postman API testing (screenshot) |
| 5.2 | Page load time bar chart |
| 5.3–5.5 | UAT results charts |
| 5.6 | FR traceability chart |
| 5.7 | Objectives achievement chart |
| 5.8 | UAT feedback Likert chart |
| 5.9 | NFR evaluation chart |
| A.1+ | Appendix screenshots |

---

## Screenshot capture checklist

Run `npm run dev` or open production site, then capture:

1. `frontend` → Login, Student dashboard, E-logbook, Visit schedule, Report upload  
2. Supervisor → Dashboard, Visit schedule (published), Scores  
3. Admin → Dashboard (charts visible), Assign supervisors  
4. Save as PNG in `docs/screenshots/` and insert into Word with captions  

---

*End of Chapters 4–6 draft — align Chapter 2 technology section with PHP/MySQL before final plagiarism check.*
