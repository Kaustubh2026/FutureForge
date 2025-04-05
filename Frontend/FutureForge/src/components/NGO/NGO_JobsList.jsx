import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../utils/api';
import './NGO_JobsList.css';

const NGO_JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    location: '',
    skill: '',
    level: ''
  });
  const [deleting, setDeleting] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [viewingApplicants, setViewingApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingApplication, setUpdatingApplication] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getNGOJobs();
      setJobs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job.job_id);
    setEditData({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      skill: job.skill || '',
      level: job.level || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (jobId) => {
    try {
      // Get NGO ID from localStorage
      let ngoId;
      try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        ngoId = userObj?.id || userObj?.ngo_id;
      } catch (e) {
        ngoId = localStorage.getItem('ngo_id');
      }

      if (!ngoId) {
        setErrorMessage('Authentication required. Please log in again.');
        return;
      }

      const API_URL = 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/job/${jobId}?ngo_id=${ngoId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        // Update the job in the local state
        setJobs(jobs.map(job => 
          job.job_id === jobId ? { ...job, ...editData } : job
        ));
        setEditingJob(null);
        setSuccessMessage('Job updated successfully!');
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to update job: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setErrorMessage('Failed to update job. Please try again.');
    }
  };

  const handleDelete = async (jobId) => {
    try {
      setDeleting(jobId);
      
      // Get NGO ID from localStorage
      let ngoId;
      try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        ngoId = userObj?.id || userObj?.ngo_id;
      } catch (e) {
        ngoId = localStorage.getItem('ngo_id');
      }

      if (!ngoId) {
        setErrorMessage('Authentication required. Please log in again.');
        return;
      }

      const API_URL = 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/job/${jobId}?ngo_id=${ngoId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        // Remove the job from the local state
        setJobs(jobs.filter(job => job.job_id !== jobId));
        setSuccessMessage('Job deleted successfully!');
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to delete job: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setErrorMessage('Failed to delete job. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewApplicants = async (jobId) => {
    try {
      setLoadingApplicants(true);
      setViewingApplicants(jobId);
      
      const response = await jobAPI.getJobApplicants(jobId);
      
      if (response.data) {
        setApplicants(response.data);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setErrorMessage('Failed to load applicants. Please try again.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const closeApplicantsModal = () => {
    setViewingApplicants(null);
    setApplicants([]);
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      setUpdatingApplication(applicationId);
      
      const response = await jobAPI.updateApplicationStatus(applicationId, {
        status: status
      });
      
      if (response.data) {
        // Update the applicant status in the local state
        setApplicants(applicants.map(app => 
          app.application_id === applicationId 
            ? { ...app, status: status } 
            : app
        ));
        
        setSuccessMessage(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
      } else {
        setErrorMessage('Failed to update application status.');
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setErrorMessage(`Failed to update application: ${err.message}`);
    } finally {
      setUpdatingApplication(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="jobs-management">
      <div className="jobs-header">
        <h2>Manage Jobs</h2>
        <button 
          onClick={() => window.location.href = '/ngo/post-jobs'} 
          className="post-job-button"
        >
          Post New Job
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="close-button">×</button>
        </div>
      )}
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} className="close-button">×</button>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="no-jobs">
          <p>You haven't posted any jobs yet.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map((job) => (
            <div key={job.job_id} className="job-card">
              {editingJob === job.job_id ? (
                <div className="job-edit-form">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editData.title}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={editData.location}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Skill</label>
                      <select
                        name="skill"
                        value={editData.skill}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Skill</option>
                        <option value="programming">Programming</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select
                        name="level"
                        value={editData.level}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button 
                      className="save-button"
                      onClick={() => handleUpdate(job.job_id)}
                    >
                      Save Changes
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={() => setEditingJob(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{job.title}</h3>
                  <p className="description">{job.description}</p>
                  <div className="job-details">
                    <span className="location">{job.location}</span>
                    {job.skill && <span className="skill">{job.skill}</span>}
                    {job.level && <span className="level">{job.level}</span>}
                    <span className="date">Posted on: {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="job-actions">
                    <button 
                      className="view-applicants-button"
                      onClick={() => handleViewApplicants(job.job_id)}
                    >
                      View Applicants
                    </button>
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(job)}
                    >
                      Edit
                    </button>
                    <button 
                      className={`delete-button ${deleting === job.job_id ? 'deleting' : ''}`}
                      onClick={() => handleDelete(job.job_id)}
                      disabled={deleting === job.job_id}
                    >
                      {deleting === job.job_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingApplicants && (
        <div className="applicants-modal-overlay">
          <div className="applicants-modal">
            <div className="modal-header">
              <h3>Applicants for {jobs.find(j => j.job_id === viewingApplicants)?.title}</h3>
              <button className="close-modal-button" onClick={closeApplicantsModal}>×</button>
            </div>
            
            <div className="modal-content">
              {loadingApplicants ? (
                <div className="loading">Loading applicants...</div>
              ) : applicants.length === 0 ? (
                <div className="no-applicants">No applications yet for this job.</div>
              ) : (
                <div className="applicants-list">
                  {applicants.map((applicant) => (
                    <div key={applicant.application_id} className="applicant-card">
                      <div className="applicant-header">
                        <h4>Application ID: {applicant.application_id.substring(0, 8)}...</h4>
                        <span className={`status status-${applicant.status.toLowerCase()}`}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="applicant-details">
                        <div className="detail-item">
                          <span className="label">User ID:</span>
                          <span className="value">{applicant.user_id}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Applied on:</span>
                          <span className="value">{new Date(applicant.application_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="applicant-actions">
                        <button 
                          className="status-button accept-button"
                          onClick={() => handleUpdateApplicationStatus(applicant.application_id, 'accepted')}
                          disabled={applicant.status === 'accepted' || updatingApplication === applicant.application_id}
                        >
                          {updatingApplication === applicant.application_id ? 'Updating...' : 'Accept'}
                        </button>
                        <button 
                          className="status-button reject-button"
                          onClick={() => handleUpdateApplicationStatus(applicant.application_id, 'rejected')}
                          disabled={applicant.status === 'rejected' || updatingApplication === applicant.application_id}
                        >
                          {updatingApplication === applicant.application_id ? 'Updating...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGO_JobsList; 