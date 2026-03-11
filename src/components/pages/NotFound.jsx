import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-icon" aria-hidden="true">🔍</div>
        <h1>Oops! Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Home
          </Link>
          
          <Link to="/map" className="btn-secondary">
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Map
          </Link>
        </div>

        <div className="helpful-links">
          <h2>Maybe try these instead?</h2>
          <ul>
            <li><Link to="/">Home Dashboard</Link></li>
            <li><Link to="/map">Find Accessible Routes</Link></li>
            <li><Link to="/profile">Your Profile Settings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
