import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
});

// We will add an interceptor here later to attach the auth token to requests

export default api;
