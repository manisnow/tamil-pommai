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

// add near top of file inside component (or above)
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsWord = (text, token) => {
  // match token as whole word or as substring fallback
  try {
    const rx = new RegExp(`(^|\\s|[^\\p{L}])${escapeRegExp(token)}($|\\s|[^\\p{L}])`, 'u');
    return rx.test(text) || text.includes(token);
  } catch {
    return text.includes(token);
  }
};

// extended Tamil number words (add variants)
const numberWords = {
  "ஒன்று": 1, "ஒரு": 1, "ஒன்னு": 1,
  "இரண்டு": 2, "ரண்டு": 2,
  "மூன்று": 3, "மூன்னு": 3,
  "நான்கு": 4, "நாலு": 4,
  "ஐந்து": 5, "ஐந்த": 5,
  "ஆறு": 6,
  "ஏழு": 7, "எழு": 7,
  "எட்ட": 8, "எட்டு": 8,
  "ஒன்பது": 9, "ஒன்பத": 9,
  "பத்து": 10, "பத்த": 10
};

// detect latin digits or tamil digits
const detectDigit = (text) => {
  const m = text.match(/\b([1-9]|10)\b/);
  if (m) return Number(m[1]);
  const m2 = text.match(/[\u0BE6-\u0BEF]/u); // Tamil digits
  if (m2) {
    const digit = m2[0].codePointAt(0) - 0x0BE6; // convert to 0..9
    return digit;
  }
  return null;
};

function App() {
  const container = useRef(null);
  const numbersContainer = useRef(null);
  const numbersAnimRef = useRef(null);
  const recognitionRef = useRef(null);
  const [message, setMessage] = useState("பேசுங்கள்… (Speak a command)");
  const [current, setCurrent] = useState("sit");
  const [isListening, setIsListening] = useState(false);
  const [numbersLoaded, setNumbersLoaded] = useState(false);

  // load numbers lottie (public/numbers-1-to-10.json) with robust error handling
  useEffect(() => {
    if (!numbersContainer.current) return;
    const baseUrl = import.meta.env.BASE_URL || '/tamil-pommai/';
    const jsonPath = `${baseUrl}numbers-1-to-10.json`;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`Failed to fetch ${jsonPath}: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;

        // Basic validation to avoid lottie parse errors
        const isValidLottie = data && Array.isArray(data.layers) && data.layers.length > 0 && typeof data.fr === 'number';
        if (!isValidLottie) {
          console.error('Invalid Lottie JSON (missing layers/fr). Skipping load:', data);
          setNumbersLoaded(false);
          return;
        }

        // load from animationData (avoid path resolution issues) and guard errors
        try {
          numbersAnimRef.current = lottie.loadAnimation({
            container: numbersContainer.current,
            renderer: "svg",
            loop: false,
            autoplay: false,
            animationData: data
          });
          setNumbersLoaded(true);
        } catch (innerErr) {
          console.error('lottie.loadAnimation threw:', innerErr);
          setNumbersLoaded(false);
        }
      } catch (err) {
        console.error('Numbers animation load failed:', err);
        setNumbersLoaded(false);
      }
    })();
    return () => {
      mounted = false;
      if (numbersAnimRef.current) {
        try { numbersAnimRef.current.destroy(); } catch(e) {}
      }
    };
  }, []);

  // show number 1..10 (lottie if available, else DOM fallback)
  const showNumber = (n) => {
    const anim = numbersAnimRef.current;
    if (anim && typeof anim.goToAndStop === 'function') {
      const idx = Math.max(1, Math.min(10, n)) - 1; // 0..9
      const frame = idx * 30;
      try {
        anim.goToAndStop(frame, true);
        anim.play();
        setTimeout(() => { try { anim.pause(); } catch(e){} }, 800);
        return;
      } catch (e) {
        console.warn("showNumber lottie failed", e);
        // fall through to DOM fallback
      }
    }

    // DOM fallback: create big number, animate via CSS, auto-remove
    try {
      const containerEl = numbersContainer.current;
      if (!containerEl) return;
      // remove existing fallback if any
      const prev = containerEl.querySelector('.num-fallback');
      if (prev) prev.remove();

      const el = document.createElement('div');
      el.className = 'num-fallback';
      el.textContent = String(n);
      Object.assign(el.style, {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
        fontWeight: '700',
        color: '#222',
        background: 'transparent',
        transform: 'scale(0.6)',
        opacity: '0',
        transition: 'transform 220ms ease, opacity 220ms ease'
      });
      containerEl.appendChild(el);
      // trigger animation
      requestAnimationFrame(() => {
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
      });
      setTimeout(() => {
        el.style.transform = 'scale(0.6)';
        el.style.opacity = '0';
        setTimeout(() => { try { el.remove(); } catch(e){} }, 300);
      }, 900);
    } catch (e) {
      console.error('number fallback failed', e);
    }
  };

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
          let text = Array.from(event.results).map(r => r[0].transcript).join(" ").trim();
          text = text.replace(/\s+/g, " ").toLowerCase();
          setMessage(`நீங்கள் சொன்னது: ${text}`);

          // 1) check numeric digits first (easy)
          const d = detectDigit(text);
          if (d && d >= 1 && d <= 10) {
            showNumber(d);
            return;
          }

          // 2) check tamil number words
          for (const [w, n] of Object.entries(numberWords)) {
            if (containsWord(text, w)) { showNumber(n); return; }
          }

          // 3) command triggers (prefer longer triggers)
          const allTriggers = commandMap
            .flatMap(cmd => cmd.triggers.map(trigger => ({ key: cmd.key, trigger })))
            .sort((a, b) => b.trigger.length - a.trigger.length);

          for (const item of allTriggers) {
            if (containsWord(text, item.trigger)) {
              setCurrent(item.key);
              return;
            }
          }

          // fallback: final result not recognized
          const last = event.results[event.results.length - 1];
          if (last && last.isFinal) setMessage(`அறிய முடியவில்லை: ${text}`);
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
    "1 (One)",
    "2 (Two)",
    "3 (Three)",
    "4 (Four)",
    "5 (Five)",
    "6 (Six)",
    "7 (Seven)",
    "8 (Eight)",
    "9 (Nine)",
    "10 (Ten)"
  ];

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "50px",
        fontFamily: "Noto Sans Tamil, sans-serif",
      }}
    >
      {/* numbers display area */}
      <div style={{ width: 120, height: 120, margin: "10px auto" }} ref={numbersContainer}></div>
      {/* Scrolling commands (fixed: inner is absolutely positioned so it won't expand page width) */}
      <div style={{
        width: "100%",
        overflow: "hidden",
        background: "#f5f5f5",
        borderBottom: "2px solid #ffcc00",
        marginBottom: "20px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        position: "relative" // <-- required for absolute child
      }}>
        <div
          style={{
            position: "absolute",      // prevent affecting layout / page width
            left: 0,
            whiteSpace: "nowrap",
            transform: "translateX(100%)", // start off-screen right
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
              0%   { transform: translateX(100%); }  /* start off-screen right */
              100% { transform: translateX(-100%); } /* move fully off-screen left */
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
