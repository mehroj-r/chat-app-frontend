
// Use the appropriate base url
let WS_BASE_URL;

if (process.env.REACT_APP_PIPELINE === 'production') {
    WS_BASE_URL = `ws://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`;
}else {
    WS_BASE_URL = 'ws://localhost:8000';
}

export default WS_BASE_URL;