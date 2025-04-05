import React, { useState, useEffect } from 'react';
import { videoAPI } from '../../utils/api';
import './VideoPlayer.css';

const VideoPlayer = ({ videoId, onClose }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchVideo = async () => {
      try {
        const response = await videoAPI.getVideo(videoId);
        // Add thumbnail if not present
        if (!response.data.thumbnail_url) {
          response.data.thumbnail_url = getVideoThumbnail(response.data.title || 'educational video');
        }
        setVideo(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load video. Please try again later.');
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="video-player-content">
          <div className="loading">Loading video...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="video-player-content">
          <div className="error">{error}</div>
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="video-player-content">
        <div className="video-player-header">
          <h2>{video.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="video-container">
          {video.url ? (
            <video
              src={video.url}
              controls
              autoPlay
              className="video-element"
              poster={video.thumbnail_url}
              onError={(e) => {
                console.error("Video error:", e);
                e.target.onerror = null;
                // If video fails to load, display thumbnail placeholder
                const container = e.target.parentElement;
                if (container) {
                  const placeholder = document.createElement('div');
                  placeholder.className = 'video-placeholder';
                  placeholder.innerHTML = `
                    <img 
                      src="${video.thumbnail_url || getVideoThumbnail('educational video')}" 
                      alt="${video.title || 'Video thumbnail'}" 
                      class="video-thumbnail-large"
                    />
                    <div class="video-not-available">
                      Video content is not available. Please try again later.
                    </div>
                  `;
                  container.replaceChild(placeholder, e.target);
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="video-placeholder">
              <img 
                src={video.thumbnail_url || getVideoThumbnail('educational video')} 
                alt={video.title || 'Video thumbnail'} 
                className="video-thumbnail-large"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getVideoThumbnail('educational video');
                }}
              />
              <div className="video-not-available">
                Video content is not available. Please try again later.
              </div>
            </div>
          )}
        </div>
        <div className="video-details">
          <p className="description">{video.description}</p>
          <div className="video-meta">
            {video.skill && <span className="skill">{video.skill}</span>}
            {video.level && <span className="level">{video.level}</span>}
            {video.duration && <span className="duration">{video.duration}</span>}
            {video.ngo_name && <span className="ngo">{video.ngo_name}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 