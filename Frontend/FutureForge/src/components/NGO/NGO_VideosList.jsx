import React, { useState, useEffect, useCallback } from 'react';
import { videoAPI } from '../../utils/api';
import './NGO_VideosList.css';

const NGO_VideosList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    skill: '',
    level: '',
    duration: '',
    thumbnail_url: '',
    skills_covered: []
  });
  const [viewingViewers, setViewingViewers] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [viewersError, setViewersError] = useState(null);

  // Function to generate thumbnail URLs for videos
  const getVideoThumbnail = (videoTitle) => {
    // Array of direct stable educational image URLs from Pixabay (no script issues)
    const thumbnailImages = [
      'https://cdn.pixabay.com/photo/2018/03/22/10/55/training-course-3250007_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/01/09/11/08/startup-594090_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849822_1280.jpg',
      'https://cdn.pixabay.com/photo/2014/05/02/21/49/laptop-336373_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/01/08/18/24/programming-593312_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/05/28/14/53/ux-788002_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_1280.jpg',
      'https://cdn.pixabay.com/photo/2016/11/29/06/18/home-office-1867761_1280.jpg',
      'https://cdn.pixabay.com/photo/2017/07/31/11/31/laptop-2557571_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/09/05/20/02/coding-924920_1280.jpg',
      'https://cdn.pixabay.com/photo/2015/01/21/14/14/apple-606761_1280.jpg',
      'https://cdn.pixabay.com/photo/2020/02/08/14/36/book-4830332_1280.jpg'
    ];
    
    // Use the videoTitle to consistently select the same image for the same title
    let imageIndex = 0;
    if (videoTitle) {
      // Create a simple hash from the title
      const titleHash = Array.from(videoTitle).reduce(
        (hash, char) => ((hash << 5) + hash) + char.charCodeAt(0), 0
      );
      imageIndex = Math.abs(titleHash) % thumbnailImages.length;
    } else {
      // If no title, use a default image
      imageIndex = 0;
    }
    
    // Return a direct image URL
    return thumbnailImages[imageIndex];
  };

  const fetchVideos = useCallback(async () => {
    try {
      console.log('Fetching videos...');
      setLoading(true);
      
      // Add NGO ID from localStorage
      let ngoId;
      try {
        // Try to get from user object first (preferred format from login)
        const userObj = JSON.parse(localStorage.getItem('user'));
        ngoId = userObj?.ngo_id || userObj?.id;
      } catch (e) {
        // Fallback to direct ngo_id key
        ngoId = localStorage.getItem('ngo_id');
      }
      
      console.log('NGO ID from localStorage:', ngoId);
      
      if (!ngoId) {
        console.error('No NGO ID found in localStorage');
        setError('Authentication error: Please log in again');
        setLoading(false);
        return;
      }
      
      // Use direct fetch with ngoId as query parameter
      const response = await fetch(`http://localhost:5000/api/ngo/videos?ngo_id=${ngoId}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Videos data:', data);
      
      // Add thumbnail URLs to videos that don't have them
      const videosWithThumbnails = data.map(video => {
        if (!video.thumbnail_url) {
          return { ...video, thumbnail_url: getVideoThumbnail(video.title || 'educational video') };
        }
        return video;
      });
      
      setVideos(videosWithThumbnails);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to fetch videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleEdit = (video) => {
    console.log('Editing video:', video);
    setEditingVideo(video);
    setEditForm({
      title: video.title || '',
      description: video.description || '',
      skill: video.skill || '',
      level: video.level || '',
      duration: video.duration || '',
      thumbnail_url: video.thumbnail_url || getVideoThumbnail(video.title || 'educational video'),
      skills_covered: video.skills_covered || []
    });
  };

  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        console.log('Deleting video:', videoId);
        
        // Add NGO ID from localStorage
        let ngoId;
        try {
          const userObj = JSON.parse(localStorage.getItem('user'));
          ngoId = userObj?.ngo_id || userObj?.id;
        } catch (e) {
          ngoId = localStorage.getItem('ngo_id');
        }
        
        // Use direct fetch with credentials
        const response = await fetch(`http://localhost:5000/api/video/${videoId}?ngo_id=${ngoId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        const data = await response.text();
        console.log('Delete response:', response.status, data);
        
        if (response.ok) {
          await fetchVideos(); // Refresh the list after successful deletion
          console.log('Video deleted successfully');
        } else {
          console.error('Server error:', data);
          setError(`Failed to delete video: ${data || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error deleting video:', err);
        setError('Failed to delete video. Please try again later.');
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    // Parse the skills covered input as a comma-separated list of IDs
    const skillsInput = e.target.value;
    // Split by commas and remove whitespace
    const skillsList = skillsInput.split(',').map(skill => skill.trim());
    
    setEditForm(prev => ({
      ...prev,
      skills_covered: skillsList
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating video:', editingVideo.video_id, editForm);
      
      // If no thumbnail URL, generate one
      if (!editForm.thumbnail_url) {
        editForm.thumbnail_url = getVideoThumbnail(editForm.title);
      }
      
      // Add NGO ID from localStorage
      let ngoId;
      try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        ngoId = userObj?.ngo_id || userObj?.id;
      } catch (e) {
        ngoId = localStorage.getItem('ngo_id');
      }
      
      // Use direct fetch with credentials
      const response = await fetch(`http://localhost:5000/api/video/${editingVideo.video_id}?ngo_id=${ngoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          skill: editForm.skill,
          level: editForm.level,
          duration: editForm.duration,
          thumbnail_url: editForm.thumbnail_url
        }),
        credentials: 'include'
      });
      
      // Wait for the main update to finish
      const data = await response.text();
      console.log('Update response:', response.status, data);
      
      // Now update the skills_covered field separately
      if (editForm.skills_covered && editForm.skills_covered.length > 0) {
        console.log('Updating skills covered:', editForm.skills_covered);
        
        const skillsResponse = await fetch(`http://localhost:5000/api/video/${editingVideo.video_id}/update-skills`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skills_covered: editForm.skills_covered
          }),
          credentials: 'include'
        });
        
        const skillsData = await skillsResponse.text();
        console.log('Skills update response:', skillsResponse.status, skillsData);
      }
      
      if (response.ok) {
        await fetchVideos(); // Refresh the list after successful update
        setEditingVideo(null);
        console.log('Video updated successfully');
      } else {
        // Try to parse the error as JSON
        let errorMessage = data;
        try {
          const errorJson = JSON.parse(data);
          errorMessage = errorJson.message || data;
        } catch (parseErr) {
          // If parsing fails, use the raw data
          console.error('Error parsing error response:', parseErr);
        }
        
        console.error('Server error:', errorMessage);
        setError(`Failed to update video: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Error updating video:', err);
      setError(`Failed to update video: ${err.message || 'Please try again later.'}`);
    }
  };

  const handleViewViewers = async (videoId) => {
    try {
      setLoadingViewers(true);
      setViewingViewers(videoId);
      setViewersError(null);
      
      // Get NGO ID from localStorage
      let ngoId;
      try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        ngoId = userObj?.ngo_id || userObj?.id;
      } catch (e) {
        ngoId = localStorage.getItem('ngo_id');
      }
      
      if (!ngoId) {
        setViewersError('Authentication required. Please log in again.');
        return;
      }

      // Use the API to get viewers data
      try {
        const response = await videoAPI.getVideoViewers(videoId);
        if (response.data) {
          setViewers(response.data);
        } else {
          setViewers([]);
        }
      } catch (error) {
        console.error('Error fetching video viewers:', error);
        setViewersError('Failed to load video viewers. Please try again.');
      }
    } finally {
      setLoadingViewers(false);
    }
  };

  const closeViewersModal = () => {
    setViewingViewers(null);
    setViewers([]);
    setViewersError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="ngo-videos-list">
      <div className="videos-header">
        <h2>Your Videos</h2>
        <button className="refresh-button" onClick={fetchVideos}>
          Refresh List
        </button>
      </div>
      {videos.length === 0 ? (
        <div className="no-videos">No videos found.</div>
      ) : (
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video.video_id} className="video-card">
              <div className="video-thumbnail">
                <img 
                  src={video.thumbnail_url || getVideoThumbnail(video.title || 'educational video')} 
                  alt={video.title || 'Video thumbnail'} 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = getVideoThumbnail('educational video');
                  }}
                />
              </div>
              {editingVideo?.video_id === video.video_id ? (
                <form onSubmit={handleEditSubmit} className="edit-form">
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    placeholder="Video Title"
                    required
                  />
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    placeholder="Video Description"
                    required
                  />
                  <input
                    type="text"
                    name="skill"
                    value={editForm.skill}
                    onChange={handleEditChange}
                    placeholder="Skill"
                  />
                  <input
                    type="text"
                    name="level"
                    value={editForm.level}
                    onChange={handleEditChange}
                    placeholder="Level"
                  />
                  <input
                    type="text"
                    name="duration"
                    value={editForm.duration}
                    onChange={handleEditChange}
                    placeholder="Duration"
                  />
                  <input
                    type="text"
                    name="thumbnail_url"
                    value={editForm.thumbnail_url}
                    onChange={handleEditChange}
                    placeholder="Thumbnail URL (optional)"
                  />
                  <input
                    type="text"
                    name="skills_covered"
                    value={editForm.skills_covered.join(', ')}
                    onChange={handleSkillsChange}
                    placeholder="Skills Covered (comma-separated)"
                  />
                  <div className="edit-actions">
                    <button type="submit" className="save-button">Save</button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => setEditingVideo(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h3>{video.title}</h3>
                  <p className="description">{video.description}</p>
                  <div className="video-details">
                    <span className="skill">{video.skill}</span>
                    <span className="level">{video.level}</span>
                    <span className="duration">{video.duration}</span>
                  </div>
                  <div className="video-actions">
                    <button 
                      className="view-button"
                      onClick={() => handleViewViewers(video.video_id)}
                    >
                      View Watchers
                    </button>
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(video)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(video.video_id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingViewers && (
        <div className="viewers-modal-overlay">
          <div className="viewers-modal">
            <div className="modal-header">
              <h3>Video Watchers: {videos.find(v => v.video_id === viewingViewers)?.title}</h3>
              <button className="close-modal-button" onClick={closeViewersModal}>×</button>
            </div>
            
            <div className="modal-content">
              {loadingViewers ? (
                <div className="loading">Loading video watchers...</div>
              ) : viewersError ? (
                <div className="error-message">{viewersError}</div>
              ) : viewers.length === 0 ? (
                <div className="no-viewers">No one has watched this video yet.</div>
              ) : (
                <div className="viewers-list">
                  <table className="viewers-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>View Date</th>
                        <th>Took Quiz</th>
                        <th>Quiz Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewers.map((viewer) => (
                        <tr key={viewer.view_id || viewer.user_id}>
                          <td>{viewer.user_id}</td>
                          <td>{formatDate(viewer.view_date)}</td>
                          <td>
                            <span className={viewer.quiz_completed ? 'status-completed' : 'status-pending'}>
                              {viewer.quiz_completed ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            {viewer.quiz_completed ? 
                              <span className="quiz-score">{viewer.quiz_score}%</span> : 
                              <span className="not-taken">Not taken</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGO_VideosList; 