# VocalizeIT
# Text-to-Speech Application

## Description
A text-to-speech application that converts text from uploaded PDF files into audible speech. This project includes a frontend built with React and a backend using Node.js, running inside a Docker container.

## Features
- **Text Extraction**: Upload PDF files and extract text.
- **Text-to-Speech**: Convert extracted text to speech.
- **Highlighted Text**: Highlight text as it is read aloud.
- **Modern UI**: Multi-color gradient background.

## Installation

### Prerequisites
- Node.js
- Docker

### Steps
1. Clone the repository:
    ```bash
    git clone https://github.com/Pamelachristina/Text-to-speech.git
    cd Text-to-speech
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Set up environment variables by creating a `.env` file based on the `.env.example`.

4. Build and start the Docker containers:
    ```bash
    docker-compose up --build
    ```

## Usage
1. Navigate to `http://localhost:3000` in your browser.
2. Create a username and password.
3. Log in.
4. Upload a PDF file.
5. Click the play button to start the text-to-speech conversion with highlighted text.

## Design and Algorithm Description
## Algorithms and Data Structures
Text Extraction Algorithm:

Description: Responsible for extracting text from uploaded PDF files.
Implementation: Utilizes the pdf.js library to read the contents of the PDF and extract text in a structured manner.

## Text-to-Speech Conversion Algorithm:

Description: Converts the extracted text into speech using the Resemble.ai API.
Implementation: Uses asynchronous requests to the Resemble.ai API for text-to-speech conversion and manages the playback of the audio response.

## Highlighting Algorithm:

Description: Synchronizes the highlighting of text with the spoken words.
Implementation: Uses JavaScript in the frontend to dynamically highlight each word as it is spoken.

## User Authentication Algorithm:

Description: Handles user registration and login, including password hashing and JWT token generation.
Implementation: Uses bcrypt for password hashing and jsonwebtoken for generating and verifying JWT tokens.

## Classes and Structures
## TextExtractor Class:

Methods: extractText(filePath)
Description: Contains methods for extracting text from PDF files using pdf.js.

## TTSConverter Class:

Methods: convertTextToSpeech(text)
Description: Converts text to speech using the Resemble.ai API.

## Database Class:

Methods: storeUserCredentials(username, password), validateUser(username, password), saveText(text, audioUrl), clearHistory(), saveHistory(history), getTexts()
Description: Handles user authentication and data storage using PostgreSQL and bcrypt for password hashing.

## Limiter Class:

Methods: schedule(fn)
Description: Manages API request rate limiting using Bottleneck.

## Authentication Middleware:

Methods: authenticateJWT(req, res, next)
Description: Middleware to authenticate requests using JWT tokens.

## User Interface (UI) Components:

Description: React components responsible for rendering the user interface, including file upload, text display, and control buttons.

## User Interface (UI) Description
## User Guide

## Main Screen:

- **File Upload**: Users can upload PDF files by clicking the "Upload PDF" button.
- **Text Display Area**: Displays the extracted text from the uploaded PDF.
- **Control Buttons**: Includes buttons for play, pause, and stop functionality.

## Highlighting Feature:

Description: The text is highlighted word by word as it is spoken, providing a visual aid for users to follow along.

## User Instructions

Uploading a PDF:

Click on the "Upload PDF" button.
Select the desired PDF file from your device.
Converting Text to Speech:

Once the text is displayed, click the "Play" button to start the text-to-speech conversion.
The text will be highlighted as it is spoken.

## Control Playback:

Use the "Pause" button to pause the speech.
Use the "Stop" button to stop the speech and reset the text highlighting.

## User Authentication:

- **Sign Up**: Enter a username and password to create an account.
- **Login**: Enter your credentials to access the application.


## Program Listing: Server.js

```javascript
const express = require("express");
const { Pool } = require("pg");
const { Resemble } = require("@resemble/node");
const Bottleneck = require("bottleneck");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// Database setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
app.use(express.json());
app.use(require("cors")());

// Resemble.ai setup
Resemble.setApiKey(process.env.RESEMBLE_TOKEN);

// Bottleneck rate limiter setup
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 25,
});

// Function to handle creation of clips via Resemble.ai
const createClip = async (projectUuid, text, voiceUuid) => {
  return await Resemble.v2.clips.createAsync(projectUuid, {
    body: text,
    voice_uuid: voiceUuid,
    callback_url: "http://localhost:3001/synthesize",
  });
};

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Route to save synthesized text and audio URL to PostgreSQL
app.post("/saveText", authenticateJWT, async (req, res) => {
  const { text, audioUrl } = req.body;
  const userId = req.user.userId;
  try {
    const query = "INSERT INTO conversions (user_id, text, audio_url) VALUES ($1, $2, $3)";
    await pool.query(query, [userId, text, audioUrl]);
    res.status(201).send("Text and audio URL saved!");
  } catch (error) {
    console.error("Failed to save text and audio URL:", error);
    res.status(500).send("Failed to save text and audio URL");
  }
});

// Other routes...

const PORT = process.env.PORT || 3005;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
