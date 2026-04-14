// Central API URL config
// Development → uses proxy from package.json
// Production  → uses REACT_APP_API_URL environment variable set in Vercel

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default API;
