import {Router, Route} from 'react-router'
import HomePage from './pages/HomePage'

function App() {

  return (
    <>
        <Router>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/file" element={<FilePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/admin" element={<AdminPage />} />
        </Router>
    </>
  )
}

export default App
