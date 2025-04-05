import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './User_Dashboard.css';
import Logo from '../../assets/images/logo.jsx';
import LanguageSelector from '../common/LanguageSelector';
import { testUtils } from '../../utils/api';

function User_Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.role !== 'user') {
        navigate('/user/login');
      } else {
        setUserData(user);
      }
      
      // Close sidebar on mobile when navigating
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate('/user/login');
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

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const applyTestSkills = async () => {
    try {
      setDebugStatus('Applying test skills...');
      const userId = userData.user_id || userData.id;
      if (!userId) {
        setDebugStatus('Error: No user ID found');
        return;
      }
      
      // Get sample skills - now we'll make them unique based on user ID
      // This ensures different users get different skills for testing
      const allSampleSkills = testUtils.getSampleSkills();
      
      // Create a simple hash of the user ID to select different skills for different users
      const userHash = Array.from(userId).reduce(
        (hash, char) => ((hash << 5) + hash) + char.charCodeAt(0), 0
      );
      
      // Select a subset of skills for this user based on the hash
      // This ensures different users get different recommendations
      const userIndex = Math.abs(userHash) % 3; // 0, 1, or 2
      let userSkills;
      
      if (userIndex === 0) {
        // First user: programming and design
        userSkills = allSampleSkills.filter(skill => 
          ['programming', 'design'].includes(skill.skill_id)
        );
      } else if (userIndex === 1) {
        // Second user: marketing and data_analysis
        userSkills = allSampleSkills.filter(skill => 
          ['marketing', 'data_analysis'].includes(skill.skill_id)
        );
      } else {
        // Third user: web_dev and design
        userSkills = allSampleSkills.filter(skill => 
          ['web_dev', 'design'].includes(skill.skill_id)
        );
      }
      
      // Add a debug entry to show which skills this user will get
      setDebugStatus(`Applying ${userSkills.map(s => s.name).join(', ')} skills to user ${userId}...`);
      
      // Apply the user-specific skills
      await testUtils.seedUserSkills(userId, userSkills);
      
      setDebugStatus(`Test skills applied successfully! User ${userId} now has: ${userSkills.map(s => s.name).join(', ')}. Please refresh the page to see changes.`);
    } catch (error) {
      console.error('Error applying test skills:', error);
      setDebugStatus(`Error: ${error.message}`);
    }
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
            className={isActive('/user') || isActive('/user/dashboard') ? 'active' : ''} 
            onClick={() => navigate('/user')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0a1 1 0 00-1 1v7" />
            </svg>
            Dashboard
          </button>
          
          <button 
            className={isActive('/user/learning-path') ? 'active' : ''} 
            onClick={() => navigate('/user/learning-path')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learning Path
          </button>
          
          <button 
            className={isActive('/user/mock-interview') ? 'active' : ''} 
            onClick={() => navigate('/user/mock-interview')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Mock Interview
          </button>
          
          <button 
            className={isActive('/user/videos') ? 'active' : ''} 
            onClick={() => navigate('/user/videos')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Videos
          </button>
          
          <button 
            className={isActive('/user/jobs') ? 'active' : ''} 
            onClick={() => navigate('/user/jobs')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Jobs
          </button>
          
          <button 
            className={isActive('/user/applications') ? 'active' : ''} 
            onClick={() => navigate('/user/applications')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            My Applications
          </button>
          
          <button className="logout-button" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          
          {/* Debug button - double click to show */}
          <button className="debug-button" onDoubleClick={toggleDebug}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </nav>
      </div>
      
      <div className="dashboard-main">
        <div className="main-header">
          <div className="welcome-message">
            Welcome, {userData.name || 'User'}
          </div>
          <div className="header-actions">
            <LanguageSelector />
          </div>
        </div>
        
        {/* Debug Panel */}
        {showDebug && (
          <div className="debug-panel">
            <h3>Debug Tools</h3>
            <div className="debug-actions">
              <button onClick={applyTestSkills} className="debug-action-button">
                Apply Sample Skills to User
              </button>
              <button 
                onClick={async () => {
                  try {
                    setDebugStatus('Assigning test skills to videos...');
                    await testUtils.assignTestSkillsToVideos();
                    setDebugStatus('Successfully assigned test skills to videos! Please refresh the page to see changes.');
                  } catch (error) {
                    console.error('Error assigning test skills:', error);
                    setDebugStatus(`Error: ${error.message}`);
                  }
                }} 
                className="debug-action-button"
              >
                Assign Test Skills to Videos
              </button>
              {debugStatus && <div className="debug-status">{debugStatus}</div>}
            </div>
          </div>
        )}
        
        <Outlet />
      </div>
    </div>
  );
}

export default User_Dashboard; 