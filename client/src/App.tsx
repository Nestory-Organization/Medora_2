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
import BookingPage from './pages/patient/BookingPage';
import PaymentPage from './pages/patient/PaymentPage';
import PaymentSuccess from './pages/patient/PaymentSuccess';
import PaymentCancel from './pages/patient/PaymentCancel';
import PatientTelemedicine from './pages/patient/PatientTelemedicine';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AvailabilityManagement from './pages/doctor/AvailabilityManagement';
import DoctorProfile from './pages/doctor/DoctorProfile';
import PatientAppointments from './pages/doctor/PatientAppointments';
import PatientDetail from './pages/doctor/PatientDetail';
import PrescriptionManagement from './pages/doctor/PrescriptionManagement';
import AppointmentNotes from './pages/doctor/AppointmentNotes';
import TelemedicineSession from './pages/doctor/Telemedicine';
import DoctorEarnings from './pages/doctor/DoctorEarnings';
import RescheduleRequests from './pages/doctor/RescheduleRequests';
import SymptomChecker from './pages/ai/SymptomChecker';
import AiHistory from './pages/ai/AiHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import VerifyDoctors from './pages/admin/VerifyDoctors';
import DoctorEarningsAdmin from './pages/admin/DoctorEarningsAdmin';
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
      
      {/* Public Telemedicine Route - Outside Dashboard for roomId access */}
      <Route path="/patient-telemedicine/:roomId" element={<PatientTelemedicine />} />
      
      {/* Protected Dashboard Pages */}
      <Route element={<DashboardLayout />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/upload-reports" element={<UploadReports />} />
        <Route path="/patient/history" element={<MedicalHistory />} />
        <Route path="/patient/prescriptions" element={<Prescriptions />} />
        <Route path="/patient/appointments" element={<MyAppointments />} />
        <Route path="/patient/book" element={<BookingPage />} />
        <Route path="/patient/payment" element={<PaymentPage />} />
        <Route path="/patient/payment-success" element={<PaymentSuccess />} />
        <Route path="/patient/payment-cancel" element={<PaymentCancel />} />
        
        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/availability" element={<AvailabilityManagement />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/appointments" element={<PatientAppointments />} />
        <Route path="/doctor/reschedule-requests" element={<RescheduleRequests />} />
        <Route path="/doctor/patient/:patientId" element={<PatientDetail />} />
        <Route path="/doctor/appointment/:appointmentId/prescription" element={<PrescriptionManagement />} />
        <Route path="/doctor/appointment/:appointmentId/notes" element={<AppointmentNotes />} />
        <Route path="/doctor/appointment/:appointmentId/telemedicine" element={<TelemedicineSession />} />
        <Route path="/doctor/earnings" element={<DoctorEarnings />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/earnings" element={<DoctorEarningsAdmin />} />
        <Route path="/admin/doctors" element={<VerifyDoctors />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        
        {/* AI Services */}
        <Route path="/ai/symptom-checker" element={<SymptomChecker />} />
        <Route path="/ai/history" element={<AiHistory />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    );
}

export default App;