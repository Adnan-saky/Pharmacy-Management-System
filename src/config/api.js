
// centralized API configuration
// Automatically switches between local dev server and relative path for production (Vercel)

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export default API_BASE_URL;
