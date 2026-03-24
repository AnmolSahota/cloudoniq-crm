import axios from "axios";

const BASE_URL = "http://localhost:8081/api";

// 🔐 LOGIN (optional if needed)
export const loginUser = async (email, password) => {
  return await axios.post(
    `${BASE_URL}/auth/login`,
    { email, password },
    { withCredentials: true }
  );
};

// 🔓 LOGOUT
export const logoutUser = async () => {
  return await axios.post(
    `${BASE_URL}/auth/logout`,
    {},
    { withCredentials: true } // ⚠️ IMPORTANT
  );
};