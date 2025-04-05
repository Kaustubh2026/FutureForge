import React, { useState } from 'react';
import './NGO_PostJobs.css';
import { jobAPI } from '../../utils/api';

const NGO_PostJobs = () => {
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    requirements: [],
    location: '',
    pdfFile: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setJobData((prev) => ({
      ...prev,
      pdfFile: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', jobData.title);
      formData.append('description', jobData.description);
      formData.append('location', jobData.location);
      
      // Add NGO ID from localStorage
      const ngoId = localStorage.getItem('ngo_id');
      console.log('NGO ID from localStorage:', ngoId);
      
      if (ngoId) {
        formData.append('ngo_id', ngoId);
      } else {
        console.error('No NGO ID found in localStorage');
        alert('Authentication error: Please log in again');
        return;
      }
      
      // Add skills_required field which is expected by the backend
      formData.append('skills_required', JSON.stringify(jobData.requirements || []));
      
      if (jobData.pdfFile) {
        formData.append('pdf', jobData.pdfFile);
      }

      console.log('Submitting job with data:', Object.fromEntries(formData));

      // Using direct fetch call with credentials
      const response = await fetch('http://localhost:5000/api/ngo/post-job', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const responseData = await response.text();
      console.log('Response:', response.status, responseData);
      
      if (response.ok) {
        alert('Job posted successfully!');
        setJobData({
          title: '',
          description: '',
          requirements: [],
          location: '',
          pdfFile: null,
        });
      } else {
        console.error('Server error:', responseData);
        alert(`Failed to post job: ${responseData || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error posting job:', error);
      alert('An error occurred while posting the job. Please try again.');
    }
  };

  return (
    <div className="post-jobs-container">
      <h2>Post a New Job</h2>
      <form onSubmit={handleSubmit} className="post-jobs-form">
        <div className="form-group">
          <label>Job Title:</label>
          <input
            type="text"
            name="title"
            value={jobData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={jobData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Location:</label>
          <input
            type="text"
            name="location"
            value={jobData.location}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Job PDF:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
        </div>
        <button type="submit">Post Job</button>
      </form>
    </div>
  );
};

export default NGO_PostJobs; 