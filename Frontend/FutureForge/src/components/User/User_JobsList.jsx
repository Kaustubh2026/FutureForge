import React, { useState, useEffect, useCallback } from 'react';
import { jobAPI } from '../../utils/api';
import './User_JobsList.css';

const User_JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [userLocation, setUserLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skill: '',
    level: '',
    search: ''
  });
  const [applying, setApplying] = useState(null);
  const [applicationSuccess, setApplicationSuccess] = useState(null);
  const [applicationError, setApplicationError] = useState(null);

  // Create a fetchJobs function that can be reused
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user dashboard data to get skills and location preferences
      const dashboardResponse = await fetch('http://localhost:5000/api/user/dashboard', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const dashboardData = await dashboardResponse.json();
      setUserSkills(dashboardData.skills || []);
      setUserLocation(dashboardData.location || '');
      
      // Get user skills IDs
      const userSkillIds = (dashboardData.skills || []).map(skill => skill.skill_id);
      
      // Fetch all jobs
      const response = await jobAPI.getAllJobs();
      const allJobs = response.data;
      
      // Find jobs that match user skills and location preferences
      const matchedJobs = allJobs.filter(job => {
        // Check if any of the job's required skills match user skills
        const jobSkills = job.required_skills || [];
        const skillMatch = userSkillIds.length > 0 && 
          jobSkills.some(skillId => userSkillIds.includes(skillId));
        
        // Check if job is in user's preferred location (if user has a location preference)
        const locationMatch = !userLocation || job.location === userLocation;
        
        return skillMatch && locationMatch;
      });
      
      setRecommendedJobs(matchedJobs);
      setJobs(allJobs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs. Please try again later.');
      setLoading(false);
    }
  }, [userLocation]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApply = async (jobId) => {
    try {
      setApplying(jobId);
      setApplicationError(null);
      setApplicationSuccess(null);
      
      const applicationData = {
        job_id: jobId,
        application_date: new Date().toISOString()
      };
      
      // Define API URL - you should replace this with your actual API endpoint
      const API_URL = 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/job/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.text();
      console.log('Response text:', data);
      
      let parsedData;
      try {
        parsedData = data ? JSON.parse(data) : {};
        console.log('Parsed response data:', parsedData);
      } catch (e) {
        console.error('Error parsing response:', e);
        parsedData = { message: data || 'Unknown response' };
      }
      
      if (response.ok) {
        setApplicationSuccess(`Successfully applied for ${jobs.find(job => job.job_id === jobId)?.title}`);
      } else {
        setApplicationError(`Failed to apply: ${parsedData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Application error:', err);
      setApplicationError('Failed to submit application. Please try again.');
    } finally {
      setApplying(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSkill = !filters.skill || job.skill === filters.skill;
    const matchesLevel = !filters.level || job.level === filters.level;
    const matchesSearch = !filters.search || 
      job.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.description?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSkill && matchesLevel && matchesSearch;
  });

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="jobs-list">
      <h2>Available Jobs</h2>
      
      {applicationSuccess && (
        <div className="success-message">
          {applicationSuccess}
          <button onClick={() => setApplicationSuccess(null)} className="close-button">×</button>
        </div>
      )}
      
      {applicationError && (
        <div className="error-message">
          {applicationError}
          <button onClick={() => setApplicationError(null)} className="close-button">×</button>
        </div>
      )}
      
      {userSkills.length > 0 && recommendedJobs.length > 0 && (
        <div className="recommended-jobs-section">
          <h3>Recommended for Your Skills</h3>
          <div className="skill-tags">
            {userSkills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill.name || `Skill ${index + 1}`}</span>
            ))}
          </div>
          <div className="jobs-grid">
            {recommendedJobs.map((job) => (
              <div key={job.job_id} className="job-card recommended">
                <h3>{job.title}</h3>
                <p className="description">{job.description}</p>
                <div className="job-details">
                  <span className="skill">{job.skill}</span>
                  <span className="level">{job.level}</span>
                  <span className="location">{job.location}</span>
                  <span className="ngo">{job.ngo_name}</span>
                </div>
                <button 
                  className={`apply-button ${applying === job.job_id ? 'applying' : ''}`}
                  onClick={() => handleApply(job.job_id)}
                  disabled={applying === job.job_id}
                >
                  {applying === job.job_id ? 'Applying...' : 'Apply Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={handleFilterChange}
          className="search-input"
        />
        <select
          name="skill"
          value={filters.skill}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Skills</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="marketing">Marketing</option>
        </select>
        <select
          name="level"
          value={filters.level}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      
      <h3>All Jobs</h3>
      
      {filteredJobs.length === 0 ? (
        <div className="no-jobs">No jobs found matching your criteria.</div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job.job_id} className="job-card">
              <h3>{job.title}</h3>
              <p className="description">{job.description}</p>
              <div className="job-details">
                <span className="skill">{job.skill}</span>
                <span className="level">{job.level}</span>
                <span className="location">{job.location}</span>
                <span className="ngo">{job.ngo_name}</span>
              </div>
              <button 
                className={`apply-button ${applying === job.job_id ? 'applying' : ''}`}
                onClick={() => handleApply(job.job_id)}
                disabled={applying === job.job_id}
              >
                {applying === job.job_id ? 'Applying...' : 'Apply Now'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default User_JobsList; 