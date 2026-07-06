import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Subscription from './pages/Subscription'
import Achievements from './pages/Achievements'
import Rules from './pages/Rules'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminUsers from './pages/Admin/Users'
import AdminBroadcast from './pages/Admin/Broadcast'
import AdminReports from './pages/Admin/Reports'
import AdminLogin from './pages/AdminLogin'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="stats" element={<Stats />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="rules" element={<Rules />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
