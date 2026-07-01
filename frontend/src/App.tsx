import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Subscription from './pages/Subscription'
import Achievements from './pages/Achievements'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminUsers from './pages/Admin/Users'
import AdminBroadcast from './pages/Admin/Broadcast'
import AdminReports from './pages/Admin/Reports'
import AdminLogin from './pages/AdminLogin'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="stats" element={<Stats />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="achievements" element={<Achievements />} />
        <Route path="admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="admin/broadcast" element={<AdminProtectedRoute><AdminBroadcast /></AdminProtectedRoute>} />
        <Route path="admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
