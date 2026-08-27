import { useState } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
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
if (screen === "report") {
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
        <section className="report-page">

          <span className="badge">COMMUNITY REPORT</span>

          <h2 className="route-title">
            Report an <span>Accessibility Issue</span>
          </h2>

          <p className="route-subtitle">
            Help others by reporting an obstacle you found.
          </p>

          {!reportSubmitted ? (
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
    </div>
  );
}

export default App;