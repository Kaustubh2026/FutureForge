import React, { useState } from 'react';
import { generateLearningRoadmap } from '../utils/geminiApi';
import RoadmapOutput from './User_RoadmapOutput';

// Main component for learning path generation
const LearningPathGenerator = () => {
  // State variables
  const [currentSkills, setCurrentSkills] = useState('');
  const [desiredSkills, setDesiredSkills] = useState('');
  const [roadmap, setRoadmap] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentSkills.trim() || !desiredSkills.trim()) {
      setError('Please enter both your current skills and what you want to learn');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
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
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="learning-path-container">
      <div className="header">
        <h1>Personalized Learning Path Generator</h1>
        <p>Enter your current skills and what you want to learn to get a customized roadmap</p>
      </div>

      <div className="card-container">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="current-skills">What skills do you already have?</label>
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
            <label htmlFor="desired-skills">What do you want to learn?</label>
            <textarea
              id="desired-skills"
              placeholder="Enter skills you want to learn (e.g., React, Node.js, MongoDB)"
              value={desiredSkills}
              onChange={(e) => setDesiredSkills(e.target.value)}
              className="text-input"
            />
            <p className="hint">Separate multiple skills with commas</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="generate-button"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Learning Path'}
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating your personalized learning path...</p>
        </div>
      )}

      {roadmap && !isLoading && <RoadmapOutput roadmapContent={roadmap} />}

      <style jsx>{`
        .learning-path-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 30px 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 32px;
          color: #1a1a1a;
          margin-bottom: 12px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        
        .header p {
          font-size: 18px;
          color: #555;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .card-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          margin-bottom: 40px;
        }
        
        .card-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
        }
        
        .input-form {
          padding: 30px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #333;
          font-size: 17px;
        }
        
        .text-input {
          width: 100%;
          padding: 14px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          min-height: 120px;
          resize: vertical;
          background-color: #fff;
          transition: border-color 0.3s, box-shadow 0.3s;
          font-family: inherit;
          color: #333;
        }
        
        .text-input::placeholder {
          color: #9ca3af;
          opacity: 1;
        }
        
        .text-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        
        .hint {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }
        
        .generate-button {
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px 28px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .generate-button:hover {
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        
        .generate-button:disabled {
          background: linear-gradient(90deg, #93c5fd, #a5b4fc);
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #b91c1c;
          font-size: 15px;
          line-height: 1.5;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Responsive design */
        @media (max-width: 992px) {
          .learning-path-container {
            max-width: 700px;
          }
        }
        
        @media (max-width: 768px) {
          .learning-path-container {
            padding: 20px 15px;
          }
          
          .header {
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 28px;
          }
          
          .header p {
            font-size: 16px;
          }
          
          .input-form {
            padding: 25px;
          }
          
          .form-group label {
            font-size: 16px;
          }
          
          .text-input {
            padding: 12px;
            min-height: 100px;
          }
          
          .generate-button {
            padding: 12px 24px;
            font-size: 16px;
          }
        }
        
        @media (max-width: 576px) {
          .learning-path-container {
            padding: 15px 10px;
          }
          
          .header {
            margin-bottom: 25px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .header p {
            font-size: 15px;
          }
          
          .card-container {
            border-radius: 10px;
          }
          
          .input-form {
            padding: 20px 15px;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          .form-group label {
            font-size: 15px;
            margin-bottom: 8px;
          }
          
          .text-input {
            padding: 10px;
            font-size: 15px;
            min-height: 90px;
          }
          
          .hint {
            font-size: 13px;
          }
          
          .generate-button {
            padding: 12px 20px;
            font-size: 15px;
          }
          
          .error-message {
            padding: 12px;
            font-size: 14px;
            margin-bottom: 15px;
          }
          
          .loading-container {
            padding: 40px 0;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border-width: 3px;
          }
        }
        
        /* Touch device optimizations */
        @media (hover: none) {
          .card-container:hover {
            transform: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          
          .card-container:active {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          }
          
          .generate-button:hover {
            background: linear-gradient(90deg, #3b82f6, #6366f1);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          .generate-button:active {
            background: linear-gradient(90deg, #2563eb, #4f46e5);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default LearningPathGenerator;