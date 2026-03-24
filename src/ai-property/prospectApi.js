import axios from "axios";

const BASE_URL = "http://localhost:8081/api";

export const getProspect = async (leadId) => {
  const res = await axios.get(`${BASE_URL}/prospects/${leadId}`);
  return res.data;
};