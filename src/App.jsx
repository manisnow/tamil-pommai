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
  const recognitionRef = useRef(null); // <-- added
  const [message, setMessage] = useState("பேசுங்கள்… (Speak a command)");
  const [current, setCurrent] = useState("sit");

  // NEW state: track whether we are actively listening (for toggle/stop)
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
      // prevent auto-restart and stop current recognition
      recognition._keepListening = false;
      try { recognition.stop(); } catch(e) { /* ignore */ }
    }
    setIsListening(false);
    setMessage("நிறுத்தப்பட்டது");
  };

  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("உங்கள் உலாவியில் குரல் அடையாளம் ஆதரவு இல்லை. (Use Chrome on Android)");
      return;
    }

    // prompt mic permission
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
      // reuse existing recognition if present
      let recognition = recognitionRef.current;
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = "ta-IN";
        recognition.interimResults = true;    // helps debug / get partials
        recognition.continuous = false;       // keep false but auto-restart manually
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setMessage("கேட்கப்படுகிறது... பேசவும்.");
          console.log("recognition.onstart");
        };

        recognition.onresult = (event) => {
          const text = Array.from(event.results).map(r => r[0].transcript).join(" ");
          console.log("recognition.onresult:", event, text);
          setMessage(`நீங்கள் சொன்னது: ${text}`);

          const allTriggers = commandMap
            .flatMap(cmd => cmd.triggers.map(trigger => ({ key: cmd.key, trigger })))
            .sort((a, b) => b.trigger.length - a.trigger.length);

          const found = allTriggers.find(item => text.includes(item.trigger));
          if (found) {
            setCurrent(found.key);
          } else {
            if (event.resultIndex === event.results.length - 1 && event.results[0].isFinal) {
              setMessage(`அறிய முடியவில்லை: ${text}`);
            }
          }
        };

        recognition.onerror = (e) => {
          console.error("recognition.onerror", e);
          setMessage("குரல் அடையாள பிழை: " + (e.error || "unknown"));
        };

        recognition.onend = () => {
          console.log("recognition.onend");
          // Automatic restart logic: only restart if _keepListening flag is true
          const r = recognitionRef.current;
          if (r && r._keepListening) {
            // small delay to avoid tight restart loops on persistent errors
            setTimeout(() => {
              try {
                r.start();
              } catch (e) {
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

      // enable auto-restart and start recognition
      recognition._keepListening = true;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Speech init failed", e);
      setMessage("குரல் அடையாளத்தை துவங்க முடியவில்லை.");
    }
  };
