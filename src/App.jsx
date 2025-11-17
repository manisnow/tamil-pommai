import React, { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import AudioTest from './components/AudioTest';

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

 const startListening = async () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setMessage("உங்கள் உலாவியில் குரல் அடையாளம் (speech recognition) ஆதரவு இல்லை.");
    return;
  }

  // Request microphone permission first - some mobile browsers require getUserMedia to prompt permission.
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  } catch (err) {
    console.error('Microphone permission denied or error:', err);
    setMessage("மைக்ரோபோன் அனுமதி வழங்கப்படவில்லை. செயலியை பயன்படுத்த மைக்ரோபோன் அனுமதி தேவை.");
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = "ta-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setMessage("கேட்கப்படுகிறது... பேசவும்.");
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      console.log('speech result:', text);
      setMessage(`நீங்கள் சொன்னது: ${text}`);

      const allTriggers = commandMap
        .flatMap(cmd => cmd.triggers.map(trigger => ({ key: cmd.key, trigger })))
        .sort((a, b) => b.trigger.length - a.trigger.length);

      const found = allTriggers.find(item => text.includes(item.trigger));
      if (found) {
        setCurrent(found.key);
      } else {
        setMessage(`அறிய முடியவில்லை: ${text}`);
      }
    };

    recognition.onerror = (e) => {
      console.error('recognition error', e);
      setMessage("குரல் அடையாளத்தில் பிழை: " + (e.error || 'unknown'));
    };

    recognition.onend = () => {
      console.log('recognition ended');
      // Optionally restart automatically for continuous listening:
      // recognition.start();
      // Or update UI to allow user to start again
    };

    recognition.start();
  } catch (e) {
    console.error('Speech recognition init failed', e);
    setMessage("குரல் அடையாளத்தை துவங்க முடியவில்லை.");
  }
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
      <AudioTest />
    </div>
  );
}

export default App;
