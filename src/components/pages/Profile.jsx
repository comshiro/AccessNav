export default function Profile() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Profile</h1>
        <p>Manage your accessibility preferences</p>
      </header>
      
      <div className="profile-content">
        <section className="profile-section">
          <h2>Accessibility Preferences</h2>
          <p>Set your preferences to get personalized routes:</p>
          <ul>
            <li>Avoid stairs</li>
            <li>Prefer public transport</li>
            <li>Wide pathways required</li>
            <li>Rest stops needed</li>
          </ul>
        </section>
        
        <section className="profile-section">
          <h2>Your Reviews</h2>
          <p>Help the community by sharing your accessibility experiences</p>
        </section>
      </div>
    </div>
  );
}
