import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";

const base = "/tamil-pommai/";
const animations = {
  sit: base + "sit.json",
  walk: base + "walk.json",
  dance: base + "dance.json",
  jump: base + "jump.json",
  run: base + "run1.json"
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
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setMessage("உங்கள் உலாவியில் (browser) குரல் அடையாளம் (speech recognition) ஆதரவு இல்லை.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ta-IN";
  recognition.start();

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    setMessage(`நீங்கள் சொன்னது: ${text}`);

    if (text.includes("உக்காரு")) setCurrent("sit");
    else if (text.includes("நட")) setCurrent("walk");
    else if (text.includes("ஆடு")) setCurrent("dance");
    else if (text.includes("குதி")) setCurrent("jump");
     else if (text.includes("ஓடு")) setCurrent("run");
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
