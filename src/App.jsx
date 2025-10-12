import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";

const animations = {
  sit: "/sit.json",
  walk: "/walk.json",
  dance: "/dance.json",
  jump: "/jump.json",
};

function App() {
  const container = useRef(null);
  const [message, setMessage] = useState("பேசுங்கள்… (Speak a command)");
  const [current, setCurrent] = useState("sit");

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: container.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: animations[current],
    });
    return () => anim.destroy();
  }, [current]);

  const startListening = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "ta-IN";
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      setMessage(`நீங்கள் சொன்னது: ${text}`);

      if (text.includes("உக்காரு")) setCurrent("sit");
      else if (text.includes("நட")) setCurrent("walk");
      else if (text.includes("ஆடு")) setCurrent("dance");
      else if (text.includes("குதி")) setCurrent("jump");
      else setMessage(`அறிய முடியவில்லை: ${text}`);
    };
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "Noto Sans Tamil, sans-serif",
      }}
    >
      <h1>தமிழ் பொம்மை விளையாட்டு 🎭</h1>
      <div
        ref={container}
        style={{ width: 300, height: 300, margin: "auto" }}
      ></div>
      <button
        onClick={startListening}
        style={{
          fontSize: "20px",
          padding: "10px 20px",
          background: "#ffcc00",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        🎤 பேச தொடங்குங்கள்
      </button>
      <p style={{ marginTop: "20px", fontSize: "18px" }}>{message}</p>
    </div>
  );
}

export default App;
