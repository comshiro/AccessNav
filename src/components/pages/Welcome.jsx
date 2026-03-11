import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Welcome to AccessNav",
      subtitle: "Navigate with confidence",
      description: "Making the world more accessible, one route at a time",
      icon: "♿"
    },
    {
      title: "Accessibility First",
      subtitle: "Built for everyone",
      description: "Designed specifically for people with disabilities to navigate local infrastructure with ease",
      icon: "🌍"
    },
    {
      title: "Tailored Pathfinding",
      subtitle: "Routes that work for you",
      description: "Avoid stairs, prefer ramps, choose accessible transit - routes customized to your needs",
      icon: "🗺️"
    },
    {
      title: "Community Reviews",
      subtitle: "Real experiences, real help",
      description: "Read and share accessibility information about parking, ramps, restrooms, and service attitudes",
      icon: "⭐"
    },
    {
      title: "Public Transport",
      subtitle: "Accessible transit information",
      description: "Find buses and trains with ramps, elevators, and accessible features",
      icon: "🚇"
    },
    {
      title: "Stay Safe",
      subtitle: "Real-time help when you need it",
      description: "Report obstacles, receive alerts, and access emergency SOS features",
      icon: "🆘"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/signin');
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigate('/signin');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-carousel">
        <div className="slide">
          <div className="slide-icon" aria-hidden="true">
            {slides[currentSlide].icon}
          </div>
          <h1>{slides[currentSlide].title}</h1>
          <h2>{slides[currentSlide].subtitle}</h2>
          <p>{slides[currentSlide].description}</p>
        </div>

        <div className="carousel-indicators" role="tablist" aria-label="Carousel navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentSlide}
              role="tab"
            />
          ))}
        </div>

        <div className="carousel-controls">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="btn-secondary"
            aria-label="Previous slide"
          >
            Previous
          </button>
          
          {currentSlide < slides.length - 1 && (
            <button
              onClick={handleSkip}
              className="btn-text"
              aria-label="Skip introduction"
            >
              Skip
            </button>
          )}
          
          <button
            onClick={handleNext}
            className="btn-primary"
            aria-label={currentSlide === slides.length - 1 ? "Get started" : "Next slide"}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
