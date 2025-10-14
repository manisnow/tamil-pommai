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

// Map animation keys to only Tamil trigger words
const commandMap = [
  { key: "sit", triggers: ["உக்காரு", "உட்காரு"] },
  { key: "walk", triggers: ["நட"] },
  { key: "dance", triggers: ["நடனமாடு"] },
  { key: "jump", triggers: ["குதி"] },
  { key: "run", triggers: ["ஓடு"] }
];

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

     // Flatten all triggers with their keys, sort by trigger length descending
    const allTriggers = commandMap
      .flatMap(cmd => cmd.triggers.map(trigger => ({ key: cmd.key, trigger })))
      .sort((a, b) => b.trigger.length - a.trigger.length);

    // Find the first matching trigger
    const found = allTriggers.find(item => text.includes(item.trigger));
      if (found) {
        setCurrent(found.key);
      } else {
        setMessage(`அறிய முடியவில்லை: ${text}`);
      }
  };
};


  // Generate scrolling text from all triggers in commandMap
  const scrollingText = commandMap
    .map(cmd => cmd.triggers.join(" / "))
    .join("   |   ");
  return (
    <div
    style={{
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "Noto Sans Tamil, sans-serif",
        boxSizing: "border-box",
        maxWidth: "100vw",
        overflowX: "hidden"
      }}
    >
        {/* Scrolling commands */}
      <div style={{
        width: "100vw",
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "#f5f5f5",
        borderBottom: "2px solid #ffcc00",
        marginBottom: "20px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        position: "relative"
      }}>
 <div
          style={{
            display: "inline-block",
            minWidth: "100vw",
            animation: "scroll-left 15s linear infinite",
            fontSize: "22px",
            color: "#333"
          }}
        >
          {scrollingText}
        </div>
        {/* Keyframes for scrolling */}
        <style>
          {`
            @keyframes scroll-left {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100%); }
            }
          `}
        </style>
      </div>
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
