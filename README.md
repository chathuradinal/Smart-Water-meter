# IoT Smart Water Meter Retrofitting System with Edge AI

An end-to-end IoT and TinyML solution designed to retrofit mechanical water meters in Sri Lanka into intelligent, connected meters with real-time leak surveillance, NWSDB slab billing estimation, and a conversational RAG assistant.

---

## 📁 Project Architecture

```
Final Project/
├── backend/                  # Flask REST API, SQLite DB & AI logic
│   ├── app.py                # Flask entry point & endpoints (/api/data, /api/chat, etc.)
│   ├── database.py           # SQLite connection & telemetry models
│   ├── tariff.py             # Official NWSDB Sri Lanka domestic slab tariff engine
│   ├── anomaly.py            # Two-tier leak detection engine (3/4" pipe calibrated)
│   ├── rag.py                # Conversational RAG assistant
│   └── water_data.db         # Persistent SQLite database
│
├── frontend/                 # Modern React (Vite) Single Page App
│   ├── package.json          # React 18, Chart.js, Lucide-React dependencies
│   ├── vite.config.js        # Vite config with API proxy to Flask (port 5001)
│   ├── index.html            # HTML entry point with Google Fonts
│   ├── dist/                 # Production-built bundle served by Flask
│   └── src/
│       ├── main.jsx          # React DOM entry point
│       ├── App.jsx           # Main application state & routing
│       ├── index.css         # Modern dark-mode aquatic UI stylesheet
│       ├── theme/
│       │   └── aquaticTheme.js # Ant Design custom dark oceanic theme configuration
│       ├── pages/
│       │   ├── LoginPage.jsx    # Standalone aquatic Sign In page with demo accounts
│       │   └── RegisterPage.jsx # Standalone aquatic Account Creation page
│       ├── views/
│       │   ├── DashboardView.jsx       # Spacious overview: 3D drums, flow gauge & tariff
│       │   ├── SnapshotHistoryView.jsx # Dedicated snapshot archive table & gallery
│       │   ├── CameraStudioView.jsx    # OV2640 alignment, lens specs & ROI calibration
│       │   ├── AiAnalyticsView.jsx     # Two-Tier Leak XAI & 4h consumption forecaster
│       │   └── AssistantView.jsx       # Grounded conversational RAG assistant
│       └── components/
│           ├── AppLayout.jsx         # Ant Design Layout with collapsible aquatic sidebar
│           ├── MeterDrum.jsx         # 5 mechanical roller drums (4 white + 1 red #8)
│           ├── CameraCard.jsx        # OV2640 dial snapshot & ROI bounding box overlays
│           ├── FlowCard.jsx          # Instantaneous flow & 3/4" pipe progress bar
│           ├── TariffCard.jsx        # NWSDB domestic slab tariff breakdown
│           ├── AlertBanner.jsx       # Real-time leak warning with acknowledge
│           ├── TelemetryChart.jsx    # Chart.js time-series with anomaly flags
│           ├── SimulationControls.jsx# One-click test simulation buttons
│           └── RagChat.jsx           # Grounded conversational AI assistant with per-user history
│
├── models/                   # TinyML Deep Learning Model & Quantization
│   ├── train_model.py        # CNN training script on 100k dial dataset
│   ├── model.tflite          # Quantized INT8 model (<200KB for ESP32 SRAM)
│   └── model.h               # C-array header for ESP32-CAM firmware
│
├── notebooks/                # Interactive Research & Training Notebooks
│   ├── 01_tinyml_digit_ocr_training.ipynb           # CNN training, INT8 quantization & model.h export
│   └── 02_leak_detection_and_isolation_forest.ipynb # Unsupervised Isolation Forest & night flow analysis
│
├── iot/                      # Hardware Firmware & Circuit Documentation
│   ├── firmware/
│   │   ├── water_meter_firmware.ino  # ESP32-CAM Arduino firmware (camera + TinyML + GSM)
│   │   ├── camera_pins.h             # AI-Thinker OV2640 pin definitions
│   │   └── model.h                   # Embedded TinyML model
│   └── WIRING_GUIDE.md               # Power regulation, voltage divider & BOM
│
├── data/                     # Training & Dial Generation Data
│   ├── dataset.csv           # 100,000 augmented 28x28 grayscale dial images
│   └── generate_tinyml_dataset.py
│
├── run.py                    # Root launcher script
├── test_system.py            # Automated unit & integration tests
└── requirements.txt          # Python dependencies
```

---

## 🚀 Quick Start Guide

### 1. Environment Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the System (Single React Frontend + Python Backend API)

1. **Terminal 1: Start the Python Backend API (Port 5001)**
   ```bash
   python3 run.py
   ```

2. **Terminal 2: Start the React Frontend Dashboard**
   ```bash
   npm run dev --prefix frontend
   ```
   Open **`http://localhost:5173`** in your browser. This is the **single React application** with all features, mechanical roller drums, camera snapshot history, leak diagnostics, and the RAG assistant.

### 3. Run Automated Tests
```bash
python3 test_system.py
```

### 4. Retrain TinyML Model (Optional)
```bash
python3 models/train_model.py
```

---

## 🔐 User Authentication & Multi-User Chat History
- **Default Pre-seeded Accounts:**
  - `admin` / `admin123`
  - `user1` / `user123`
- **Dynamic Registration:** Create any new account via the frontend `Create Account` tab or `/api/auth/register`.
- **Isolated Chat History:** Each user retains their own private conversational context with the RAG Assistant, saved persistently in SQLite (`chat_history` table). Switching users updates the conversational thread and context dynamically.

---

## 📸 Snapshot History & Edge Optical OCR Inspection
- **Historical Snapshot Archive:** Every camera capture (automatic 10-minute interval or on-demand "Capture Snapshot Now") archives the actual dial frame image to `backend/snapshots/` and SQLite.
- **Visual Extracted Digits:** Displays the recognized 5 mechanical roller drums (4 white + 1 red #8) with individual drum confidence scores.
- **Dual Display Modes:** Toggle between visual **Cards Grid View** and detailed **Audit Table View**.
- **Interactive Full Dial Inspector:** Click any snapshot to view the high-resolution dial frame, toggle drum ROI bounding boxes, inspect individual drum crops with Softmax classification probabilities, and review instantaneous flow and leak status at that capture moment.
- **RAG Assistant Grounding:** The conversational assistant can answer queries about snapshot history and recent camera readings.

---

## ⚡ Key Technical Highlights
- **Microcontroller:** ESP32-CAM (AI-Thinker) + OV2640 in QVGA Grayscale.
- **Edge AI:** INT8 Quantized CNN (113.7 KB, 99.91% test accuracy).
- **Cellular Telemetry:** SIM800L 2G GSM via HTTP POST.
- **Pipe Calibration:** 3/4 inch domestic line ($Q_{max} \approx 25\text{ L/min}$, micro-leak floor $\approx 0.15\text{ L/min}$).
- **Billing Engine:** Progressive slab calculations based on Sri Lanka NWSDB domestic tariffs.

