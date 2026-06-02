import {Routes, Route} from 'react-router-dom'

import { Toaster } from './components/ui/toaster.jsx'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import AccountPage from './pages/AccountPage.jsx'
import FilePage from './pages/FilePage.jsx'
import PasswordResetPage from './pages/PasswordResetPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

import './App.css'

function App() {

    return (
        <>
            <Toaster />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
                    </ProtectedRoute>
                } />
                <Route path="/account" element={
                    <ProtectedRoute>
                        <AccountPage />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<PasswordResetPage />} />
                <Route path="/reset-password/:token" element={<PasswordResetPage />} />
                <Route path="/reset" element={<PasswordResetPage />} />
                <Route path="/reset/:token" element={<PasswordResetPage />} />
                <Route path="/profile/:userid" element={<ProfilePage />} />
                <Route path="/file/:fileId" element={<FilePage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
        </>
    )
}

export default App