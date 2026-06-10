import axios from 'axios';

const api = axios.create({
  // Make absolutely sure this says localhost, NOT 127.0.0.1
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // 🚨 CRITICAL: This is the magic line that tells Axios to accept the cookie
  withCredentials: true, 
});

export default api;