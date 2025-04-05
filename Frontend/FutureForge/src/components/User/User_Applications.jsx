import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../utils/api';
import './User_Applications.css';

const User_Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getUserApplications();
      setApplications(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load your applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        // Get user ID from localStorage
        let userId;
        try {
          const userObj = JSON.parse(localStorage.getItem('user'));
          userId = userObj?.id || userObj?.user_id;
        } catch (e) {
          userId = localStorage.getItem('user_id');
        }

        if (!userId) {
          setError('Authentication required. Please log in again.');
          return;
        }

        await jobAPI.withdrawApplication(applicationId, { user_id: userId });
        
        // Update the applications list
        setApplications(applications.filter(app => app.application_id !== applicationId));
      } catch (err) {
        console.error('Error withdrawing application:', err);
        setError('Failed to withdraw application. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusDetails = (status) => {
    switch(status.toLowerCase()) {
      case 'accepted':
        return {
          className: 'status-accepted',
          text: 'Accepted',
          icon: '✓',
          description: 'Congratulations! Your application has been accepted.'
        };
      case 'rejected':
        return {
          className: 'status-rejected',
          text: 'Rejected',
          icon: '✗',
          description: 'We regret to inform you that your application was not selected at this time.'
        };
      case 'pending':
      default:
        return {
          className: 'status-pending',
          text: 'Pending',
          icon: '⟳',
          description: 'Your application is being reviewed.'
        };
    }
  };

  if (loading) {
    return <div className="loading">Loading your applications...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="applications-container">
      <h2>Your Job Applications</h2>
      
      <button onClick={fetchApplications} className="refresh-button">
        Refresh List
      </button>
      
      {applications.length === 0 ? (
        <div className="no-applications">
          <p>You haven't applied to any jobs yet.</p>
          <a href="/user/jobs" className="browse-jobs-button">Browse Jobs</a>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((application) => {
            const statusDetails = getStatusDetails(application.status);
            
            return (
              <div 
                key={application.application_id} 
                className={`application-card ${statusDetails.className}`}
              >
                <div className="application-header">
                  <h3>{application.job_title}</h3>
                  <div className={`status-indicator ${statusDetails.className}`}>
                    <span className="status-icon">{statusDetails.icon}</span>
                    {statusDetails.text}
                  </div>
                </div>
                
                <div className="application-details">
                  <div className="detail-row">
                    <span className="detail-label">Applied on:</span>
                    <span className="detail-value">{formatDate(application.application_date)}</span>
                  </div>
                  
                  {application.response_date && (
                    <div className="detail-row">
                      <span className="detail-label">Response received:</span>
                      <span className="detail-value">{formatDate(application.response_date)}</span>
                    </div>
                  )}
                  
                  <div className="status-message">
                    {application.feedback ? (
                      <p className="feedback-message">{application.feedback}</p>
                    ) : (
                      <p>{statusDetails.description}</p>
                    )}
                  </div>
                </div>
                
                {application.status.toLowerCase() === 'pending' && (
                  <div className="application-actions">
                    <button 
                      onClick={() => handleWithdraw(application.application_id)}
                      className="withdraw-button"
                    >
                      Withdraw Application
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default User_Applications; 