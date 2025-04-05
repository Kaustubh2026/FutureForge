import React, { useState, useEffect, useCallback } from 'react';
import { videoAPI, userAPI } from '../../utils/api';
import VideoPlayer from './VideoPlayer';
import './User_VideosList.css';

const User_VideosList = () => {
  const [videos, setVideos] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [filters, setFilters] = useState({
    skill: '',
    level: '',
    search: ''
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

  // Create a fetchVideos function that can be reused
  const fetchVideos = useCallback(async () => {
    try {
      console.log('Fetching user videos...');
      setLoading(true);
      
      // Fetch user skills and recommended videos in one call
      const recommendationsResponse = await userAPI.getRecommendedVideos();
      const recommendationsData = recommendationsResponse.data;
      
      setUserSkills(recommendationsData.user_skills || []);
      // Store the recommended videos from the API
      setRecommendedVideos(recommendationsData.recommended_videos || []);
      
      // Save debug info if available
      if (recommendationsData.debug_info) {
        setDebugInfo(recommendationsData.debug_info);
        console.log('Debug info:', recommendationsData.debug_info);
      }
      
      // Log user skills and debug info for debugging
      console.log('User skills:', recommendationsData.user_skills);
      console.log('Recommended videos:', recommendationsData.recommended_videos);
      
      // Fetch all videos
      const response = await videoAPI.getUserVideos();
      console.log('User videos fetched:', response.data);
      
      // Filter out any null or undefined videos
      const validVideos = response.data.filter(video => video && video.video_id);
      
      // Add thumbnail URLs to videos that don't have them and mark recommended ones
      const videosWithThumbnails = validVideos.map(video => {
        // Check if this video is in the recommended list
        const isRecommended = recommendationsData.recommended_videos.some(
          rec => rec.video_id === video.video_id
        );
        
        // Add thumbnail if missing
        if (!video.thumbnail_url) {
          return { 
            ...video, 
            thumbnail_url: getVideoThumbnail(video.title || 'educational video'),
            isRecommended: isRecommended
          };
        }
        return { ...video, isRecommended: isRecommended };
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

  // Initial fetch
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWatchVideo = async (videoId) => {
    try {
      // Verify video still exists before playing
      const response = await videoAPI.getVideo(videoId);
      if (response.status === 200) {
        setSelectedVideoId(videoId);
      } else {
        // Video no longer exists, refresh the list
        setError('This video is no longer available.');
        fetchVideos();
      }
    } catch (err) {
      console.error('Error accessing video:', err);
      setError('This video is no longer available.');
      fetchVideos();
    }
  };

  const handleCloseVideo = () => {
    setSelectedVideoId(null);
    setError(null); // Clear any errors when closing video
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchVideos();
  };

  const filteredVideos = videos.filter(video => {
    const matchesSkill = !filters.skill || video.skill?.toLowerCase() === filters.skill.toLowerCase();
    const matchesLevel = !filters.level || video.level?.toLowerCase() === filters.level.toLowerCase();
    const matchesSearch = !filters.search || 
      video.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      video.description?.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSkill && matchesLevel && matchesSearch;
  });

  // Handle toggling debug info display
  const toggleDebug = () => {
    setShowDebug(prevState => !prevState);
  };

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  return (
    <div className="videos-list">
      <div className="videos-header">
        <h2>Available Videos</h2>
        <div className="header-actions">
          <button onClick={handleRefresh} className="refresh-button">
            Refresh
          </button>
          <button onClick={toggleDebug} className="debug-button">
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>
        </div>
      </div>
      
      {showDebug && debugInfo && (
        <div className="debug-info-panel">
          <h4>Recommendation Debug Info</h4>
          <div className="debug-content">
            <p><strong>User ID:</strong> {debugInfo.user_id}</p>
            <p><strong>User Skills:</strong> {debugInfo.user_skills?.join(', ') || 'None'}</p>
            <p><strong>Total Videos:</strong> {debugInfo.total_videos}</p>
            <p><strong>Matched Videos:</strong> {debugInfo.matched_videos}</p>
          </div>
          <div className="debug-explanation">
            <p>Each video is assigned specific skills (like "programming", "design", etc.).
            Videos are recommended when they have at least one skill that matches your skills.</p>
          </div>
        </div>
      )}
      
      {userSkills.length > 0 && recommendedVideos.length > 0 && (
        <div className="recommended-videos-section">
          <h3>Recommended for Your Skills</h3>
          <div className="skill-tags">
            {userSkills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill.name || skill.skill_id || `Skill ${index + 1}`}</span>
            ))}
          </div>
          <div className="videos-grid">
            {recommendedVideos.map((video) => (
              <div key={video.video_id} className="video-card recommended">
                <div className="recommended-badge">Recommended</div>
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
                  {video.ngo_name && <span className="ngo">{video.ngo_name}</span>}
                </div>
                {video.skills_covered && video.skills_covered.length > 0 && (
                  <div className="video-skills">
                    <span className="skills-label">Skills covered:</span>
                    <div className="skills-list">
                      {Array.isArray(video.skills_covered) ? 
                        video.skills_covered.map((skill, idx) => (
                          <span key={idx} className="video-skill-tag">{skill}</span>
                        )) : 
                        <span className="video-skill-tag">Unknown format</span>
                      }
                    </div>
                  </div>
                )}
                <button 
                  className="watch-button"
                  onClick={() => handleWatchVideo(video.video_id)}
                >
                  Watch Now
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
          placeholder="Search videos..."
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
      
      <h3>All Videos</h3>
      
      {error && <div className="error">{error}</div>}
      {filteredVideos.length === 0 ? (
        <div className="no-videos">No videos found matching your criteria.</div>
      ) : (
        <div className="videos-grid">
          {filteredVideos.map((video) => (
            <div key={video.video_id} className={`video-card ${video.isRecommended ? 'is-recommended' : ''}`}>
              {video.isRecommended && <div className="recommended-tag">Recommended for you</div>}
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
                {video.ngo_name && <span className="ngo">{video.ngo_name}</span>}
              </div>
              {video.skills_covered && video.skills_covered.length > 0 && (
                <div className="video-skills">
                  <span className="skills-label">Skills covered:</span>
                  <div className="skills-list">
                    {Array.isArray(video.skills_covered) ? 
                      video.skills_covered.map((skill, idx) => (
                        <span key={idx} className="video-skill-tag">{skill}</span>
                      )) : 
                      <span className="video-skill-tag">Unknown format</span>
                    }
                  </div>
                </div>
              )}
              <button 
                className="watch-button"
                onClick={() => handleWatchVideo(video.video_id)}
              >
                Watch Now
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedVideoId && (
        <VideoPlayer
          videoId={selectedVideoId}
          onClose={handleCloseVideo}
        />
      )}
    </div>
  );
};

export default User_VideosList; 