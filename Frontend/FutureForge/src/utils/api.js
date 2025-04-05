import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear user data and redirect to login
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_type');
            localStorage.removeItem('user_name');
            localStorage.removeItem('ngo_id');
            localStorage.removeItem('ngo_name');
            window.location.href = '/user/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    loginUser: (data) => api.post('/auth/login/user', data),
    loginNGO: (data) => api.post('/auth/login/ngo', data),
    logout: () => api.post('/auth/logout'),
};

// Job API
export const jobAPI = {
    getAllJobs: () => api.get('/job/list'),
    getNGOJobs: () => api.get('/ngo/jobs'),
    getJob: (jobId) => api.get(`/job/${jobId}`),
    searchJobs: (params) => api.get('/job/search', { params }),
    postJob: (data) => api.post('/ngo/post-job', data),
    applyToJob: (jobId, data) => api.post(`/job/${jobId}/apply`, data),
    getJobApplicants: (jobId) => api.get(`/job/${jobId}/applicants`),
    withdrawApplication: (applicationId, data) => api.post(`/job/applications/${applicationId}/withdraw`, data),
    updateApplicationStatus: (applicationId, data) => api.put(`/job/applications/${applicationId}/status`, data),
    getUserApplications: () => api.get('/job/applications'),
    uploadJobPDF: (formData) => api.post('/job/upload-pdf', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

// Video API
export const videoAPI = {
    getAllVideos: async () => {
        try {
            console.log('Getting all videos...');
            const response = await api.get('/video/list');
            console.log('All videos response:', response);
            return response;
        } catch (error) {
            console.error('Error getting all videos:', error);
            throw error;
        }
    },
    getUserVideos: async () => {
        try {
            console.log('Getting user videos...');
            const response = await api.get('/video/user/list');
            console.log('User videos response:', response);
            return response;
        } catch (error) {
            console.error('Error getting user videos:', error);
            throw error;
        }
    },
    getNGOVideos: async () => {
        try {
            console.log('Getting NGO videos...');
            const response = await api.get('/ngo/videos');
            console.log('NGO videos response:', response);
            return response;
        } catch (error) {
            console.error('Error getting NGO videos:', error);
            throw error;
        }
    },
    getVideo: async (videoId) => {
        try {
            console.log('Getting video:', videoId);
            const response = await api.get(`/video/${videoId}`);
            console.log('Video response:', response);
            return response;
        } catch (error) {
            console.error('Error getting video:', error);
            throw error;
        }
    },
    getVideoSkills: async (videoId) => {
        try {
            console.log('Getting video skills:', videoId);
            const response = await api.get(`/video/${videoId}/skills`);
            console.log('Video skills response:', response);
            return response;
        } catch (error) {
            console.error('Error getting video skills:', error);
            throw error;
        }
    },
    postVideo: async (data) => {
        try {
            console.log('Posting video:', data);
            const response = await api.post('/ngo/post-video', data);
            console.log('Post video response:', response);
            return response;
        } catch (error) {
            console.error('Error posting video:', error);
            throw error;
        }
    },
    uploadVideo: async (formData) => {
        try {
            console.log('Uploading video...');
            const response = await api.post('/video/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload video response:', response);
            return response;
        } catch (error) {
            console.error('Error uploading video:', error);
            throw error;
        }
    },
    addVideoSkills: async (videoId, data) => {
        try {
            console.log('Adding video skills:', videoId, data);
            const response = await api.post(`/video/${videoId}/skills`, data);
            console.log('Add video skills response:', response);
            return response;
        } catch (error) {
            console.error('Error adding video skills:', error);
            throw error;
        }
    },
    updateVideo: async (videoId, data) => {
        try {
            console.log('Updating video:', videoId, data);
            const response = await api.put(`/video/${videoId}`, data);
            console.log('Update video response:', response);
            return response;
        } catch (error) {
            console.error('Error updating video:', error);
            throw error;
        }
    },
    deleteVideo: async (videoId) => {
        try {
            console.log('Deleting video:', videoId);
            const response = await api.delete(`/video/${videoId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true
            });
            console.log('Delete video response:', response);
            return response;
        } catch (error) {
            console.error('Error deleting video:', error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            throw error;
        }
    },
    getVideoViewers: async (videoId) => {
        try {
            console.log('Getting video viewers:', videoId);
            const response = await api.get(`/video/${videoId}/viewers`);
            console.log('Video viewers response:', response);
            return response;
        } catch (error) {
            console.error('Error getting video viewers:', error);
            throw error;
        }
    },
};

// User API
export const userAPI = {
    getDashboard: async () => {
        try {
            console.log('Fetching user dashboard data...');
            const response = await api.get('/user/dashboard');
            console.log('User dashboard response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching user dashboard:', error);
            
            // Add more detailed error information
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            
            throw error;
        }
    },
    getRecommendedVideos: async () => {
        try {
            console.log('Fetching personalized video recommendations...');
            const response = await api.get('/user/recommended-videos');
            console.log('Recommendations response:', response);
            return response;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            throw error;
        }
    },
    getLearningPath: () => api.get('/user/learning-path'),
    updateSkills: (data) => api.post('/user/update-skills', data),
    updateQuizScore: (data) => api.post('/user/update-quiz-score', data),
};

// Test utilities for seeding data
export const testUtils = {
    seedUserSkills: async (userId, skills) => {
        try {
            console.log('Seeding user skills:', userId, skills);
            const response = await api.post('/user/seed-user-skills', {
                user_id: userId,
                skills: skills
            });
            console.log('Seed user skills response:', response);
            return response;
        } catch (error) {
            console.error('Error seeding user skills:', error);
            throw error;
        }
    },
    
    seedVideoSkills: async (videoId, skills) => {
        try {
            console.log('Seeding video skills:', videoId, skills);
            const response = await api.post('/video/seed-video-skills', {
                video_id: videoId,
                skills: skills
            });
            console.log('Seed video skills response:', response);
            return response;
        } catch (error) {
            console.error('Error seeding video skills:', error);
            throw error;
        }
    },
    
    assignTestSkillsToVideos: async () => {
        try {
            console.log('Assigning test skills to all videos...');
            const response = await api.get('/video/assign-test-skills');
            console.log('Assign test skills response:', response);
            return response;
        } catch (error) {
            console.error('Error assigning test skills:', error);
            throw error;
        }
    },
    
    // Helper function to generate sample skills data
    getSampleSkills: () => {
        return [
            { skill_id: 'programming', name: 'Programming' },
            { skill_id: 'design', name: 'Design' },
            { skill_id: 'marketing', name: 'Marketing' },
            { skill_id: 'data_analysis', name: 'Data Analysis' },
            { skill_id: 'web_dev', name: 'Web Development' }
        ];
    }
};

// Chatbot API
export const chatbotAPI = {
    sendMessage: (data) => api.post('/chatbot/message', data),
    sendFeedback: (data) => api.post('/chatbot/feedback', data),
};

export default {
    api,
    authAPI,
    jobAPI,
    videoAPI,
    userAPI,
    testUtils,
    chatbotAPI,
    post: api.post,
}; 