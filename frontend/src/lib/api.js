import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function askQuestion(question) {
  try {
    const { data } = await axios.post(
      `${API}/answer`,
      { question },
      { timeout: 60000 }
    );
    return data;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("That took too long. Please try again.");
    }
    if (err.response?.status === 422) {
      throw new Error("Please enter a clear yes or no question.");
    }
    if (err.response?.data?.detail && typeof err.response.data.detail === "string") {
      throw new Error(err.response.data.detail);
    }
    throw new Error("Something went wrong. Try again.");
  }
}
