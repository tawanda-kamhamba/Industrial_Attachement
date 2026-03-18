import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { SupervisorLayout } from './layouts/SupervisorLayout';
import { StudentLayout } from './layouts/StudentLayout';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { SupervisorLoginPage } from './pages/auth/SupervisorLoginPage';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RegisteredStudents } from './pages/admin/RegisteredStudents';
import { OrientationChecklists } from './pages/admin/OrientationChecklists';
import { ELogbooks } from './pages/admin/ELogbooks';
import { ManageContracts } from './pages/admin/ManageContracts';
import { SubmittedReports } from './pages/admin/SubmittedReports';
import { StudentAssumptions } from './pages/admin/StudentAssumptions';
import { AssignSupervisors } from './pages/admin/AssignSupervisors';
import { VisitingScores } from './pages/admin/VisitingScores';
import { CompanyScores } from './pages/admin/CompanyScores';
import { ChangePassword } from './pages/admin/ChangePassword';

// Supervisor
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { ViewStudentLogbook } from './pages/supervisor/ViewStudentLogbook';
import { SupervisorOrientationChecklists } from './pages/supervisor/SupervisorOrientationChecklists';
import { SupervisorELogbooks } from './pages/supervisor/SupervisorELogbooks';
import { SupervisorStudentAssumptions } from './pages/supervisor/SupervisorStudentAssumptions';
import { SupervisorContracts } from './pages/supervisor/SupervisorContracts';
import { SupervisorReports } from './pages/supervisor/SupervisorReports';
import { SupervisorScoresPage } from './pages/supervisor/SupervisorScoresPage';
import { SupervisorAssessmentPasswordsPage } from './pages/supervisor/SupervisorAssessmentPasswordsPage';
import { StudentProfilePage } from './pages/supervisor/StudentProfilePage';
import { AdminViewLogbook } from './pages/admin/AdminViewLogbook';
import { AdminStudentProfilePage } from './pages/admin/AdminStudentProfilePage';

// Student
import { StudentDashboard } from './pages/student/StudentDashboard';
import { InstructionsPage } from './pages/student/InstructionsPage';
import { OrientationChecklistPage } from './pages/student/OrientationChecklistPage';
import { ELogbookPage } from './pages/student/ELogbookPage';
import { SubmitContractPage } from './pages/student/SubmitContractPage';
import { SubmitReportPage } from './pages/student/SubmitReportPage';
import { RegisterPage } from './pages/student/RegisterPage';
import { SubmitAssumptionPage } from './pages/student/SubmitAssumptionPage';
import { SupervisorAssessmentLoginPage } from './pages/student/SupervisorLoginPage';
import { SupervisorGradeFormPage } from './pages/student/SupervisorGradeFormPage';
import { StudentProfileEditPage } from './pages/student/StudentProfileEditPage';

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'admin' | 'supervisor' | 'student';
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || user.role !== role) return <Navigate to={role === 'admin' ? '/admin/login' : role === 'supervisor' ? '/supervisor/login' : '/login'} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/supervisor/login" element={<SupervisorLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<RegisteredStudents />} />
        <Route path="orientation" element={<OrientationChecklists />} />
        <Route path="elogbooks" element={<ELogbooks />} />
        <Route path="students/:indexNumber" element={<AdminStudentProfilePage />} />
        <Route path="logbook/:indexNumber" element={<AdminViewLogbook />} />
        <Route path="contracts" element={<ManageContracts />} />
        <Route path="reports" element={<SubmittedReports />} />
        <Route path="assumptions" element={<StudentAssumptions />} />
        <Route path="assign-supervisors" element={<AssignSupervisors />} />
        <Route path="visiting-scores" element={<VisitingScores />} />
        <Route path="company-scores" element={<CompanyScores />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      <Route
        path="/supervisor"
        element={
          <ProtectedRoute role="supervisor">
            <SupervisorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="scores" element={<SupervisorScoresPage />} />
        <Route path="passwords" element={<SupervisorAssessmentPasswordsPage />} />
        <Route path="student/:indexNumber" element={<StudentProfilePage />} />
        <Route path="logbook/:indexNumber" element={<ViewStudentLogbook />} />
        <Route path="orientation" element={<SupervisorOrientationChecklists />} />
        <Route path="elogbooks" element={<SupervisorELogbooks />} />
        <Route path="assumptions" element={<SupervisorStudentAssumptions />} />
        <Route path="contracts" element={<SupervisorContracts />} />
        <Route path="reports" element={<SupervisorReports />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="instructions" element={<InstructionsPage />} />
        <Route path="orientation" element={<OrientationChecklistPage />} />
        <Route path="elogbook" element={<ELogbookPage />} />
        <Route path="contract" element={<SubmitContractPage />} />
        <Route path="report" element={<SubmitReportPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<StudentProfileEditPage />} />
        <Route path="assumption" element={<SubmitAssumptionPage />} />
        <Route path="supervisor/visiting" element={<SupervisorAssessmentLoginPage />} />
        <Route path="supervisor/visiting/grade" element={<SupervisorGradeFormPage />} />
        <Route path="supervisor/company" element={<SupervisorAssessmentLoginPage />} />
        <Route path="supervisor/company/grade" element={<SupervisorGradeFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
