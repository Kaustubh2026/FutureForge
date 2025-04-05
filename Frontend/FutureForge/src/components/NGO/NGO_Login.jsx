import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import Logo from '../../assets/images/logo.jsx';
import './NGO_Login.css';

const NGO_Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await authAPI.loginNGO(formData);
            if (response.data) {
                // Store NGO data in localStorage
                localStorage.setItem('ngo_id', response.data.ngo_id);
                localStorage.setItem('user_type', 'ngo');
                localStorage.setItem('ngo_name', response.data.organization_name);
                
                // Redirect to dashboard
                navigate('/ngo/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during login');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-logo">
                    <Logo width="160px" height="auto" />
                </div>
                
                <h2>NGO Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <div className="register-link">
                    Don't have an account? <a href="/ngo/register">Register</a>
                </div>
            </div>
        </div>
    );
};

export default NGO_Login; 