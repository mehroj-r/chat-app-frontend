// Detect if we're running on localhost or on a network
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use the appropriate base URL
const API_BASE_URL = isLocalhost
    ? 'http://127.0.0.1:8000/api/v1'
    : `http://${window.location.hostname.split(':')[0]}:8000/api/v1`;

export default API_BASE_URL;