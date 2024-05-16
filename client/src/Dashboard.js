import React from "react";
import "./Dashboard.css";

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard">
      <h2>Welcome, {user?.username}!</h2>
      <button onClick={onLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
