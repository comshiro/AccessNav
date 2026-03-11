export default function Home() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Welcome to AccessNav</h1>
        <p>Navigate with confidence. Find accessible routes tailored to your needs.</p>
      </header>
      
      <section className="features-grid">
        <div className="feature-card">
          <h2>Personalized Routes</h2>
          <p>Routes that respect your accessibility needs - avoid stairs, prefer transit, and more.</p>
        </div>
        
        <div className="feature-card">
          <h2>Community Reviews</h2>
          <p>Real experiences from people like you about parking, ramps, restrooms, and service.</p>
        </div>
        
        <div className="feature-card">
          <h2>Turn-by-Turn Guidance</h2>
          <p>Audio directions and visual guidance to help you navigate safely.</p>
        </div>
      </section>
    </div>
  );
}
