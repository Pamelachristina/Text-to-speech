import React, { useState } from "react";
import axiosInstance from "./axiosConfig";
import "./LoginForm.css";

const LoginForm = ({ setIsLoggedIn, setIsRegistered }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axiosInstance.post("/login", {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      setIsLoggedIn(true);
    } catch (error) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <div className="button-container">
          <button type="submit">Login</button>
          <button type="button" onClick={() => setIsRegistered(false)}>
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
