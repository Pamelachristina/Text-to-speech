import React, { useState } from "react";
import axiosInstance from "./axiosConfig";
import "./RegisterForm.css";

const RegisterForm = ({ setIsRegistered }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.post("/register", {
        username,
        password,
      });
      setIsRegistered(true); // Redirect to login form
    } catch (error) {
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
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
          <button type="submit">Sign Up</button>
          <button type="button" onClick={() => setIsRegistered(true)}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
