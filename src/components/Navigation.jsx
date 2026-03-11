import { NavLink } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>AccessNav</h1>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              aria-label="Home"
            >
              <svg 
                className="nav-icon" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/map" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              aria-label="Map"
            >
              <svg 
                className="nav-icon" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Map</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              aria-label="Profile"
            >
              <svg 
                className="nav-icon" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
