import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NGO_Dashboard from './components/NGO/NGO_Dashboard';
import NGO_PostJobs from './components/NGO/NGO_PostJobs';
import NGO_PostVideos from './components/NGO/NGO_PostVideos';
import NGO_JobsList from './components/NGO/NGO_JobsList';
import NGO_VideosList from './components/NGO/NGO_VideosList';
import User_Login from './components/User/User_Login';
import User_Dashboard from './components/User/User_Dashboard';
import User_LearningPathGenerator from './components/User/User_LearningPathGenerator';
import User_RoadmapOutput from './components/User/User_RoadmapOutput';
import User_JobsList from './components/User/User_JobsList';
import User_VideosList from './components/User/User_VideosList';
import User_Interview from './components/User/User_Interview';
import User_Applications from './components/User/User_Applications';
import Landing from './components/Home/Landing';
import './App.css';
import { useState, useEffect } from 'react';
import { userAPI, videoAPI, jobAPI } from './utils/api';
import Chatbot from './components/common/Chatbot';

// Dashboard Home component for User
const UserDashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({});
  const [userSkills, setUserSkills] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user dashboard data using the API service
        const dashboardResponse = await userAPI.getDashboard();
        const data = dashboardResponse.data;
        
        setUserData(data);
        setUserSkills(data.skills || []);
        
        // Get user skills IDs
        const userSkillIds = (data.skills || []).map(skill => skill.skill_id);
        const userLocation = data.location || '';
        
        // Fetch personalized video recommendations
        try {
          const recommendationsResponse = await userAPI.getRecommendedVideos();
          const recommendationsData = recommendationsResponse.data;
          
          console.log('Video recommendations:', recommendationsData);
          
          // Set the recommended videos from the API response
          setRecommendedVideos(recommendationsData.recommended_videos.slice(0, 3));
        } catch (videoError) {
          console.error('Error fetching video recommendations:', videoError);
          setRecommendedVideos([]);
        }
        
        // Fetch jobs and filter for recommendations
        try {
          const jobsResponse = await jobAPI.getAllJobs();
          const jobsData = jobsResponse.data;
          
          // Filter jobs based on user skills and location
          const matchedJobs = jobsData.filter(job => {
            // Check if any of the job's required skills match user skills
            const jobSkills = job.required_skills || [];
            const skillMatch = userSkillIds.length > 0 && 
              jobSkills.some(skillId => userSkillIds.includes(skillId));
            
            // Check if job is in user's preferred location (if user has a location preference)
            const locationMatch = !userLocation || job.location === userLocation;
            
            return skillMatch && locationMatch;
          });
          
          // Limit to 3 recommended jobs
          setRecommendedJobs(matchedJobs.slice(0, 3));
        } catch (jobError) {
          console.error('Error fetching jobs:', jobError);
          setRecommendedJobs([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your dashboard. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="loading-indicator">Loading your personalized recommendations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-home">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <h2>Welcome to Your Dashboard</h2>
      
      {userSkills.length > 0 ? (
        <div className="user-skills-section">
          <h3>Your Skills</h3>
          <div className="skills-tags">
            {userSkills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill.name || `Skill ${index + 1}`}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-skills-message">
          <p>You haven't added any skills yet. Add skills to get personalized recommendations!</p>
        </div>
      )}
      
      <div className="recommendations-section">
        <h3>Recommended for You</h3>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Your Learning Progress</h3>
            <p>Continue where you left off on your learning path</p>
            <button onClick={() => window.location.href = '/user/learning-path'} className="dashboard-card-button">
              Go to Learning Path
            </button>
          </div>
          
          <div className="dashboard-card">
            <h3>Recommended Videos</h3>
            {recommendedVideos.length > 0 ? (
              <div className="recommendations-list">
                {recommendedVideos.map((video, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-title">{video.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>We'll recommend videos based on your skills</p>
            )}
            <button onClick={() => window.location.href = '/user/videos'} className="dashboard-card-button">
              Browse Videos
            </button>
          </div>
          
          <div className="dashboard-card">
            <h3>Matching Job Opportunities</h3>
            {recommendedJobs.length > 0 ? (
              <div className="recommendations-list">
                {recommendedJobs.map((job, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-title">{job.title}</span>
                    <span className="recommendation-location">{job.location}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>We'll recommend jobs that match your skills and location</p>
            )}
            <button onClick={() => window.location.href = '/user/jobs'} className="dashboard-card-button">
              View Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Home component for NGO with analytics
const NGODashboardHome = () => {
  // Hardcoded metrics for demonstration
  const metrics = {
    totalVideos: 24,
    totalJobs: 15,
    totalApplications: 128,
    totalUsers: 346,
    videoViewsThisWeek: 432,
    jobApplicationsThisWeek: 37,
    completionRate: 68,
    popularSkills: [
      { name: 'Web Development', count: 145 },
      { name: 'Data Analysis', count: 92 },
      { name: 'UX Design', count: 78 },
      { name: 'Digital Marketing', count: 54 }
    ],
    monthlyStats: [
      { month: 'Jan', videos: 2, jobs: 1, applications: 8 },
      { month: 'Feb', videos: 3, jobs: 2, applications: 12 },
      { month: 'Mar', videos: 4, jobs: 2, applications: 15 },
      { month: 'Apr', videos: 3, jobs: 3, applications: 18 },
      { month: 'May', videos: 5, jobs: 2, applications: 22 },
      { month: 'Jun', videos: 7, jobs: 5, applications: 53 }
    ]
  };

  return (
    <div className="ngo-dashboard-home">
      <h2>NGO Analytics Dashboard</h2>
      
      {/* Key metrics row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon video-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>{metrics.totalVideos}</h3>
            <p>Total Videos</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon job-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>{metrics.totalJobs}</h3>
            <p>Jobs Posted</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon application-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>{metrics.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon user-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>{metrics.totalUsers}</h3>
            <p>Registered Users</p>
          </div>
        </div>
      </div>
      
      {/* Charts section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Monthly Activity</h3>
          <div className="bar-chart">
            {metrics.monthlyStats.map((month, index) => (
              <div key={index} className="month-group">
                <div className="bar-group">
                  <div className="bar video-bar" style={{ height: `${month.videos * 20}px` }}></div>
                  <div className="bar job-bar" style={{ height: `${month.jobs * 20}px` }}></div>
                  <div className="bar application-bar" style={{ height: `${month.applications * 2}px` }}></div>
                </div>
                <div className="month-label">{month.month}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color video-color"></div>
              <span>Videos</span>
            </div>
            <div className="legend-item">
              <div className="legend-color job-color"></div>
              <span>Jobs</span>
            </div>
            <div className="legend-item">
              <div className="legend-color application-color"></div>
              <span>Applications</span>
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Popular Skills</h3>
          <div className="skills-chart">
            {metrics.popularSkills.map((skill, index) => (
              <div key={index} className="skill-bar-container">
                <div className="skill-name">{skill.name}</div>
                <div className="skill-bar-wrapper">
                  <div className="skill-bar" style={{ width: `${(skill.count / 150) * 100}%` }}></div>
                  <span className="skill-count">{skill.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="quick-actions">
        <button onClick={() => window.location.href = '/ngo/post-jobs'} className="action-button post-job">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Post New Job
        </button>
        <button onClick={() => window.location.href = '/ngo/jobs'} className="action-button view-jobs">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Posted Jobs
        </button>
        <button onClick={() => window.location.href = '/ngo/post-videos'} className="action-button post-video">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Upload New Video
        </button>
        <button onClick={() => window.location.href = '/ngo/manage-videos'} className="action-button manage-content">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Manage Content
        </button>
      </div>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children, userType }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user || user.role !== userType) {
    return <Navigate to="/user/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* NGO Routes */}
        <Route path="/ngo/login" element={<Navigate to="/user/login" replace />} />
        
        {/* NGO Dashboard */}
        <Route path="/ngo" element={
          <ProtectedRoute userType="ngo">
            <NGO_Dashboard />
          </ProtectedRoute>
        }>
          <Route index element={<NGODashboardHome />} />
          <Route path="dashboard" element={<NGODashboardHome />} />
          <Route path="post-jobs" element={<NGO_PostJobs />} />
          <Route path="jobs" element={<NGO_JobsList />} />
          <Route path="post-videos" element={<NGO_PostVideos />} />
          <Route path="manage-videos" element={<NGO_VideosList />} />
        </Route>

        {/* User Routes */}
        <Route path="/user/login" element={<User_Login />} />
        
        {/* User Dashboard */}
        <Route path="/user" element={
          <ProtectedRoute userType="user">
            <User_Dashboard />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboardHome />} />
          <Route path="dashboard" element={<UserDashboardHome />} />
          <Route path="learning-path" element={<User_LearningPathGenerator />} />
          <Route path="mock-interview" element={<User_Interview />} />
          <Route path="videos" element={<User_VideosList />} />
          <Route path="jobs" element={<User_JobsList />} />
          <Route path="applications" element={<User_Applications />} />
        </Route>

        {/* Backward compatibility routes */}
        <Route path="/user/dashboard/*" element={<Navigate to="/user" replace />} />
        <Route path="/ngo/dashboard/*" element={<Navigate to="/ngo" replace />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;