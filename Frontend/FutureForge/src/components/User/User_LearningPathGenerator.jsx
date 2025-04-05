import React, { useState } from 'react';
import { generateLearningRoadmap } from '../../utils/geminiApi';
import RoadmapOutput from './User_RoadmapOutput';

// Main component for learning path generation
const LearningPathGenerator = () => {
  // State variables
  const [currentSkills, setCurrentSkills] = useState('');
  const [desiredSkills, setDesiredSkills] = useState('');
  const [roadmap, setRoadmap] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentSkills.trim() || !desiredSkills.trim()) {
      setError('Please enter both your current skills and what you want to learn');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Convert comma-separated inputs to arrays
      const skillsArray = currentSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);
        
      const learningGoalsArray = desiredSkills
        .split(',')
        .map(goal => goal.trim())
        .filter(goal => goal);
      
      // Call Gemini API
      const result = await generateLearningRoadmap(skillsArray, learningGoalsArray);
      setRoadmap(result);
      setSuccess(true);
      
      // Scroll to roadmap after a brief delay
      setTimeout(() => {
        document.getElementById('roadmap-output-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
      
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="learning-path-container">
      <div className="header">
        <h1>🧠 Personalized Learning Path Generator</h1>
        <p>Enter your current skills and what you want to learn to get a customized roadmap with clear milestones</p>
      </div>

      <div className="card-container">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="current-skills">💪 What skills do you already have?</label>
            <textarea
              id="current-skills"
              placeholder="Enter your current skills (e.g., HTML, CSS, JavaScript)"
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              className="text-input"
            />
            <p className="hint">Separate multiple skills with commas</p>
          </div>

          <div className="form-group">
            <label htmlFor="desired-skills">🎯 What do you want to learn?</label>
            <textarea
              id="desired-skills"
              placeholder="Enter skills you want to learn (e.g., React, Node.js, MongoDB)"
              value={desiredSkills}
              onChange={(e) => setDesiredSkills(e.target.value)}
              className="text-input"
            />
            <p className="hint">Separate multiple skills with commas</p>
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {success && <div className="success-message">✅ Your personalized learning path has been created!</div>}

          <button 
            type="submit" 
            className="generate-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Your Path...' : 'Generate Learning Path'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">
            <h3>🔍 Analyzing Your Skills & Goals</h3>
            <p>Creating your personalized learning journey with intelligent milestones and resources...</p>
            <div className="loading-phases">
              <div className="phase">🧩 Mapping skill connections</div>
              <div className="phase">📚 Finding ideal resources</div>
              <div className="phase">⏱️ Calculating optimal timeframes</div>
              <div className="phase">🏆 Defining success metrics</div>
            </div>
          </div>
        </div>
      )}

      <div id="roadmap-output-section">
        {roadmap && !isLoading && <RoadmapOutput roadmapContent={roadmap} />}
      </div>

      <style>
        {`
        .learning-path-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 32px;
          color: #2563eb;
          margin-bottom: 12px;
          font-weight: 700;
        }
        
        .header p {
          font-size: 18px;
          color: #4b5563;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .card-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          margin-bottom: 40px;
        }
        
        .input-form {
          padding: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #1f2937;
        }
        
        .text-input {
          width: 100%;
          padding: 15px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
          min-height: 120px;
          resize: vertical;
        }
        
        .text-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .hint {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }
        
        .error-message {
          background-color: #fef2f2;
          color: #b91c1c;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .success-message {
          background-color: #f0fdf4;
          color: #166534;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .generate-button {
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 15px 25px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
        }
        
        .generate-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        
        .generate-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        .loading-container {
          display: flex;
          align-items: center;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 40px;
          gap: 30px;
        }
        
        .spinner {
          width: 70px;
          height: 70px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
          flex-shrink: 0;
        }
        
        .loading-text {
          flex: 1;
        }
        
        .loading-text h3 {
          font-size: 22px;
          color: #1f2937;
          margin: 0 0 10px 0;
        }
        
        .loading-text p {
          color: #4b5563;
          margin-bottom: 20px;
        }
        
        .loading-phases {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .phase {
          font-size: 14px;
          color: #6b7280;
          padding: 8px 12px;
          border-radius: 20px;
          background-color: #f3f4f6;
          display: inline-block;
          margin-right: 10px;
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .phase:nth-child(1) { animation-delay: 0.5s; }
        .phase:nth-child(2) { animation-delay: 1.5s; }
        .phase:nth-child(3) { animation-delay: 2.5s; }
        .phase:nth-child(4) { animation-delay: 3.5s; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .learning-path-container {
            padding: 20px 15px;
          }
          
          .header h1 {
            font-size: 26px;
          }
          
          .header p {
            font-size: 16px;
          }
          
          .input-form {
            padding: 20px;
          }
          
          .loading-container {
            flex-direction: column;
            padding: 30px 20px;
            text-align: center;
          }
          
          .spinner {
            margin-bottom: 20px;
          }
        }
        
        @media print {
          .input-form, .roadmap-actions {
            display: none;
          }
          
          .learning-path-container {
            padding: 0;
          }
        }
        `}
      </style>
    </div>
  );
};

export default LearningPathGenerator;