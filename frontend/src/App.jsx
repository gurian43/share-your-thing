import {Router, Route} from 'react-router'
import HomePage from './pages/HomePage'

function App() {

  return (
    <>
        <Router>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/storage" element={<StoragePage />} />
        </Router>
    </>
  )
}

export default App
