import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "./axiosConfig";
import "./App.css";
import * as pdfjsLib from "pdfjs-dist/webpack";
import Header from "./Header";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./Dashboard";

function App() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [user, setUser] = useState(null);
  const audioRef = useRef(null);
  const highlightedTextRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axiosInstance
        .get("/user")
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch user data:", error);
          setIsLoggedIn(false); // Log out the user if fetching user data fails
        });
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      axiosInstance
        .get("/getTexts")
        .then((response) => {
          console.log("history data loaded:", response.data);
          setHistory(response.data);
        })
        .catch((error) => console.error("Failed to fetch history:", error));
    }
  }, [isLoggedIn]);

  const synthesizeText = () => {
    axiosInstance
      .post("/synthesize", { text })
      .then((response) => {
        console.log("Received response:", response.data);
        if (response.data.audioUrl) {
          setAudioUrl(response.data.audioUrl);
          setHistory((prevHistory) => [
            ...prevHistory,
            { text, audio_url: response.data.audioUrl },
          ]);
        } else {
          console.error("Audio URL is missing from the response");
        }
      })
      .catch((error) => {
        console.error(
          "Error processing your request:",
          error.response || error.request || error.message
        );
      });
  };

  const playAudio = () => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      setIsPlaying(true);
      audio
        .play()
        .then(() => {
          const words = text.split(" ");
          const duration = audio.duration * 1000; // in milliseconds
          const wordDuration = duration / words.length;

          words.forEach((word, index) => {
            setTimeout(() => {
              highlightText(index);
            }, index * wordDuration);
          });

          audio.onended = () => {
            setIsPlaying(false);
          };
        })
        .catch((e) => console.error("Error playing the audio:", e));
    } else {
      console.error("Audio source is not set or invalid");
    }
  };

  const highlightText = (wordIndex) => {
    const words = text.split(" ");
    const highlightedText = words
      .map((word, index) =>
        index <= wordIndex
          ? `<span style="background-color: yellow">${word}</span>`
          : word
      )
      .join(" ");
    if (highlightedTextRef.current) {
      highlightedTextRef.current.innerHTML = highlightedText;
    }
  };

  const clearHistory = () => {
    console.log("Clear history button clicked");
    axiosInstance
      .delete("/clearHistory")
      .then((response) => {
        console.log(response.data.message);
        setHistory([]);
      })
      .catch((error) => {
        console.error("Failed to clear history:", error);
      });
  };

  const saveHistory = () => {
    console.log("Save history button clicked");
    axiosInstance
      .post("/saveHistory", { history })
      .then((response) => {
        console.log(response.data.message);
      })
      .catch((error) => {
        console.error("Failed to save history:", error);
      });
  };

  const handleScroll = (event) => {
    console.log("Scrolling...");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let extractedText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const textItems = textContent.items;
          extractedText += textItems.map((item) => item.str).join(" ");
        }
        setText(extractedText);
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error("Please upload a valid PDF file.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
  };

  window.addEventListener("wheel", handleScroll, { passive: true });

  return (
    <>
      <Header />
      <div className="App">
        {isLoggedIn ? (
          <>
            <Dashboard user={user} onLogout={handleLogout} />
            <div className="content">
              {!isPlaying ? (
                <textarea
                  id="textArea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows="4"
                  cols="50"
                />
              ) : (
                <div
                  id="highlightedText"
                  ref={highlightedTextRef}
                  className="highlighted-text"
                ></div>
              )}
              <div className="button-container">
                <button onClick={synthesizeText}>Convert</button>
                <button onClick={playAudio}>Play Audio</button>
                <button onClick={saveHistory}>Save History</button>
                <button onClick={clearHistory}>Clear History</button>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
              />
              <audio ref={audioRef} controls src={audioUrl} />
              <div className="history-container">
                <h2>Conversion History</h2>
                {history.length > 0 && (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>Text</th>
                          <th>Audio Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item, index) => (
                          <tr key={index}>
                            <td>{item.text}</td>
                            <td>
                              <a href={item.audio_url}>Listen</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={clearHistory} className="clear-button">
                      Clear History
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : isRegistered ? (
          <LoginForm
            setIsLoggedIn={setIsLoggedIn}
            setIsRegistered={setIsRegistered}
          />
        ) : (
          <RegisterForm setIsRegistered={setIsRegistered} />
        )}
      </div>
    </>
  );
}

export default App;
