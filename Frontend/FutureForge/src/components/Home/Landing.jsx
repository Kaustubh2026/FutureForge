import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo.jsx';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-container">
          <Logo width="180px" height="auto" />
        </div>
        <div className="header-actions">
          <Link to="/user/login" className="login-button">Log In</Link>
          <Link to="/user/register" className="register-button">Register</Link>
        </div>
      </header>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1>Empowering Futures Through Skills Development</h1>
            <p className="hero-description">
              Connect with NGOs, access personalized learning paths, and build your career with FutureForge.
            </p>
            <div className="hero-buttons">
              <Link to="/user/login?type=user" className="hero-button user-button">
                <span>Individual User</span>
                <p>Access learning paths and job opportunities</p>
              </Link>
              <Link to="/user/login?type=ngo" className="hero-button ngo-button">
                <span>NGO / Organization</span>
                <p>Post jobs and educational content</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2>Why Choose FutureForge?</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Personalized Learning</h3>
              <p>Access AI-generated learning roadmaps tailored to your goals and skills</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Job Opportunities</h3>
              <p>Connect with NGOs offering real-world projects and employment</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Interview Preparation</h3>
              <p>Practice with our AI-powered mock interview system</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Educational Videos</h3>
              <p>Access a library of curated educational content</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to forge your future?</h2>
          <p>Join thousands of users and organizations building skills and opportunities together.</p>
          <div className="cta-buttons">
            <Link to="/user/register" className="cta-button register-cta">Create Account</Link>
            <Link to="/user/login" className="cta-button login-cta">Log In</Link>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Logo width="150px" height="auto" />
            <p>Building bridges between talent and opportunity</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/how-it-works">How It Works</Link></li>
                <li><Link to="/partners">Our Partners</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/success-stories">Success Stories</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} FutureForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 