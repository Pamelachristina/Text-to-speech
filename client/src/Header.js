import React from "react";
import "./Header.css";
import logo from "./App.png"; // Ensure you have a logo image file in your project

const Header = () => {
  return (
    <header className="app-header">
      <div className="logo-container">
        <img src={logo} alt="App Logo" className="logo" />
        <h1>Text to Speech Application</h1>
      </div>
      <div className="header-graphics">
        {/* Add any modern graphics or SVGs here */}
      </div>
    </header>
  );
};

export default Header;
