import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import './App.css';
import CustomerDashboard from './pages/UserDashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/dashboard" element={<CustomerDashboard />} />
            </Routes>
        </Router>
    );
}

export default App;