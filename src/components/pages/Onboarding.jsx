import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUserPreferences } from '../../services/userService';
import './Onboarding.css';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    colorBlind: false,
    dyslexia: false,
    mobility: {
      wheelchairAccessible: false,
      avoidStairs: false,
      needsRamps: false,
      needsElevators: false
    },
    vision: {
      audioDescriptions: false,
      highContrast: false,
      screenReader: false
    },
    cognitive: {
      simplifiedNavigation: false,
      reducedMotion: false
    },
    hearing: {
      visualAlerts: false
    },
    transport: {
      publicTransport: false,
      walking: false,
      wheelchair: false,
      cycling: false
    }
  });

  const navigate = useNavigate();

  const steps = [
    {
      title: "Visual Accessibility",
      subtitle: "Color blindness and dyslexia support",
      type: "visual-basic"
    },
    {
      title: "Mobility Needs",
      subtitle: "Wheelchair accessible routes, avoid stairs",
      type: "mobility"
    },
    {
      title: "Vision Support",
      subtitle: "Audio descriptions and high-contrast mode",
      type: "vision"
    },
    {
      title: "Cognitive Support",
      subtitle: "Simplified navigation and reduced motion",
      type: "cognitive"
    },
    {
      title: "Hearing Support",
      subtitle: "Visual alerts for audio cues",
      type: "hearing"
    },
    {
      title: "Preferred Transport",
      subtitle: "Select your preferred modes of transport",
      type: "transport"
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences before navigating
      try {
        await saveUserPreferences(preferences);
        navigate('/emergency-setup');
      } catch (error) {
        console.error('Error saving preferences:', error);
        // Navigate anyway, preferences can be updated later
        navigate('/emergency-setup');
      }
    }
  };

  const handleSkip = async () => {
    // Save whatever preferences were selected
    try {
      await saveUserPreferences(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
    navigate('/emergency-setup');
  };

  const handleToggle = (category, field) => {
    if (category) {
      setPreferences(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: !prev[category][field]
        }
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case 'visual-basic':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.colorBlind}
                onChange={() => handleToggle(null, 'colorBlind')}
              />
              <div className="preference-content">
                <span className="preference-icon">🎨</span>
                <div>
                  <h3>Color Blind Mode</h3>
                  <p>High contrast colors and patterns</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.dyslexia}
                onChange={() => handleToggle(null, 'dyslexia')}
              />
              <div className="preference-content">
                <span className="preference-icon">📖</span>
                <div>
                  <h3>Dyslexia Support</h3>
                  <p>Dyslexia-friendly fonts and spacing</p>
                </div>
              </div>
            </label>
          </div>
        );

      case 'mobility':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.mobility.wheelchairAccessible}
                onChange={() => handleToggle('mobility', 'wheelchairAccessible')}
              />
              <div className="preference-content">
                <span className="preference-icon">♿</span>
                <div>
                  <h3>Wheelchair Accessible</h3>
                  <p>Routes with wheelchair access</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.mobility.avoidStairs}
                onChange={() => handleToggle('mobility', 'avoidStairs')}
              />
              <div className="preference-content">
                <span className="preference-icon">🚫</span>
                <div>
                  <h3>Avoid Stairs</h3>
                  <p>No stairs in route planning</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.mobility.needsRamps}
                onChange={() => handleToggle('mobility', 'needsRamps')}
              />
              <div className="preference-content">
                <span className="preference-icon">📐</span>
                <div>
                  <h3>Prefer Ramps</h3>
                  <p>Routes with ramps available</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.mobility.needsElevators}
                onChange={() => handleToggle('mobility', 'needsElevators')}
              />
              <div className="preference-content">
                <span className="preference-icon">🛗</span>
                <div>
                  <h3>Need Elevators</h3>
                  <p>Routes with elevator access</p>
                </div>
              </div>
            </label>
          </div>
        );

      case 'vision':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.vision.audioDescriptions}
                onChange={() => handleToggle('vision', 'audioDescriptions')}
              />
              <div className="preference-content">
                <span className="preference-icon">🔊</span>
                <div>
                  <h3>Audio Descriptions</h3>
                  <p>Spoken directions and alerts</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.vision.highContrast}
                onChange={() => handleToggle('vision', 'highContrast')}
              />
              <div className="preference-content">
                <span className="preference-icon">◐</span>
                <div>
                  <h3>High Contrast Mode</h3>
                  <p>Enhanced visual contrast</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.vision.screenReader}
                onChange={() => handleToggle('vision', 'screenReader')}
              />
              <div className="preference-content">
                <span className="preference-icon">👁️</span>
                <div>
                  <h3>Screen Reader Optimized</h3>
                  <p>Enhanced screen reader support</p>
                </div>
              </div>
            </label>
          </div>
        );

      case 'cognitive':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.cognitive.simplifiedNavigation}
                onChange={() => handleToggle('cognitive', 'simplifiedNavigation')}
              />
              <div className="preference-content">
                <span className="preference-icon">🧩</span>
                <div>
                  <h3>Simplified Navigation</h3>
                  <p>Clearer, simpler directions</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.cognitive.reducedMotion}
                onChange={() => handleToggle('cognitive', 'reducedMotion')}
              />
              <div className="preference-content">
                <span className="preference-icon">⏸️</span>
                <div>
                  <h3>Reduced Motion</h3>
                  <p>Minimize animations and transitions</p>
                </div>
              </div>
            </label>
          </div>
        );

      case 'hearing':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.hearing.visualAlerts}
                onChange={() => handleToggle('hearing', 'visualAlerts')}
              />
              <div className="preference-content">
                <span className="preference-icon">💡</span>
                <div>
                  <h3>Visual Alerts</h3>
                  <p>Visual notifications for audio cues</p>
                </div>
              </div>
            </label>
          </div>
        );

      case 'transport':
        return (
          <div className="preferences-grid">
            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.transport.publicTransport}
                onChange={() => handleToggle('transport', 'publicTransport')}
              />
              <div className="preference-content">
                <span className="preference-icon">🚇</span>
                <div>
                  <h3>Public Transport</h3>
                  <p>Prefer buses, trains, trams</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.transport.walking}
                onChange={() => handleToggle('transport', 'walking')}
              />
              <div className="preference-content">
                <span className="preference-icon">🚶</span>
                <div>
                  <h3>Walking</h3>
                  <p>Accessible walking routes</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.transport.wheelchair}
                onChange={() => handleToggle('transport', 'wheelchair')}
              />
              <div className="preference-content">
                <span className="preference-icon">♿</span>
                <div>
                  <h3>Wheelchair</h3>
                  <p>Wheelchair-accessible transit</p>
                </div>
              </div>
            </label>

            <label className="preference-card">
              <input
                type="checkbox"
                checked={preferences.transport.cycling}
                onChange={() => handleToggle('transport', 'cycling')}
              />
              <div className="preference-content">
                <span className="preference-icon">🚲</span>
                <div>
                  <h3>Cycling</h3>
                  <p>Bike-friendly accessible routes</p>
                </div>
              </div>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Customize Your Experience</h1>
          <p>{steps[currentStep].subtitle}</p>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-text" aria-live="polite">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        <div className="step-content">
          <h2>{steps[currentStep].title}</h2>
          {renderStepContent()}
        </div>

        <div className="onboarding-controls">
          <button
            onClick={handleSkip}
            className="btn-text"
            aria-label="Skip this step"
          >
            Remind me later
          </button>
          
          <button
            onClick={handleNext}
            className="btn-primary"
            aria-label={currentStep === steps.length - 1 ? "Continue to emergency setup" : "Next step"}
          >
            {currentStep === steps.length - 1 ? "Continue" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
