import axios from "axios";

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api",
  timeout: 25000, // 25s
  // Do not force Content-Type globally; allow axios/browser to set it per request
  // e.g., FormData uploads need multipart boundaries set automatically
  headers: {},
});

export default Axios;
