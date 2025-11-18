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

const commandMap = [
  { key: "sit", triggers: ["உக்காரு", "உட்காரு"] },
  { key: "walk", triggers: ["நட"] },
  { key: "dance", triggers: ["நடனமாடு"] },
  { key: "jump", triggers: ["குதி"] },
  { key: "run", triggers: ["ஓடு"] }
];

function App() {
  const container = useRef(null);
  const recognitionRef = useRef(null);
  const [message, setMessage] = useState("பேசுங்கள்… (Speak a command)");
  const [current, setCurrent] = useState("sit");
  const [isListening, setIsListening] = useState(false);

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

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition._keepListening = false;
      try { recognition.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setMessage("நிறுத்தப்பட்டது");
  };

  const startListening = async () => {
    if (isListening) return; // prevent double-start

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("உங்கள் உலாவியில் குரல் அடையாளம் ஆதரவு இல்லை. (Use Chrome on Android)");
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.error('Microphone permission error:', err);
      setMessage("மைக்ரோபோன் அனுமதி வழங்கப்படவில்லை.");
      return;
    }

    try {
      let recognition = recognitionRef.current;
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = "ta-IN";
        recognition.interimResults = true;
        recognition.continuous = false; // manual auto-restart implemented
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setMessage("கேட்கப்படுகிறது... பேசவும்.");
        };

        recognition.onresult = (event) => {
          const text = Array.from(event.results).map(r => r[0].transcript).join(" ");
          setMessage(`நீங்கள் சொன்னது: ${text}`);

          const allTriggers = commandMap
            .flatMap(cmd => cmd.triggers.map(trigger => ({ key: cmd.key, trigger })))
            .sort((a, b) => b.trigger.length - a.trigger.length);

          const found = allTriggers.find(item => text.includes(item.trigger));
          if (found) {
            setCurrent(found.key);
          } else {
            const last = event.results[event.results.length - 1];
            if (last && last.isFinal) setMessage(`அறிய முடியவில்லை: ${text}`);
          }
        };

        recognition.onerror = (e) => {
          console.error("recognition.onerror", e);
          setMessage("குரல் அடையாள பிழை: " + (e.error || "unknown"));
        };

        recognition.onend = () => {
          const r = recognitionRef.current;
          if (r && r._keepListening) {
            setTimeout(() => {
              try { r.start(); } catch (e) {
                console.error("Failed to restart recognition:", e);
                setIsListening(false);
                setMessage("குரல் அடையாளம் துவங்க முடியவில்லை.");
              }
            }, 300);
          } else {
            setIsListening(false);
            setMessage("நிறுத்தப்பட்டது");
          }
        };
      }

      recognition._keepListening = true;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Speech init failed", e);
      setMessage("குரல் அடையாளத்தை துவங்க முடியவில்லை.");
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      const r = recognitionRef.current;
      if (r) {
        try { r._keepListening = false; r.stop(); } catch(e) {}
      }
    };
  }, []);

  const commands = [
    "உக்காரு (Sit)",
    "நட (Walk)",
    "நடனமாடு (Dance)",
    "குதி (Jump)",
    "ஓடு (Run)",
    // Tamil numbers (will scroll with other commands)
    "ஒன்று (1)",
    "இரண்டு (2)",
    "மூன்று (3)",
    "நான்கு (4)",
    "ஐந்து (5)",
    "ஆறு (6)",
    "ஏழு (7)",
    "எட்டு (8)",
    "ஒன்பது (9)",
    "பத்து (10)"
  ];

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "Noto Sans Tamil, sans-serif",
      }}
    >
      {/* Scrolling commands */}
      <div style={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: "#f5f5f5",
        borderBottom: "2px solid #ffcc00",
        marginBottom: "20px",
        height: "40px",
        display: "flex",
        alignItems: "center"
      }}>
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "scroll-left 18s linear infinite",
            fontSize: "22px",
            color: "#333"
          }}
        >
          {commands.join("   |   ")}
        </div>
        {/* Keyframes for scrolling */}
        <style>
          {`
            @keyframes scroll-left {
              0% { transform: translateX(100%); }
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
        onClick={() => isListening ? stopListening() : startListening()}
        style={{
          fontSize: "20px",
          padding: "10px 20px",
          background: "#ffcc00",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        {isListening ? "⏹️ நிறுத்துங்கள்" : "🎤 பேச தொடங்குங்கள்"}
      </button>
      <p style={{ marginTop: "20px", fontSize: "18px" }}>{message}</p>

      <AudioTest />
    </div>
  );
}

export default App;
