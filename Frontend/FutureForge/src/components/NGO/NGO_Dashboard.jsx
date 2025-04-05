import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import './NGO_Dashboard.css';
import Logo from '../../assets/images/logo.jsx';
import LanguageSelector from '../common/LanguageSelector';

function NGO_Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.role !== 'ngo') {
        navigate('/ngo/login');
      } else {
        setUserData(user);
      }
      
      // Close sidebar on mobile when navigating
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate('/ngo/login');
    }
  }, [navigate, location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/user/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="dashboard-container">
      <button className="mobile-menu-button" onClick={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <Logo width="40px" height="40px" className="sidebar-logo" />
            <h2 className="sidebar-title">FutureForge</h2>
          </div>
        </div>
        
        <nav className="nav-links">
          <button 
            className={isActive('/ngo') || isActive('/ngo/dashboard') ? 'active' : ''} 
            onClick={() => navigate('/ngo')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0a1 1 0 00-1 1v7" />
            </svg>
            Dashboard
          </button>
          
          <button 
            className={isActive('/ngo/post-jobs') ? 'active' : ''} 
            onClick={() => navigate('/ngo/post-jobs')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Post Jobs
          </button>
          
          <button 
            className={isActive('/ngo/jobs') ? 'active' : ''} 
            onClick={() => navigate('/ngo/jobs')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Jobs
          </button>
          
          <button 
            className={isActive('/ngo/post-videos') ? 'active' : ''} 
            onClick={() => navigate('/ngo/post-videos')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Post Videos
          </button>
          
          <button 
            className={isActive('/ngo/manage-videos') ? 'active' : ''} 
            onClick={() => navigate('/ngo/manage-videos')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Manage Videos
          </button>
          
          <button className="logout-button" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </nav>
      </div>
      
      <div className="dashboard-main">
        <div className="main-header">
          <div className="welcome-message">
            Welcome, {userData.name || 'NGO'}
          </div>
          <div className="header-actions">
            <LanguageSelector />
          </div>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
}

export default NGO_Dashboard; 