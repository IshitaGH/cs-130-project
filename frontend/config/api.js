// localhost doesn't work because Flask does not by default allow localhost in CORS policy (even though it resolves to 127.0.0.1)
const API_URL = "http://127.0.0.1:5000/api/data"; 

export default API_URL;