import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import Logo from '../../assets/images/logo.jsx';
import LanguageSelector from '../common/LanguageSelector';
import './User_Login.css';

const User_Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isNGO, setIsNGO] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for type parameter in URL
        const queryParams = new URLSearchParams(location.search);
        const type = queryParams.get('type');
        
        if (type === 'ngo') {
            setIsNGO(true);
        } else if (type === 'user') {
            setIsNGO(false);
        }
    }, [location]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let response;
            if (isNGO) {
                response = await authAPI.loginNGO(formData);
            } else {
                response = await authAPI.loginUser(formData);
            }
            
            if (response.data) {
                console.log('Login response data:', response.data);
                
                // Create a unified user object
                const userData = {
                    id: response.data.user_id || response.data.ngo_id,
                    user_id: response.data.user_id, // Explicitly include user_id
                    ngo_id: response.data.ngo_id,   // Explicitly include ngo_id
                    name: response.data.full_name || response.data.name,
                    email: formData.email,
                    role: isNGO ? 'ngo' : 'user'
                };
                
                // Store user data and token in localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', response.data.token || '');
                
                // Also store the primary IDs separately for simpler access
                if (response.data.user_id) {
                    localStorage.setItem('user_id', response.data.user_id);
                }
                if (response.data.ngo_id) {
                    localStorage.setItem('ngo_id', response.data.ngo_id);
                }
                
                // Redirect to the appropriate dashboard
                if (isNGO) {
                    navigate('/ngo');
                } else {
                    navigate('/user');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserType = () => {
        setIsNGO(!isNGO);
        setError('');
    };

    return (
        <div className="login-container">
            <div className="login-language-selector">
                <LanguageSelector />
            </div>
            
            <div className="login-content">
                <div className="login-left-panel">
                    <div className="login-hero">
                        <h1>Welcome to FutureForge</h1>
                        <p>Your gateway to skill development, career opportunities, and meaningful connections.</p>
                        <div className="login-features">
                            <div className="feature-item">
                                <div className="feature-icon">🚀</div>
                                <div className="feature-text">
                                    <h3>Skill Development</h3>
                                    <p>Access personalized learning paths and curated educational content</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">💼</div>
                                <div className="feature-text">
                                    <h3>Job Opportunities</h3>
                                    <p>Connect with NGOs offering real-world projects and employment</p>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🎯</div>
                                <div className="feature-text">
                                    <h3>Career Readiness</h3>
                                    <p>Prepare for interviews and build your professional portfolio</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="login-form-panel">
                    <div className="login-box">
                        <div className="login-logo">
                            <Logo width="100px" height="auto" />
                        </div>
                        
                        <h2>{isNGO ? 'NGO Login' : 'User Login'}</h2>
                        
                        <div className="toggle-container">
                            <button 
                                className={`toggle-button ${!isNGO ? 'active' : ''}`} 
                                onClick={() => !isNGO || toggleUserType()}
                            >
                                User
                            </button>
                            <button 
                                className={`toggle-button ${isNGO ? 'active' : ''}`}
                                onClick={() => isNGO || toggleUserType()}
                            >
                                NGO
                            </button>
                        </div>
                        
                        {error && <div className="error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {error}
                        </div>}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-with-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-with-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="forgot-password">
                                <Link to="/user/reset-password">Forgot password?</Link>
                            </div>
                            <button 
                                type="submit" 
                                className={`login-button ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="spinner" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                                        </svg>
                                        <span>Logging in...</span>
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>
                        <div className="register-link">
                            Don't have an account? <Link to="/user/register">Register</Link>
                        </div>
                        <div className="back-to-home">
                            <Link to="/">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default User_Login; 