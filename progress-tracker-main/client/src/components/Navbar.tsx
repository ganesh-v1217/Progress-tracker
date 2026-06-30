import { Link } from 'react-router-dom';
import './Navbar.css'; // You can create a simple CSS for this

export default function Navbar({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="navbar">
      <div className="nav-logo">ProgressTracker</div>
      <div className="nav-links">
        <Link to="/dashboard">Home</Link>
        <a href="#about">About</a>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  )
}