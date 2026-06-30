import Navbar from '../components/Navbar';
import ClockTimer from '../components/ClockTimer';
import PDFManager from '../components/PDFManager';
import ProgressStats from '../components/ProgressStats';
import './Dashboard.css';
import{ useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    // window.location.href = '/login';
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <Navbar onLogout={handleLogout} />
      <div className="dashboard-content">
        <div className="section-timer">
          <h2>Practice Timer</h2>
          <ClockTimer />
        </div>
        <div className="section-main">
          <div className="section-progress">
             <ProgressStats />
          </div>
          <div className="section-pdf">
            <PDFManager />
          </div>
        </div>
      </div>
    </div>
  );
}