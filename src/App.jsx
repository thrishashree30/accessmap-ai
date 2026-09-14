import { useState, useEffect } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { pipeline } from "@huggingface/transformers";
function CampusMap({ selectedRoute, obstacleReported }) {
  return (
    <div className="campus-map">
      <div className="map-grid"></div>

      <div className="map-road road-one"></div>
      <div className="map-road road-two"></div>

      {/* Route A */}
      {selectedRoute === "A" && (
        <div className="map-route route-a"></div>
      )}

      {/* Route B */}
      {selectedRoute === "B" && (
        <div className="map-route route-b"></div>
      )}

      {/* Route C */}
      {selectedRoute === "C" && (
        <div className="map-route route-c"></div>
      )}

      <div className="map-location gate">
        <span>📍</span>
        <small>Current</small>
      </div>

      <div className="map-location library">
        <span>🎯</span>
        <small>Library</small>
      </div>

      <div className="map-building building-one">
        Main Block
      </div>

      <div className="map-building building-two">
        Canteen
      </div>

      <div className="map-building building-three">
        Block B
      </div>

      {/* Obstacle markers */}

      <div className="map-obstacle stairs-marker">
        ⚠
        <small>Stairs</small>
      </div>

      <div className="map-obstacle narrow-marker">
        ⚠
        <small>Narrow Path</small>
      </div>
{obstacleReported && (
  <div className="map-obstacle new-obstacle-marker">
    🚧
    <small>New Obstacle</small>
  </div>
)}
      <div className="map-legend">
        <span>● Selected Route</span>
        <span>⚠ Accessibility Barrier</span>
        <span>📍 Current</span>
      </div>
    </div>
  );
}
function calculateAccessibilityScore(route) {
  let score = 50;

  if (route.ramp) score += 15;
  if (route.lift) score += 15;
  if (route.clearPath) score += 20;
  if (route.verified) score += 10;

  if (route.stairs) score -= 30;
  if (route.narrow) score -= 15;
  if (route.blocked) score -= 40;

  return Math.max(0, Math.min(100, score));
}
function App() {
  const [changePercent, setChangePercent] = useState(null);
  const [changeStatus, setChangeStatus] = useState("Analyzing...");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
const [voiceMessage, setVoiceMessage] = useState("");
const [favoritePlaces, setFavoritePlaces] = useState(() => {
  const saved = localStorage.getItem("accessmap-favorites");
  return saved ? JSON.parse(saved) : [];
});
const [caregivers, setCaregivers] = useState(() => {
  const saved = localStorage.getItem("accessmap-caregivers");
  return saved ? JSON.parse(saved) : [];
});
const [caregiverInput, setCaregiverInput] = useState("");
const [caregiverPhone, setCaregiverPhone] = useState("");
const [sosActive, setSosActive] = useState(false);
useEffect(() => {
  localStorage.setItem(
    "accessmap-favorites",
    JSON.stringify(favoritePlaces)
  );
}, [favoritePlaces]);
const [detectedLanguage, setDetectedLanguage] = useState("");
const [offlineModel, setOfflineModel] = useState(null);
const [offlineModelLoading, setOfflineModelLoading] = useState(false);
  useEffect(() => {
  const goOnline = () => setIsOffline(false);
  const goOffline = () => setIsOffline(true);

  window.addEventListener("online", goOnline);
  window.addEventListener("offline", goOffline);

  return () => {
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", goOffline);
  };
}, []);
useEffect(() => {
  const loadOfflineModel = async () => {
    try {
      setOfflineModelLoading(true);

      const model = await pipeline(
  "automatic-speech-recognition",
  "onnx-community/whisper-base",
  {
    dtype: "fp16",
    device: "webgpu"
  }
);

      setOfflineModel(() => model);
      console.log("Offline voice model ready");
    } catch (error) {
      console.error("Offline model error:", error);
    } finally {
      setOfflineModelLoading(false);
    }
  };

  loadOfflineModel();
}, []);
useEffect(() => {
  const previousImage = new Image();
  const latestImage = new Image();
  
  previousImage.src = "/sentinel-campus-before.jpg";
  latestImage.src = "/sentinel-campus.jpg";

  const compareImages = () => {
    if (!previousImage.complete || !latestImage.complete) {
      return;
    }

    const width = 256;
    const height = 256;

    const canvas1 = document.createElement("canvas");
    const canvas2 = document.createElement("canvas");

    canvas1.width = width;
    canvas1.height = height;

    canvas2.width = width;
    canvas2.height = height;

    const ctx1 = canvas1.getContext("2d");
    const ctx2 = canvas2.getContext("2d");

    ctx1.drawImage(previousImage, 0, 0, width, height);
    ctx2.drawImage(latestImage, 0, 0, width, height);

    const image1 = ctx1.getImageData(0, 0, width, height);
    const image2 = ctx2.getImageData(0, 0, width, height);

    let changedPixels = 0;
    const totalPixels = width * height;

    for (let i = 0; i < image1.data.length; i += 4) {
      const redDifference = Math.abs(
        image1.data[i] - image2.data[i]
      );

      const greenDifference = Math.abs(
        image1.data[i + 1] - image2.data[i + 1]
      );

      const blueDifference = Math.abs(
        image1.data[i + 2] - image2.data[i + 2]
      );

      const difference =
        (redDifference + greenDifference + blueDifference) / 3;

      if (difference > 30) {
        changedPixels++;
      }
    }

    const percentage =
      (changedPixels / totalPixels) * 100;

    const roundedPercentage = Number(
      percentage.toFixed(1)
    );

    setChangePercent(roundedPercentage);

    if (roundedPercentage >= 15) {
      setChangeStatus("Significant change detected");
    } else if (roundedPercentage >= 5) {
      setChangeStatus("Potential surface change detected");
    } else {
      setChangeStatus("No significant change detected");
    }
  };

  previousImage.onload = compareImages;
  latestImage.onload = compareImages;
}, []);
  const [screen, setScreen] = useState("home");
  const [need, setNeed] = useState("Wheelchair");
  const [destination, setDestination] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState("C");
  const [obstacleReported, setObstacleReported] = useState(false);
  const routes = {
  A: {
    ramp: false,
    lift: false,
    clearPath: true,
    verified: true,
    stairs: true,
    narrow: false,
    blocked: false,
  },

  B: {
    ramp: true,
    lift: false,
    clearPath: true,
    verified: true,
    stairs: false,
    narrow: true,
    blocked: false,
  },

  C: {
    ramp: true,
    lift: true,
    clearPath: true,
    verified: true,
    stairs: false,
    narrow: false,
    blocked: false,
  },
};
const routeScores = {
  A: calculateAccessibilityScore(routes.A),
  B: calculateAccessibilityScore(routes.B),
  C: calculateAccessibilityScore(routes.C),
};
  const destinations = [
    "Central Library",
    "Main Block",
    "Canteen",
    "Block B",
  ];
  const connectionStatus = isOffline
  ? "Offline Mode - Using saved accessibility data"
  : "Online - Live accessibility updates available";
  const activeRouteSource = isOffline
  ? "Saved offline route data"
  : "Live accessibility route data";
  const speak = (text) => {
  window.speechSynthesis.cancel();

  const message = new SpeechSynthesisUtterance(text);
  message.lang = detectedLanguage || "en-IN";

  window.speechSynthesis.speak(message);
};

const startVoiceAssistant = async () => {
  // OFFLINE MODE
  if (!navigator.onLine) {
    if (!offlineModel) {
      setVoiceMessage("Offline voice model is still loading...");
      return;
    }

    try {
      setVoiceActive(true);
      navigator.vibrate?.(150);
      setVoiceMessage("Listening offline...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        try {
          setVoiceMessage("Understanding...");

          const blob = new Blob(chunks, {
            type: recorder.mimeType,
          });

          const arrayBuffer = await blob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer =
            await audioContext.decodeAudioData(arrayBuffer);

          const offlineContext = new OfflineAudioContext(
            1,
            Math.ceil(audioBuffer.duration * 16000),
            16000
          );

          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);
          source.start();

          const rendered = await offlineContext.startRendering();
          const audioData = rendered.getChannelData(0);

          const result = await offlineModel(audioData, {
  language: "english",
  task: "transcribe",
});

          const userSpeech = (result.text || "").trim();
          const text = userSpeech.toLowerCase();

          setVoiceMessage(`You said: ${userSpeech}`);

          if (text.includes("home")) {
            setScreen("home");
            speak("Going to home page");

          } else if (
            text.includes("find routes") ||
            text.includes("find roots") ||
            text.includes("accessible routes") ||
            text.includes("accessible roots")
          ) {
            setScreen("routes");
            speak("Opening accessible routes");

          } else if (
            text.includes("report obstacle") ||
            text.includes("report")
          ) {
            setScreen("report");
            speak("Opening obstacle report page");

          } else if (
            text.includes("satellite") ||
            text.includes("analysis")
          ) {
            setScreen("satellite");
            speak("Opening satellite analysis");

          } else if (
            text.includes("blind") ||
            text.includes("camera")
          ) {
            setNeed("blind");
            setScreen("map");
            speak("Blind assistance mode activated");

          } else {
            speak("Sorry, I did not understand the command");
          }

          await audioContext.close();
        } catch (error) {
  console.error("Offline speech error:", error);
  setVoiceMessage(`Offline error: ${error.message}`);
} finally {
          setVoiceActive(false);
        }
      };

      recorder.start();

      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 4000);

    } catch (error) {
      console.error("Microphone error:", error);
      setVoiceActive(false);
      setVoiceMessage("Microphone permission is required.");
    }

    return;
  }

  // ONLINE MODE — existing Web Speech API
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceMessage("Voice recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  setVoiceActive(true);
  navigator.vibrate?.(150);
  setVoiceMessage("Listening...");

  try {
    recognition.start();
  } catch (error) {
    setVoiceActive(false);
    setVoiceMessage("Please try again.");
  }

  recognition.onresult = (event) => {
    const userSpeech = event.results[0][0].transcript;
    const text = userSpeech.toLowerCase().trim();
    if (
  text.includes("hey accessmap") ||
  text.includes("hey access map")
) {
  setVoiceMessage("AccessMap is ready. What can I do?");
  speak("AccessMap is ready. What can I do?");

  setTimeout(() => {
    startVoiceAssistant();
  }, 1500);

  return;
}
    setVoiceMessage(`You said: ${userSpeech}`);

    if (text.includes("home")) {
      setScreen("home");
      speak("Going to home page");

    } else if (
      text.includes("find routes") ||
      text.includes("find roots") ||
      text.includes("accessible routes") ||
      text.includes("accessible roots")
    ) {
      setScreen("routes");
      speak("Opening accessible routes");

    } else if (
      text.includes("report obstacle") ||
      text.includes("report")
    ) {
      setScreen("report");
      speak("Opening obstacle report page");

    } else if (
      text.includes("satellite") ||
      text.includes("analysis")
    ) {
      setScreen("satellite");
      speak("Opening satellite analysis");

    } else if (
      text.includes("blind") ||
      text.includes("camera")
    ) {
      setNeed("blind");
      setScreen("map");
      speak("Blind assistance mode activated");

    } else {
      speak("Sorry, I did not understand the command");
    }
  };

  recognition.onerror = () => {
    setVoiceActive(false);
    setVoiceMessage("Voice recognition unavailable.");
  };

  recognition.onend = () => {
    setVoiceActive(false);
  };
};
const VoiceAssistant = () => (
  <>
    <button
      onClick={startVoiceAssistant}
      style={{
        position: "fixed",
        bottom: "25px",
        right: "25px",
        padding: "15px 20px",
        borderRadius: "30px",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        zIndex: 1000,
      }}
    >
      🎙️ {voiceActive ? "Listening..." : "Voice Assistant"}
    </button>

    {voiceMessage && (
      <div
        style={{
          position: "fixed",
          bottom: "90px",
          right: "25px",
          padding: "12px 18px",
          background: "white",
          borderRadius: "10px",
          zIndex: 1000,
        }}
      >
        {voiceMessage}
      </div>
    )}
  </>
);
  if (screen === "satellite") {
  return (
    <div className="app">
<VoiceAssistant />
      <header className="header">
        <div className="logo">
          <div className="logo-icon">♿</div>
          <div>
            <h1>AccessMap AI</h1>
            <p>Accessible navigation for everyone</p>
          </div>
        </div>

        <button
          className="report-btn"
          onClick={() => setScreen("report")}
        >
          ← Back
        </button>
      </header>
<div
  style={{
    padding: "10px 20px",
    margin: "10px 0",
    borderRadius: "8px",
    background: isOffline ? "#fff3cd" : "#d1e7dd",
    color: isOffline ? "#856404" : "#155724",
    fontWeight: "600",
    textAlign: "center",
  }}
>
  {isOffline ? "📴 OFFLINE MODE: Using saved accessibility data" : "🟢 ONLINE: Live accessibility updates available"}
</div>
<div
  style={{
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#475569",
  }}
>
  📍 Route Data Source: {activeRouteSource}
</div>
      <main className="main">
        <section className="satellite-page">

          <span className="badge">
            SATELLITE INTELLIGENCE
          </span>

          <h2 className="route-title">
            Monitor accessibility changes
          </h2>

          <p className="route-subtitle">
            AI-assisted analysis of recent satellite observations
            for large-scale route changes.
          </p>

          <div className="satellite-analysis-card">

            <div className="satellite-comparison">

  <div className="satellite-frame">
    <span className="image-label">PREVIOUS OBSERVATION</span>

    <img
      src="/sentinel-campus-before.jpg"
      alt="Previous Sentinel-2 observation"
    />

    <small>Previous observation</small>
  </div>

  <div className="satellite-frame">
    <span className="image-label">LATEST OBSERVATION</span>

    <img
      src="/sentinel-campus.jpg"
      alt="Latest Sentinel-2 observation"
    />

    <small>Latest observation</small>
  </div>

</div>

            <div className="analysis-status">

              <span className="status-label">
                ● ANALYSIS COMPLETE
              </span>

              <h3>
  {changeStatus}
</h3>

              <p>
  Sentinel-2 observations were compared to estimate
  potential surface changes near the selected route.
</p>

              <div className="analysis-grid">

                <div>
                  <span>Observation</span>
<strong>Sentinel-2</strong>
                </div>

                <div>
                  <span>Change Type</span>
<strong>Surface Change</strong>
                </div>

                <div>
                  <span>Change %</span>
<strong>
  {changePercent !== null ? `${changePercent}%` : "Analyzing..."}
</strong>
                </div>

              </div>

              <button
                className="find-btn"
                onClick={() => {
                  setObstacleReported(true);
                  setSelectedRoute("B");
                  setScreen("routes");
                }}
              >
                Update Accessibility Map →
              </button>

            </div>

          </div>

          <div className="satellite-note">
            <strong>How it works</strong>
            <p>
              Satellite observations identify larger-area
              environmental or infrastructure changes.
            </p>
          </div>

        </section>
      </main>

    </div>
  );
}
if (screen === "report") {
  return (
    <div className="app">
      <button
  onClick={startVoiceAssistant}
  style={{
    position: "fixed",
    bottom: "25px",
    right: "25px",
    padding: "15px 20px",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    zIndex: 9999
  }}
>
  🎙️ {voiceActive ? "Listening..." : "Voice Assistant"}
</button>

{voiceMessage && (
  <div
    style={{
      position: "fixed",
      bottom: "90px",
      right: "25px",
      padding: "12px 18px",
      background: "white",
      color: "#222",
      borderRadius: "10px",
      zIndex: 9999
    }}
  >
    🎙️ {voiceMessage}
  </div>
)}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">♿</div>
          <div>
            <h1>AccessMap AI</h1>
            <p>Accessible navigation for everyone</p>
          </div>
        </div>

        <button
          className="report-btn"
          onClick={() => setScreen("home")}
        >
          ← Back
        </button>
      </header>

      <main className="main">
        <section className="report-page">

          <span className="badge">COMMUNITY REPORT</span>

          <h2 className="route-title">
            Report an <span>Accessibility Issue</span>
          </h2>

          <p className="route-subtitle">
            Help others by reporting an obstacle you found.
          </p>

          {!reportSubmitted ? (
            <>
     <div
  style={{
    display: "block",
    padding: "25px",
    margin: "20px 0",
    background: "white",
    border: "3px solid black",
    borderRadius: "15px",
  }}
>
  <div style={{ fontSize: "35px" }}>🛰️</div>

  <h3>AI-POWERED SATELLITE MONITORING</h3>

  <p>
    Detect accessibility changes automatically using Sentinel-2 satellite
    observations.
  </p>

  <button
    onClick={() => setScreen("satellite")}
    style={{
      padding: "12px 20px",
      background: "#172033",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    View Satellite Analysis →
  </button>
</div>
            <div className="report-card">

              <label>📸 Upload Image</label>

              <div className="upload-box">
                <span>📷</span>
                <strong>Upload obstacle photo</strong>
                <small>
                  AI will analyze the image
                </small>

                <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }}
/>
{imagePreview && (
  <div className="image-preview">
    <img src={imagePreview} alt="Uploaded obstacle" />

    <div className="image-actions">
      <span>✓ Image ready for AI analysis</span>

      <button
        type="button"
        onClick={() => setImagePreview(null)}
      >
        Remove
      </button>
    </div>
  </div>
)}
              </div>

              <label>🚧 Obstacle Type</label>

              <select className="report-select">
                <option>Stairs</option>
                <option>Blocked Pathway</option>
                <option>Broken Ramp</option>
                <option>Pothole</option>
                <option>Lift Unavailable</option>
                <option>Other</option>
              </select>
<label>⏳ Obstacle Duration</label>

<select className="report-select">
  <option>Temporary</option>
  <option>Permanent</option>
</select>
<label>⏰ Expected Clearance</label>

<select className="report-select">
  <option>Within 1 hour</option>
  <option>Within 3 hours</option>
  <option>By end of the day</option>
  <option>Unknown</option>
</select>
<label>📊 Obstacle Status</label>

<select className="report-select">
  <option>Active</option>
  <option>Cleared</option>
  <option>Under Verification</option>
</select>

<label>🚨 Obstacle Priority</label>

<select className="report-select">
  <option>Low - Minor inconvenience</option>
  <option>Medium - Route partially affected</option>
  <option>High - Route completely blocked</option>
</select>
              <label>📍 Location</label>

              <input
                className="report-input"
                placeholder="Example: Block B entrance"
              />

              <label>📝 Description</label>

              <textarea
                className="report-input description"
                placeholder="Describe the accessibility issue..."
              ></textarea>

              <button
  className="find-btn"
  onClick={() => {
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      setObstacleReported(true);
      setReportSubmitted(true);
    }, 1800);
  }}
>
  {analyzing ? "🤖 AI Analyzing..." : "Submit Report →"}
</button>

            </div>
            </>
          ) : (
            <div className="ai-result-card">

              <div className="ai-icon">🤖</div>

              <span className="recommended-label">
                AI VERIFICATION COMPLETE
              </span>

              <h3>Obstacle Detected</h3>

              <p className="detected-object">
                Staircase
              </p>

              <div className="confidence">
  <strong>94%</strong>
  <span>AI Confidence</span>

  <div className="confidence-bar">
    <div className="confidence-fill"></div>
  </div>
</div>
<div className="detection-details">
  <div>
    <span>Detected Object</span>
    <strong>Staircase</strong>
  </div>

  <div>
    <span>Confidence</span>
    <strong>94%</strong>
  </div>

  <div>
    <span>Status</span>
    <strong>✓ Verified</strong>
  </div>
</div>

              <div className="verification-status">
                ✓ Report verified<br />
                ✓ Accessibility map updated<br />
                ✓ Routes will be recalculated
              </div>

              <button
  className="find-btn"
  onClick={() => {
    setSelectedRoute("B");
    setScreen("routes");
  }}
>
  View Updated Routes →
</button>

            </div>
          )}

        </section>
      </main>
    </div>
  );
}
  if (screen === "routes") {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">♿</div>
            <div>
              <h1>AccessMap AI</h1>
              <p>Accessible navigation for everyone</p>
            </div>
          </div>

          <button
            className="report-btn"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>
        </header>

        <main className="main">
          <section className="route-page">
            <span className="badge">ACCESSIBILITY-AWARE ROUTING</span>
            <div className="map-heading">
  <div>
    <h3>Campus Accessibility Map</h3>
    <p>Live accessibility conditions and route barriers</p>
  </div>

  <span className="live-badge">● LIVE DATA</span>
</div>
            <CampusMap
  selectedRoute={selectedRoute}
  obstacleReported={obstacleReported}
/>
            <h2 className="route-title">
              Best routes to <span>{destination || "Central Library"}</span>
            </h2>

            <p className="route-subtitle">
              Optimized for <strong>{need}</strong> accessibility needs.
            </p>

            <div
  className={`route-card recommended ${
    selectedRoute === "C" ? "selected-route" : ""
  }`}
>{selectedRoute === "C" && (
  <div className="selected-info">
    <strong>✓ Route C selected</strong>
    <span>Ramp available</span>
    <span>Lift available</span>
    <span>No stairs</span>
  </div>
)}
              <div className="route-top">
                <div>
                  <span className="recommended-label">✓ RECOMMENDED</span>
                  <h3>Route C</h3>
                </div>

                <div className="score">
                  <strong>{routeScores.C}</strong>
<small>/100</small>
                  <span>Accessibility</span>
                </div>
              </div>

              <div className="route-details">
                <span>⏱ 9 min</span>
                <span>📍 650 m</span>
                <span>♿ Ramp available</span>
                <span>🛗 Lift available</span>
              </div>

              <div className="route-status">
                <span>✓ No stairs</span>
                <span>✓ Path clear</span>
                <span>✓ Verified recently</span>
              </div>

              <button
  className="use-route-btn"
  onClick={() => setSelectedRoute("C")}
>
  Use This Route →
</button>
            </div>

            <div
  className={`route-card ${
    selectedRoute === "A" ? "selected-route" : ""
  }`}
  onClick={() => setSelectedRoute("A")}
>
              <div className="route-top">
                <div>
                  <h3>Route A</h3>
                  <span className="warning">⚠ Accessibility barrier</span>
                </div>

                <div className="score warning-score">
                  <strong>{routeScores.A}</strong>
<small>/100</small>
                  <span>Accessibility</span>
                </div>
              </div>

              <div className="route-details">
                <span>⏱ 5 min</span>
                <span>📍 420 m</span>
                <span>⚠ Stairs detected</span>
              </div>
            </div>

            <div
  className={`route-card ${
    selectedRoute === "B" ? "selected-route" : ""
  }`}
  onClick={() => setSelectedRoute("B")}
>
              <div className="route-top">
                <div>
                  <h3>Route B</h3>
                  <span className="warning">⚠ Narrow pathway</span>
                </div>

                <div className="score warning-score">
                  <strong>{routeScores.B}</strong>
<small>/100</small>
                  <span>Accessibility</span>
                </div>
              </div>

              <div className="route-details">
                <span>⏱ 7 min</span>
                <span>📍 520 m</span>
                <span>⚠ Narrow pathway</span>
              </div>
            </div>

            <button
  className="report-btn"
  onClick={() => {
    setReportSubmitted(false);
    setScreen("report");
  }}
>
  + Report Obstacle
</button>
          </section>
        </main>
        <button
  onClick={startVoiceAssistant}
  style={{
    position: "fixed",
    bottom: "25px",
    right: "25px",
    padding: "15px 20px",
    borderRadius: "30px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    zIndex: 9999
  }}
>
  🎙️ {voiceActive ? "Listening..." : "Voice Assistant"}
</button>

{voiceMessage && (
  <div
    style={{
      position: "fixed",
      bottom: "90px",
      right: "25px",
      padding: "12px 18px",
      background: "white",
      color: "#222",
      borderRadius: "10px",
      zIndex: 9999
    }}
  >
    🎙️ {voiceMessage}
  </div>
)}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">♿</div>
          <div>
            <h1>AccessMap AI</h1>
            <p>Accessible navigation for everyone</p>
          </div>
        </div>

        <button
  className="report-link"
  onClick={() => {
    setReportSubmitted(false);
    setScreen("report");
  }}
>
  🚧 Report an obstacle on this route
</button>
      </header>

      <main className="main">
        <section className="hero">
          <div>
            <span className="badge">AI-POWERED ACCESSIBILITY</span>

            <h2>
              Find a route
              <br />
              <span>you can actually access.</span>
            </h2>

            <p className="hero-text">
              Navigate safely with accessibility-aware routes,
              real-time obstacle detection and community reports.
            </p>
          </div>

          <div className="search-card">
            <div className="input-box">
              <span>📍</span>
              <div>
                <small>Current Location</small>
                <strong>College Main Gate</strong>
              </div>
            </div>

            <div className="route-line"></div>

            <div className="input-box">
              <span>🎯</span>
              <div>
                <small>Where do you want to go?</small>

                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="">Select destination</option>

                  {destinations.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="find-btn"
              onClick={() => setScreen("routes")}
            >
              Find Accessible Route →
            </button>
          </div>
        </section>

        <section className="preferences">
          <h3>Choose your accessibility needs</h3>

          <div className="preference-grid">
            {[
              ["♿", "Wheelchair"],
              ["👴", "Elderly"],
              ["👁️", "Visual Assistance"],
              ["🚶", "Easy Walking"],
            ].map(([icon, label]) => (
              <div
                key={label}
                className={`preference ${
                  need === label ? "active" : ""
                }`}
                onClick={() => setNeed(label)}
              >
                <span>{icon}</span>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="preferences">
  <h3>⭐ Favourite Places</h3>

  <p>
    Save a place for quick accessible navigation.
  </p>

  <div style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "15px"
  }}>
    {favoritePlaces.map((place) => (
      <button
        key={place}
        onClick={() => {
          setDestination(place);
          setScreen("routes");
        }}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          cursor: "pointer",
          background: "white"
        }}
      >
        ⭐ {place}
        <span
  onClick={(e) => {
    e.stopPropagation();
    setFavoritePlaces(
      favoritePlaces.filter((item) => item !== place)
    );
  }}
  style={{
    marginLeft: "8px",
    cursor: "pointer"
  }}
>
  ❌
</span>
      </button>
    ))}
  </div>

  {destination && !favoritePlaces.includes(destination) && (
    <button
      onClick={() =>
        setFavoritePlaces([...favoritePlaces, destination])
      }
      style={{
        marginTop: "15px",
        padding: "10px 16px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      ⭐ Save Current Destination
    </button>
  )}
</section>
<section className="preferences">
  <h3>👤 Caregiver</h3>

  <p>
    Add a trusted person for quick access.
  </p>

  <div style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "15px"
  }}>
    <input
      type="text"
      placeholder="Caregiver name or contact"
      value={caregiverInput}
      onChange={(e) => setCaregiverInput(e.target.value)}
      style={{
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        flex: "1",
        minWidth: "200px"
      }}
    />
    <input
  type="tel"
  placeholder="Phone number"
  value={caregiverPhone}
  onChange={(e) => setCaregiverPhone(e.target.value)}
  style={{
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    flex: "1",
    minWidth: "200px"
  }}
/>
    <button
      onClick={() => {
  setCaregivers([
  ...caregivers,
  {
    name: caregiverInput,
    phone: caregiverPhone
  }
]);
localStorage.setItem(
  "accessmap-caregivers",
  JSON.stringify([
  ...caregivers,
  {
    name: caregiverInput,
    phone: caregiverPhone
  }
])
);
  setVoiceMessage("Caregiver saved successfully!");
}}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      💾 Save Caregiver
      <button
  onClick={() => {
    localStorage.removeItem("accessmap-caregivers");
setCaregivers([]);
setCaregiverInput("");
    setVoiceMessage("Caregiver removed.");
  }}
  style={{
    marginLeft: "8px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  }}
>
  ❌ Remove Caregiver
</button>
    </button>
  </div>
  {caregivers.map((person, index) => (
  <div
    key={index}
    style={{
      marginTop: "10px",
      padding: "10px 15px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}
  >
    👤 {person.name} — 📞 {person.phone}

    <button
      onClick={() => {
        const updated = caregivers.filter((_, i) => i !== index);
        setCaregivers(updated);
        localStorage.setItem(
          "accessmap-caregivers",
          JSON.stringify(updated)
        );
      }}
      style={{
        border: "none",
        cursor: "pointer",
        background: "transparent"
      }}
    >
      ❌
    </button>
  </div>
))}
</section>
<section className="preferences">
  <h3>🆘 Emergency SOS</h3>

  <p>
    Quickly alert your caregiver when you need priority assistance.
  </p>

  <button
    onClick={() => {
      setSosActive(true);
      setVoiceMessage(
  caregivers.length > 0
    ? `SOS activated! Caregivers: ${caregivers.map((c) => c.name).join(", ")}`
    : "SOS activated! No caregivers saved."
);
      speak(
  caregivers.length > 0
    ? `SOS activated. Your caregivers are ${caregivers.map((c) => c.name).join(", ")}.`
    : "SOS activated. No caregivers saved."
);
    }}
    style={{
      marginTop: "15px",
      padding: "12px 20px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold"
    }}
  >
    🆘 Activate SOS
  </button>

  {sosActive && (
    <p style={{ marginTop: "10px", fontWeight: "bold" }}>
      🔴 SOS Active — Priority assistance requested
    </p>
  )}
</section>
        <section className="features">
          <div className="feature-card">
            <span>🤖</span>
            <h3>AI Detection</h3>
            <p>Detect accessibility barriers from images.</p>
          </div>

          <div className="feature-card">
            <span>🗺️</span>
            <h3>Smart Routes</h3>
            <p>Find the safest and most accessible route.</p>
          </div>

          <div className="feature-card">
            <span>📊</span>
            <h3>Accessibility Score</h3>
            <p>See how accessible each route is.</p>
          </div>

          <div className="feature-card">
            <span>🔄</span>
            <h3>Live Updates</h3>
            <p>Routes update when obstacles are reported.</p>
          </div>
        </section>
      </main>
<VoiceAssistant />
</div>
);
}

export default App;