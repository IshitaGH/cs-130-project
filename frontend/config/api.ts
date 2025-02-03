// localhost doesn't work because Flask does not by default allow localhost in CORS policy (even though it resolves to 127.0.0.1)
// const API_URL = "http://127.0.0.1:5000";
const API_URL = "http://192.168.1.135:5000";  // set to your computer's IP if trying to use Expo Go
export default API_URL;