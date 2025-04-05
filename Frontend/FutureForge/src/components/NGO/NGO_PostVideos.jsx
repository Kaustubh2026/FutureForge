import React, { useState, useEffect } from 'react';
import { videoAPI } from '../../utils/api';
import './NGO_PostVideos.css';

const NGO_PostVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill: '',
    level: 'beginner',
    thumbnail_url: '',
    skills_covered: []
  });

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

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoAPI.getNGOVideos();
      
      // Add thumbnail URLs to videos that don't have them
      const videosWithThumbnails = response.data.map(video => {
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleGenerateThumbnail = () => {
    const thumbnailUrl = getVideoThumbnail(formData.title || 'educational video');
    setFormData({
      ...formData,
      thumbnail_url: thumbnailUrl
    });
  };

  const handleSkillsChange = (e) => {
    // Parse the skills covered input as a comma-separated list of IDs
    const skillsInput = e.target.value;
    // Split by commas and remove whitespace
    const skillsList = skillsInput.split(',').map(skill => skill.trim());
    
    setFormData(prev => ({
      ...prev,
      skills_covered: skillsList
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a video file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Create a FormData object to send the file
      const videoFormData = new FormData();
      videoFormData.append('video', selectedFile);
      videoFormData.append('title', formData.title);
      videoFormData.append('description', formData.description);
      videoFormData.append('skill', formData.skill);
      videoFormData.append('level', formData.level);
      
      // Add skills_covered array
      if (formData.skills_covered && formData.skills_covered.length > 0) {
        videoFormData.append('skills_covered', JSON.stringify(formData.skills_covered));
      }
      
      // Generate and add a thumbnail if not provided
      if (!formData.thumbnail_url) {
        const thumbnailUrl = getVideoThumbnail(formData.title || 'educational video');
        videoFormData.append('thumbnail_url', thumbnailUrl);
      } else {
        videoFormData.append('thumbnail_url', formData.thumbnail_url);
      }
      
      // Here you would normally track upload progress
      // Simulating progress for now
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      const response = await videoAPI.uploadVideo(videoFormData);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        
        // Reset form after successful upload
        setFormData({
          title: '',
          description: '',
          skill: '',
          level: 'beginner',
          thumbnail_url: '',
          skills_covered: []
        });
        setSelectedFile(null);
        
        // Refresh the list of videos
        fetchVideos();
      }, 1000);
      
    } catch (err) {
      console.error('Error uploading video:', err);
      setIsUploading(false);
      setUploadProgress(0);
      setError('Failed to upload video. Please try again.');
    }
  };

  return (
    <div className="post-videos-container">
      <h1>Upload New Video</h1>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Video Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="skill">Skill Category</label>
          <input
            type="text"
            id="skill"
            name="skill"
            value={formData.skill}
            onChange={handleInputChange}
            placeholder="e.g., Programming, Design, Marketing"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="level">Difficulty Level</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleInputChange}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="skills_covered">Skills Covered (comma-separated)</label>
          <input
            type="text"
            id="skills_covered"
            name="skills_covered"
            value={formData.skills_covered.join(', ')}
            onChange={handleSkillsChange}
            placeholder="e.g., programming, design, data_analysis"
          />
          <small className="form-text">Enter skill IDs separated by commas. These will be used to match videos with user skills.</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="thumbnail_url">Thumbnail URL (optional)</label>
          <div className="thumbnail-input-group">
            <input
              type="text"
              id="thumbnail_url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleInputChange}
              placeholder="Enter a URL or click Generate to create one"
            />
            <button
              type="button"
              className="generate-thumbnail-btn"
              onClick={handleGenerateThumbnail}
            >
              Generate
            </button>
          </div>
          {formData.thumbnail_url && (
            <div className="thumbnail-preview">
              <img 
                src={formData.thumbnail_url} 
                alt="Thumbnail preview" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getVideoThumbnail('educational video');
                }}
              />
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="video">Select Video</label>
          <input
            type="file"
            id="video"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            required
          />
          {selectedFile && (
            <div className="file-info">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024 / 1024 * 10) / 10} MB)
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <div className="progress-text">{uploadProgress}%</div>
          </div>
        )}
        
        <button 
          type="submit" 
          className="upload-button" 
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
      
      <div className="videos-section">
        <h2>Your Videos</h2>
        {loading ? (
          <div className="loading">Loading videos...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : videos.length === 0 ? (
          <div className="no-videos">No videos posted yet.</div>
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
                <h3>{video.title}</h3>
                <p className="description">{video.description}</p>
                <div className="video-details">
                  {video.skill && <span className="skill">{video.skill}</span>}
                  {video.level && <span className="level">{video.level}</span>}
                  {video.duration && <span className="duration">{video.duration}</span>}
                </div>
                <div className="video-actions">
                  <button className="edit-button">Edit</button>
                  <button className="delete-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NGO_PostVideos;