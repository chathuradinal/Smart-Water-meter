"""
Flask Web Application & REST API
Configured for React Frontend (Production build + Vite Dev Server support via CORS)
SRS Reference: Phase 2, Section 2.1, Section 5.2
"""

import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Configure path imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import random
from database import (
    init_db, insert_reading, get_latest_reading, get_recent_readings, get_active_alerts,
    register_user, authenticate_user, save_chat_message, get_user_chat_history, clear_user_chat_history,
    get_recent_snapshots, get_snapshot_by_id, clear_all_snapshots
)
from snapshot_engine import (
    record_snapshot, preseed_snapshot_history, format_reading_to_digits,
    process_real_camera_frame, SNAPSHOTS_DIR
)
from tariff import calculate_nwsdb_bill
from anomaly import leak_detector
from rag import rag_assistant
from forecaster import forecaster
from anomaly_xai import xai_detector

LATEST_SNAPSHOT_PATH = os.path.join(BASE_DIR, "latest_dial.jpg")

app = Flask(
    __name__,
    static_folder=os.path.join(FRONTEND_DIST, "assets"),
    static_url_path="/assets"
)

# Enable CORS for React development server (e.g. Vite on port 5173)
CORS(app)

# Initialize database and preseed history
init_db()
preseed_snapshot_history()

# State tracking for continuous flow / consecutive anomaly intervals
DEVICE_STATE = {
    "ESP32_METER_01": {
        "consecutive_flow_count": 0,
        "last_reading": 0.0,
        "last_timestamp": datetime.now()
    }
}

# ── Serve Built React Frontend ──────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    if os.path.exists(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "status": "online",
        "message": "Flask API running. Build React frontend using: npm run build --prefix frontend"
    })

# ── Camera & Computer Vision Endpoints ─────────────────────────────────────
@app.route('/api/snapshot', methods=['GET'])
def get_latest_snapshot():
    """Serves the latest camera frame captured by the ESP32-CAM."""
    if os.path.exists(LATEST_SNAPSHOT_PATH):
        return send_from_directory(BASE_DIR, "latest_dial.jpg", mimetype="image/jpeg")
    # Fallback to data dial
    return send_from_directory(os.path.join(PROJECT_ROOT, "data"), "base_dial_horizontal.jpg", mimetype="image/jpeg")

@app.route('/api/snapshot', methods=['POST'])
def upload_camera_snapshot():
    """Endpoint for ESP32-CAM to upload dial image frame."""
    try:
        if 'image' in request.files:
            file = request.files['image']
            file.save(LATEST_SNAPSHOT_PATH)
        else:
            # Raw byte stream
            with open(LATEST_SNAPSHOT_PATH, 'wb') as f:
                f.write(request.get_data())

        # Also record to snapshot history archive
        device_id = request.args.get("device_id", "ESP32_METER_01")
        latest = get_latest_reading(device_id)
        current_val = latest["reading"] if latest else 37.2468
        snap = record_snapshot(reading=current_val, device_id=device_id, image_file=LATEST_SNAPSHOT_PATH)

        return jsonify({
            "status": "success", 
            "message": "Snapshot saved and logged to history",
            "snapshot": snap
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/snapshots', methods=['GET'])
def list_snapshots():
    """Returns list of captured dial snapshots with OCR readings, digits, and leak status."""
    device_id = request.args.get("device_id", "ESP32_METER_01")
    limit = int(request.args.get("limit", 50))
    snapshots = get_recent_snapshots(device_id, limit=limit)
    return jsonify(snapshots)

@app.route('/api/snapshots/<int:snapshot_id>/image', methods=['GET'])
def get_snapshot_image(snapshot_id):
    """Serves the exact captured image file for a given snapshot ID."""
    snap = get_snapshot_by_id(snapshot_id)
    if not snap:
        return jsonify({"status": "error", "message": "Snapshot not found"}), 404
    filename = snap["image_filename"]
    return send_from_directory(SNAPSHOTS_DIR, filename, mimetype="image/jpeg")

@app.route('/api/snapshots/capture', methods=['POST'])
def trigger_snapshot_capture():
    """
    Triggers an instant camera snapshot capture (OV2640 with GPIO 4 LED Flash).
    Computes TinyML OCR digits, delta volume, flow rate, and leak classification.
    """
    try:
        data = request.get_json(silent=True) or {}
        device_id = data.get("device_id", "ESP32_METER_01")
        mode = data.get("mode", "normal") # "normal", "leak", "burst", "custom"

        latest = get_latest_reading(device_id)
        curr_reading = latest["reading"] if latest else 37.2468

        if "reading" in data and data["reading"] is not None:
            next_reading = float(data["reading"])
        elif mode == "leak":
            next_reading = round(curr_reading + 0.005, 4) # 0.5 L/min continuous
        elif mode == "burst":
            next_reading = round(curr_reading + 0.300, 4) # 30 L/min burst
        else:
            # Normal domestic usage step
            next_reading = round(curr_reading + round(random.uniform(0.010, 0.025), 4), 4)

        # 1. Record snapshot and generate real dial image
        snap = record_snapshot(
            reading=next_reading,
            device_id=device_id,
            previous_reading=curr_reading
        )

        # 2. Also register reading into live readings table
        insert_reading(
            device_id=device_id,
            reading=next_reading,
            flow_rate_lpm=snap["flow_rate_lpm"],
            delta_time_sec=600.0,
            is_anomaly=1 if snap["is_leak"] else 0,
            anomaly_score=0.85 if snap["is_leak"] else 0.05,
            alert_message=snap["leak_message"] if snap["is_leak"] else None
        )

        return jsonify({
            "status": "success",
            "snapshot": snap
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/snapshots', methods=['DELETE'])
def clear_snapshots_route():
    device_id = request.args.get("device_id", "ESP32_METER_01")
    clear_all_snapshots(device_id)
    return jsonify({"status": "success", "message": "Snapshot history cleared."})

@app.route('/api/camera', methods=['GET'])
def get_camera_status():
    """Returns camera specifications and digit ROI bounding boxes."""
    return jsonify({
        "status": "online",
        "sensor": "OmniVision OV2640",
        "resolution": "QVGA 320x240",
        "pixel_format": "PIXFORMAT_GRAYSCALE",
        "flash_led_gpio": 4,
        "exposure_settle_ms": 500,
        "focal_length_cm": "5 - 8 cm (Adjustable M12 lens)",
        "roi_boxes": [
            {"digit": 1, "color": "white", "x": 40, "y": 55, "w": 28, "h": 28, "role": "Thousands (m³)"},
            {"digit": 2, "color": "white", "x": 72, "y": 55, "w": 28, "h": 28, "role": "Hundreds (m³)"},
            {"digit": 3, "color": "white", "x": 104, "y": 55, "w": 28, "h": 28, "role": "Tens (m³)"},
            {"digit": 4, "color": "white", "x": 136, "y": 55, "w": 28, "h": 28, "role": "Ones (m³)"},
            {"digit": 5, "color": "red", "x": 168, "y": 55, "w": 28, "h": 28, "role": "Tenths (Speed #8)"}
        ],
        "snapshot_url": "/api/snapshot"
    })

@app.route('/api/camera/process-real-frame', methods=['POST'])
def process_real_camera_frame_route():
    """
    Receives a real camera frame (from browser webcam, mobile camera, or file upload)
    Processes with TinyML OCR, records snapshot, updates live readings and leak detection.
    """
    try:
        import base64
        image_bytes = None
        custom_reading = None
        custom_digits = None
        device_id = "ESP32_METER_01"

        # Check JSON payload (e.g. from Webcam base64)
        if request.is_json:
            body = request.get_json(silent=True) or {}
            b64_str = body.get("image_base64")
            if b64_str:
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                image_bytes = base64.b64decode(b64_str)
            custom_reading = body.get("reading")
            custom_digits = body.get("custom_digits")
            device_id = body.get("device_id", device_id)
        
        # Check Multipart File (e.g. from file upload)
        elif 'image' in request.files:
            file = request.files['image']
            image_bytes = file.read()
            custom_reading = request.form.get("reading")
            device_id = request.form.get("device_id", device_id)
        
        # Check raw binary body
        elif request.data:
            image_bytes = request.data
            device_id = request.headers.get("X-Device-Id", device_id)
            custom_reading = request.headers.get("X-Reading")

        if not image_bytes:
            return jsonify({"status": "error", "message": "No image data provided"}), 400

        snap = process_real_camera_frame(
            image_bytes=image_bytes,
            device_id=device_id,
            custom_reading=float(custom_reading) if custom_reading else None,
            custom_digits=custom_digits
        )

        return jsonify({
            "status": "success",
            "message": "Real camera frame ingested and recognized successfully",
            "snapshot": snap
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/camera/upload', methods=['POST'])
def upload_camera_frame_esp32():
    """
    Direct ingestion endpoint for physical ESP32-CAM boards.
    Accepts raw binary JPEG or multipart image data from ESP32-CAM.
    """
    try:
        device_id = request.headers.get("X-Device-Id", "ESP32_METER_01")
        reading_header = request.headers.get("X-Reading")
        
        image_bytes = None
        if 'image' in request.files:
            image_bytes = request.files['image'].read()
        elif request.data:
            image_bytes = request.data
            
        if not image_bytes:
            return jsonify({"status": "error", "message": "No image payload received from ESP32-CAM"}), 400

        snap = process_real_camera_frame(
            image_bytes=image_bytes,
            device_id=device_id,
            custom_reading=float(reading_header) if reading_header else None
        )
        return jsonify({
            "status": "success",
            "snapshot_id": snap["id"],
            "reading": snap["reading"],
            "digits": [d["digit"] for d in snap["digits"]],
            "flow_rate_lpm": snap["flow_rate_lpm"],
            "is_leak": snap["is_leak"],
            "estimated_bill_lkr": snap["estimated_bill_lkr"]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/camera/fetch-remote', methods=['POST'])
def fetch_remote_camera_stream():
    """
    Pulls a live camera frame from an ESP32-CAM running on the local network (e.g. http://192.168.1.150/capture).
    """
    try:
        import requests
        body = request.get_json(silent=True) or {}
        url = body.get("url")
        device_id = body.get("device_id", "ESP32_METER_01")
        if not url:
            return jsonify({"status": "error", "message": "Missing camera stream URL"}), 400

        resp = requests.get(url, timeout=6)
        if resp.status_code != 200:
            return jsonify({"status": "error", "message": f"Camera responded with status {resp.status_code}"}), 502

        snap = process_real_camera_frame(
            image_bytes=resp.content,
            device_id=device_id
        )
        return jsonify({
            "status": "success",
            "snapshot": snap
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ── API Endpoints ────────────────────────────────────────────────────────────

@app.route('/api/data', methods=['POST'])
def receive_meter_telemetry():
    """
    Ingestion endpoint for ESP32-CAM via SIM800L HTTP POST
    SRS Reference: Section 5.2
    Payload: {"device_id": "STRING", "reading": FLOAT}
    """
    try:
        payload = request.get_json(force=True)
        device_id = payload.get("device_id", "ESP32_METER_01")
        reading = float(payload.get("reading", 0.0))
        
        now = datetime.now()
        dev_state = DEVICE_STATE.setdefault(device_id, {
            "consecutive_flow_count": 0,
            "last_reading": reading,
            "last_timestamp": now
        })
        
        prev_reading = dev_state["last_reading"]
        prev_time = dev_state["last_timestamp"]
        delta_sec = max(1.0, (now - prev_time).total_seconds())
        
        # Analyze for leaks using Two-Tier Engine
        analysis = leak_detector.analyze_reading(
            current_reading=reading,
            previous_reading=prev_reading,
            delta_seconds=delta_sec,
            consecutive_flow_count=dev_state["consecutive_flow_count"],
            timestamp=now
        )
        
        dev_state["consecutive_flow_count"] = analysis["consecutive_count"]
        dev_state["last_reading"] = reading
        dev_state["last_timestamp"] = now
        
        # Save to database
        reading_id = insert_reading(
            device_id=device_id,
            reading=reading,
            flow_rate_lpm=analysis["flow_rate_lpm"],
            delta_time_sec=delta_sec,
            is_anomaly=1 if analysis["is_leak"] else 0,
            anomaly_score=analysis["ml_score"],
            alert_message=analysis["message"] if analysis["is_leak"] else None
        )
        
        # Archive camera snapshot with extracted digits & telemetry
        try:
            record_snapshot(
                reading=reading,
                device_id=device_id,
                delta_seconds=delta_sec,
                previous_reading=prev_reading
            )
        except Exception as snap_err:
            print("Notice: snapshot record error during telemetry ingestion:", snap_err)
        
        return jsonify({
            "status": "success",
            "reading_id": reading_id,
            "flow_rate_lpm": analysis["flow_rate_lpm"],
            "is_leak": analysis["is_leak"],
            "severity": analysis["severity"]
        }), 200
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/status', methods=['GET'])
def get_system_status():
    """Returns current telemetry, NWSDB bill estimate, and leak status."""
    device_id = request.args.get("device_id", "ESP32_METER_01")
    ctx = rag_assistant.retrieve_context(device_id)
    return jsonify(ctx)

@app.route('/api/readings', methods=['GET'])
def get_readings_history():
    """Returns recent readings for live dashboard charts."""
    device_id = request.args.get("device_id", "ESP32_METER_01")
    limit = int(request.args.get("limit", 50))
    readings = get_recent_readings(device_id, limit=limit)
    return jsonify(readings)

@app.route('/api/forecast', methods=['GET'])
def get_flow_forecast():
    """AI Feature 2: Returns 4-hour forward consumption forecast and projected bill."""
    device_id = request.args.get("device_id", "ESP32_METER_01")
    return jsonify(forecaster.get_forecast(device_id))

@app.route('/api/explain', methods=['GET'])
def get_anomaly_explanation():
    """AI Feature 3: Returns explainable AI feature contribution weights (XAI)."""
    device_id = request.args.get("device_id", "ESP32_METER_01")
    return jsonify(xai_detector.explain_latest_reading(device_id))

# ── User Authentication Endpoints ──────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json(force=True)
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required."}), 400
    res = register_user(username, password)
    status_code = 200 if res["status"] == "success" else 400
    return jsonify(res), status_code

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json(force=True)
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required."}), 400
    res = authenticate_user(username, password)
    status_code = 200 if res["status"] == "success" else 401
    return jsonify(res), status_code

# ── User-by-User Chat History Endpoints ────────────────────────────────────
@app.route('/api/chat/history', methods=['GET'])
def get_chat_history_route():
    username = request.args.get("username", "admin").strip()
    history = get_user_chat_history(username)
    return jsonify({"status": "success", "username": username, "history": history})

@app.route('/api/chat/history', methods=['DELETE'])
def clear_chat_history_route():
    data = request.get_json(silent=True) or {}
    username = request.args.get("username") or data.get("username", "admin")
    clear_user_chat_history(username.strip())
    return jsonify({"status": "success", "message": f"Chat history cleared for {username}."})

@app.route('/api/chat', methods=['POST'])
def rag_chat():
    """RAG Conversational Assistant endpoint with clickable suggestion chips & user history."""
    try:
        data = request.get_json(force=True)
        user_message = data.get("message", "")
        username = data.get("username", "admin").strip() or "admin"
        device_id = data.get("device_id", "ESP32_METER_01")
        if not user_message.strip():
            return jsonify({
                "reply": "Please enter a question about your water meter or bill.",
                "suggestions": ["🚨 Check Leaks", "💰 Calculate Bill", "📊 Current Reading"]
            })
            
        # 1. Save user query to this user's history
        save_chat_message(username, "user", user_message)

        # 2. Generate grounded answer
        reply, suggestions = rag_assistant.answer_query_with_suggestions(user_message, device_id=device_id)

        # 3. Save bot reply and clickable follow-up suggestions to this user's history
        save_chat_message(username, "bot", reply, suggestions)

        return jsonify({
            "reply": reply,
            "suggestions": suggestions,
            "username": username
        })
    except Exception as e:
        return jsonify({"reply": f"Error answering query: {str(e)}", "suggestions": []}), 500

@app.route('/api/simulate', methods=['POST'])
def simulate_reading():
    """Simulates incoming reading events (Normal, Leak, Burst) for testing."""
    data = request.get_json(force=True) if request.is_json else {}
    mode = data.get("mode", "normal")
    device_id = data.get("device_id", "ESP32_METER_01")
    
    latest = get_latest_reading(device_id)
    curr_reading = latest["reading"] if latest else 37.2468
    
    if mode == "leak":
        # Continuous micro-leak: small 0.5 L/min flow = 0.005 m³ in 10 mins
        next_reading = round(curr_reading + 0.005, 4)
    elif mode == "burst":
        # Pipe burst: 30 L/min = 0.300 m³ in 10 mins
        next_reading = round(curr_reading + 0.300, 4)
    else:
        # Normal domestic usage: ~0.015 m³
        next_reading = round(curr_reading + 0.015, 4)
        
    now = datetime.now()
    dev_state = DEVICE_STATE.setdefault(device_id, {
        "consecutive_flow_count": 0,
        "last_reading": curr_reading,
        "last_timestamp": now
    })
    
    # If simulating night leak, simulate night-time hour (02:30 AM)
    if mode == "leak":
        now = now.replace(hour=2, minute=30)
        
    analysis = leak_detector.analyze_reading(
        current_reading=next_reading,
        previous_reading=curr_reading,
        delta_seconds=600.0,
        consecutive_flow_count=dev_state["consecutive_flow_count"],
        timestamp=now
    )
    
    dev_state["consecutive_flow_count"] = analysis["consecutive_count"]
    dev_state["last_reading"] = next_reading
    dev_state["last_timestamp"] = now
    
    insert_reading(
        device_id=device_id,
        reading=next_reading,
        flow_rate_lpm=analysis["flow_rate_lpm"],
        delta_time_sec=600.0,
        is_anomaly=1 if analysis["is_leak"] else 0,
        anomaly_score=analysis["ml_score"],
        alert_message=analysis["message"] if analysis["is_leak"] else None
    )
    
    return jsonify({
        "status": "simulated",
        "mode": mode,
        "new_reading": next_reading,
        "analysis": analysis
    })

if __name__ == '__main__':
    # Use port 5001 (port 5000 is occupied by macOS ControlCenter AirPlay)
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Smart Water Meter Backend on http://0.0.0.0:{port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
