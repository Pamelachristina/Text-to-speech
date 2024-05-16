import React, { useState, useEffect } from "react";

function TextList() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3005/getTexts") // Make sure the URL matches your server's address and port
      .then((response) => response.json())
      .then((data) => setTexts(data))
      .catch((error) => console.error("Error fetching texts:", error));
  }, []); // The empty array ensures this effect runs only once after the component mounts

  return (
    <div>
      <h1>Text and Audio Conversions</h1>
      <ul>
        {texts.map((text, index) => (
          <li key={index}>
            {text.text} - <a href={text.audio_url}>Listen</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TextList;
