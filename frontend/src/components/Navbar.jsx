import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <span className="brand-icon">🏋️</span>
                <span className="brand-name">Adaptive Fitness</span>
            </div>

            <div className="nav-links">
                <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
                <Link to="/workout" className={isActive('/workout')}>🏋️ Workout</Link>
                <Link to="/nutrition" className={isActive('/nutrition')}>🥗 Nutrition</Link>
            </div>

            <div className="nav-user">
                <span className="nav-username">👤 {user.name?.split(' ')[0] || 'User'}</span>
                <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
}
