import React, { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Helper function to set cookies
  const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration time
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  // Helper function to get cookies by name
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://dummyjson.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username, // Example: "kminchelle"
          password, // Example: "0lelplR"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in cookie (for example, for 1 day)
        setCookie("accessToken", data.accessToken, 1);
        setIsLoggedIn(true);
        alert("Login successful! Access token stored in cookies.");
      } else {
        // Handle invalid credentials or server errors
        alert(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  const handlePostRequest = async () => {
    const accessToken = getCookie("accessToken");
  
    if (!accessToken) {
      alert("You are not logged in. Please log in first.");
      return;
    }
  
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Pass token in request headers (for real API)
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({
          userId: 1,
          title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
          body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert("POST request successful! Data received: " + JSON.stringify(data));
      } else {
        alert("POST request failed.");
      }
    } catch (error) {
      alert("An error occurred during the POST request.");
    }
  };
  
  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {isLoggedIn && (
        <div>
          <button onClick={handlePostRequest}>
            Make POST request with Access Token
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;
