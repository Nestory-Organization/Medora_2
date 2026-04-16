import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import UploadReports from './pages/patient/UploadReports';
import MedicalHistory from './pages/patient/MedicalHistory';
import Prescriptions from './pages/patient/Prescriptions';
import MyAppointments from './pages/patient/MyAppointments';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import SymptomChecker from './pages/ai/SymptomChecker';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import './App.css';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Home />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Route>
      
      {/* Protected Dashboard Pages */}
      <Route element={<DashboardLayout />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/upload-reports" element={<UploadReports />} />
        <Route path="/patient/history" element={<MedicalHistory />} />
        <Route path="/patient/prescriptions" element={<Prescriptions />} />
        <Route path="/patient/appointments" element={<MyAppointments />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/doctors" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        
        {/* AI Services */}
        <Route path="/ai/symptom-checker" element={<SymptomChecker />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    );
}

export default App;