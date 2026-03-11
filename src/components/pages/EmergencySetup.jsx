import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveEmergencyInfo } from '../../services/userService';
import './EmergencySetup.css';

export default function EmergencySetup() {
  const [setupType, setSetupType] = useState('authorities'); // 'authorities' or 'contacts'
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: ''
  });
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relationship: '',
    customMessage: ''
  });

  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSkip = () => {
    navigate('/');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    
    try {
      await saveEmergencyInfo({ medicalInfo, emergencyContact });
      navigate('/');
    } catch (err) {
      setError('Failed to save emergency information. Please try again.');
      console.error('Error saving emergency info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="emergency-container">
      <div className="emergency-card">
        <div className="emergency-header">
          <h1>Emergency Setup</h1>
          <p>Set up emergency information for your safety</p>
        </div>

        {error && (
          <div className="error-message" role="alert" style={{margin: '1rem', padding: '0.75rem', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00'}}>
            {error}
          </div>
        )}

        <div className="setup-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={setupType === 'authorities'}
            aria-controls="authorities-panel"
            className={`tab-btn ${setupType === 'authorities' ? 'active' : ''}`}
            onClick={() => setSetupType('authorities')}
          >
            🚨 Alert Authorities
          </button>
          <button
            role="tab"
            aria-selected={setupType === 'contacts'}
            aria-controls="contacts-panel"
            className={`tab-btn ${setupType === 'contacts' ? 'active' : ''}`}
            onClick={() => setSetupType('contacts')}
          >
            📞 Emergency Contact
          </button>
        </div>

        <div className="tab-content">
          {setupType === 'authorities' && (
            <div id="authorities-panel" role="tabpanel" className="panel">
              <div className="panel-intro">
                <p>This information will be shared with emergency services when you use the SOS feature</p>
              </div>

              <div className="form-group">
                <label htmlFor="blood-type">Blood Type</label>
                <select
                  id="blood-type"
                  value={medicalInfo.bloodType}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, bloodType: e.target.value })}
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="allergies">Allergies</label>
                <textarea
                  id="allergies"
                  placeholder="List any allergies (e.g., penicillin, peanuts)"
                  value={medicalInfo.allergies}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="medications">Current Medications</label>
                <textarea
                  id="medications"
                  placeholder="List medications you're taking"
                  value={medicalInfo.medications}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, medications: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="conditions">Medical Conditions</label>
                <textarea
                  id="conditions"
                  placeholder="Any relevant medical conditions"
                  value={medicalInfo.conditions}
                  onChange={(e) => setMedicalInfo({ ...medicalInfo, conditions: e.target.value })}
                  rows="3"
                />
              </div>
            </div>
          )}

          {setupType === 'contacts' && (
            <div id="contacts-panel" role="tabpanel" className="panel">
              <div className="panel-intro">
                <p>This person will be notified with your live location in case of emergency</p>
              </div>

              <div className="form-group">
                <label htmlFor="contact-name">Name *</label>
                <input
                  type="text"
                  id="contact-name"
                  placeholder="Emergency contact name"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="contact-phone"
                  placeholder="+1 (555) 123-4567"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="relationship">Relationship</label>
                <select
                  id="relationship"
                  value={emergencyContact.relationship}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="custom-message">Custom Message (Optional)</label>
                <textarea
                  id="custom-message"
                  placeholder="Default: 'I need help. Here is my location.'"
                  value={emergencyContact.customMessage}
                  onChange={(e) => setEmergencyContact({ ...emergencyContact, customMessage: e.target.value })}
                  rows="3"
                />
                <small>Leave blank to use default message</small>
              </div>
            </div>
          )}
        </div>

        <div className="info-box">
          <span className="info-icon">ℹ️</span>
          <p>This information is stored securely and only shared when you activate emergency features</p>
        </div>

        <div className="emergency-controls">
          <button
            onClick={handleSkip}
            className="btn-text"
            aria-label="Skip emergency setup"
          >
            Skip for now
          </button>
          
          <button
            onClick={handleSave}
            className="btn-primary"
            aria-label="Save emergency information and continue"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
