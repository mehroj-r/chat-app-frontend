
// Use the appropriate base URL
let API_BASE_URL;

if (process.env.REACT_APP_PIPELINE === 'production') {
    API_BASE_URL = `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/v1`;
}else {
    API_BASE_URL = 'http://localhost:8000/api/v1';
}

export default API_BASE_URL;