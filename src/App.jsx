import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Welcome from './components/pages/Welcome';
import SignIn from './components/pages/SignIn';
import Onboarding from './components/pages/Onboarding';
import EmergencySetup from './components/pages/EmergencySetup';
import Home from './components/pages/Home';
import Map from './components/pages/Map';
import Profile from './components/pages/Profile';
import NotFound from './components/pages/NotFound';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Onboarding flow - no navigation */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/emergency-setup" element={<EmergencySetup />} />
        
        {/* Main app - with navigation */}
        <Route path="/" element={
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Home />
            </main>
          </div>
        } />
        <Route path="/map" element={
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Map />
            </main>
          </div>
        } />
        <Route path="/profile" element={
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Profile />
            </main>
          </div>
        } />
        
        {/* 404 - catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
