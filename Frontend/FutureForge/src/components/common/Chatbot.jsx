import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { chatbotAPI } from '../../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi there! How can I help you with FutureForge today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('session-' + Math.random().toString(36).substring(2, 15));
  const messagesEndRef = useRef(null);
  
  // Predefined responses for common questions (as fallback)
  const knowledgeBase = {
    'video': 'You can find educational videos by navigating to the "Videos" section in the dashboard. You can filter videos by skill, level, or use the search function.',
    'skill': 'You can update your skills in your user profile. We use these skills to recommend videos and job opportunities that match your expertise.',
    'job': 'Available jobs can be found in the "Jobs" section. You can apply directly through our platform by clicking the "Apply" button on any job listing.',
    'interview': 'FutureForge offers mock interviews to help you prepare for real job interviews. Go to the "Mock Interview" section to practice your interview skills.',
    'recommendation': 'Our recommendation system suggests videos and jobs based on the skills in your profile. Make sure your skills are up to date for the best recommendations!',
    'login': 'To log in, use your email and password on the login page. If you forgot your password, you can reset it using the "Forgot Password" link.',
    'register': 'To create a new account, go to the registration page and fill out the required information. You\'ll need to provide your name, email, and create a password.',
    'upload': 'If you are an NGO user, you can upload educational videos through the "Post Videos" section in your dashboard.',
    'application': 'You can view the status of your job applications in the "My Applications" section of the dashboard.',
    'ngo': 'Non-Governmental Organizations (NGOs) can register to provide educational content and post job opportunities on our platform.'
  };

  // Scroll to bottom of chat when new messages come in
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage = { type: 'user', text: inputText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Try to get response from backend API
    try {
      const response = await chatbotAPI.sendMessage({
        message: userMessage.text,
        session_id: sessionId
      });
      
      const botResponse = { 
        type: 'bot', 
        text: response.data.response,
        source: response.data.source
      };
      
      // Update the session ID if returned
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }
      
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, botResponse]);
        setIsTyping(false);
      }, 1000); // Simulate thinking time
      
    } catch (error) {
      console.error('Error communicating with chatbot API:', error);
      
      // Fall back to local response generation
      const fallbackResponse = generateLocalResponse(userMessage.text);
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, fallbackResponse]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const generateLocalResponse = (userInput) => {
    // Convert to lowercase for easier matching
    const input = userInput.toLowerCase();
    
    // Check if the user input contains keywords from our knowledge base
    for (const [keyword, response] of Object.entries(knowledgeBase)) {
      if (input.includes(keyword)) {
        return { type: 'bot', text: response, source: 'local-fallback' };
      }
    }
    
    // Default responses if no keywords match
    const defaultResponses = [
      "I'm here to help with questions about FutureForge. Try asking about videos, jobs, skills, or interviews.",
      "I don't have an answer for that specific query. You can ask about videos, jobs, or using the platform features.",
      "That's a great question! However, I'm focused on helping with FutureForge features. Ask me about videos, jobs, or skills instead.",
      "I'm still learning, but I can help with basic questions about FutureForge. Try asking about videos, jobs, or your profile."
    ];
    
    // Return a random default response
    const randomIndex = Math.floor(Math.random() * defaultResponses.length);
    return { type: 'bot', text: defaultResponses[randomIndex], source: 'local-default' };
  };

  // Function to provide feedback on bot responses (thumbs up/down)
  const provideFeedback = async (messageIndex, feedback) => {
    try {
      // Only provide feedback for bot messages
      if (messages[messageIndex].type !== 'bot') return;
      
      await chatbotAPI.sendFeedback({
        message_id: messageIndex,
        session_id: sessionId,
        message: messages[messageIndex].text,
        feedback: feedback
      });
      
      console.log(`Feedback (${feedback}) sent for message: ${messages[messageIndex].text}`);
      
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot toggle button */}
      <button 
        className="chatbot-toggle-btn"
        onClick={toggleChatbot}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
      
      {/* Chatbot window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>FutureForge Assistant</h3>
            <button 
              className="close-btn"
              onClick={toggleChatbot}
              aria-label="Close chatbot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.type}-message`}
              >
                {message.text}
                {message.type === 'bot' && (
                  <div className="feedback-buttons">
                    <button 
                      onClick={() => provideFeedback(index, 'helpful')}
                      aria-label="Helpful"
                      title="This was helpful"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                      </svg>
                    </button>
                    <button 
                      onClick={() => provideFeedback(index, 'not_helpful')}
                      aria-label="Not helpful"
                      title="This was not helpful"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message bot-message typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input" onSubmit={handleSendMessage}>
            <input 
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type your message..."
              aria-label="Type your message"
            />
            <button 
              type="submit"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 