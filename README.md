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
2. Upload a PDF file.
3. Click the play button to start the text-to-speech conversion with highlighted text.

## Project Structure
