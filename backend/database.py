"""
SQLite Database Layer for Water Meter Telemetry, User Auth & Chat History
SRS Reference: Section 2.1, 5.2
"""

import sqlite3
import os
import json
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "water_data.db")

def get_connection(db_path=DEFAULT_DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    
    # 1. Meter Telemetry Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            reading REAL NOT NULL,
            flow_rate_lpm REAL DEFAULT 0.0,
            delta_time_sec REAL DEFAULT 600.0,
            is_anomaly INTEGER DEFAULT 0,
            anomaly_score REAL DEFAULT 0.0,
            alert_message TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. System Alerts Log
    c.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            reading REAL,
            flow_rate_lpm REAL,
            resolved INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 3. User Authentication Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. User-by-User Chat History Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            suggestions TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Camera Snapshots & OCR History Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            image_filename TEXT NOT NULL,
            reading REAL NOT NULL,
            digits TEXT NOT NULL,
            confidence_avg REAL DEFAULT 0.995,
            flow_rate_lpm REAL DEFAULT 0.0,
            delta_volume_liters REAL DEFAULT 0.0,
            is_leak INTEGER DEFAULT 0,
            leak_severity TEXT DEFAULT 'NORMAL',
            leak_message TEXT,
            estimated_bill_lkr REAL DEFAULT 300.0,
            current_slab_rate_lkr REAL DEFAULT 60.0,
            exposure_ms INTEGER DEFAULT 500,
            flash_fired INTEGER DEFAULT 1,
            inference_time_ms INTEGER DEFAULT 45,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Pre-seed default test users if empty
    c.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ('admin', generate_password_hash('admin123'))
        )
    c.execute("SELECT COUNT(*) FROM users WHERE username = 'user1'")
    if c.fetchone()[0] == 0:
        c.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ('user1', generate_password_hash('user123'))
        )
        
    conn.commit()
    conn.close()

# ── Telemetry Helpers ────────────────────────────────────────────────────────

def insert_reading(device_id, reading, flow_rate_lpm=0.0, delta_time_sec=600.0, 
                   is_anomaly=0, anomaly_score=0.0, alert_message=None, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        INSERT INTO readings 
        (device_id, reading, flow_rate_lpm, delta_time_sec, is_anomaly, anomaly_score, alert_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (device_id, reading, flow_rate_lpm, delta_time_sec, is_anomaly, anomaly_score, alert_message))
    reading_id = c.lastrowid
    
    if is_anomaly:
        severity = "CRITICAL" if flow_rate_lpm > 10.0 else ("HIGH" if is_anomaly == 2 else "MEDIUM")
        c.execute('''
            INSERT INTO alerts (device_id, alert_type, severity, message, reading, flow_rate_lpm)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (device_id, "LEAK_DETECTED", severity, alert_message, reading, flow_rate_lpm))
        
    conn.commit()
    conn.close()
    return reading_id

def get_latest_reading(device_id="ESP32_METER_01", db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        SELECT * FROM readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1
    ''', (device_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_recent_readings(device_id="ESP32_METER_01", limit=100, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        SELECT * FROM readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?
    ''', (device_id, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in reversed(rows)]

def get_active_alerts(device_id="ESP32_METER_01", limit=10, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        SELECT * FROM alerts WHERE device_id = ? AND resolved = 0 ORDER BY created_at DESC LIMIT ?
    ''', (device_id, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── User Authentication Helpers ──────────────────────────────────────────────

def register_user(username, password, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    try:
        pw_hash = generate_password_hash(password)
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, pw_hash))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return {"status": "success", "user_id": user_id, "username": username}
    except sqlite3.IntegrityError:
        conn.close()
        return {"status": "error", "message": "Username already exists."}
    except Exception as e:
        conn.close()
        return {"status": "error", "message": str(e)}

def authenticate_user(username, password, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    if user and check_password_hash(user["password_hash"], password):
        return {"status": "success", "username": user["username"], "user_id": user["id"]}
    return {"status": "error", "message": "Invalid username or password."}

# ── User-by-User Chat History Helpers ────────────────────────────────────────

def save_chat_message(username, sender, message, suggestions=None, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    sugg_json = json.dumps(suggestions) if suggestions else None
    c.execute('''
        INSERT INTO chat_history (username, sender, message, suggestions)
        VALUES (?, ?, ?, ?)
    ''', (username, sender, message, sugg_json))
    conn.commit()
    conn.close()

def get_user_chat_history(username, limit=50, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        SELECT sender, message as text, suggestions, timestamp
        FROM chat_history 
        WHERE username = ?
        ORDER BY id ASC
        LIMIT ?
    ''', (username, limit))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for r in rows:
        item = dict(r)
        if item["suggestions"]:
            try:
                item["suggestions"] = json.loads(item["suggestions"])
            except Exception:
                item["suggestions"] = []
        else:
            item["suggestions"] = []
        history.append(item)
    return history

def clear_user_chat_history(username, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute("DELETE FROM chat_history WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    return True

# ── Camera Snapshots & OCR History Helpers ───────────────────────────────────

def insert_snapshot(device_id, image_filename, reading, digits,
                    confidence_avg=0.995, flow_rate_lpm=0.0, delta_volume_liters=0.0,
                    is_leak=0, leak_severity="NORMAL", leak_message=None,
                    estimated_bill_lkr=300.0, current_slab_rate_lkr=60.0,
                    exposure_ms=500, flash_fired=1, inference_time_ms=45,
                    created_at=None, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    digits_json = json.dumps(digits) if isinstance(digits, (list, dict)) else str(digits)
    if created_at:
        c.execute('''
            INSERT INTO snapshots (
                device_id, image_filename, reading, digits, confidence_avg,
                flow_rate_lpm, delta_volume_liters, is_leak, leak_severity,
                leak_message, estimated_bill_lkr, current_slab_rate_lkr,
                exposure_ms, flash_fired, inference_time_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            device_id, image_filename, reading, digits_json, confidence_avg,
            flow_rate_lpm, delta_volume_liters, is_leak, leak_severity,
            leak_message, estimated_bill_lkr, current_slab_rate_lkr,
            exposure_ms, flash_fired, inference_time_ms, created_at
        ))
    else:
        c.execute('''
            INSERT INTO snapshots (
                device_id, image_filename, reading, digits, confidence_avg,
                flow_rate_lpm, delta_volume_liters, is_leak, leak_severity,
                leak_message, estimated_bill_lkr, current_slab_rate_lkr,
                exposure_ms, flash_fired, inference_time_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            device_id, image_filename, reading, digits_json, confidence_avg,
            flow_rate_lpm, delta_volume_liters, is_leak, leak_severity,
            leak_message, estimated_bill_lkr, current_slab_rate_lkr,
            exposure_ms, flash_fired, inference_time_ms
        ))
    snapshot_id = c.lastrowid
    conn.commit()
    conn.close()
    return snapshot_id

def get_recent_snapshots(device_id="ESP32_METER_01", limit=50, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('''
        SELECT * FROM snapshots WHERE device_id = ? ORDER BY id DESC LIMIT ?
    ''', (device_id, limit))
    rows = c.fetchall()
    conn.close()
    snapshots = []
    for r in rows:
        item = dict(r)
        try:
            item["digits"] = json.loads(item["digits"])
        except Exception:
            item["digits"] = []
        item["image_url"] = f"/api/snapshots/{item['id']}/image"
        snapshots.append(item)
    return snapshots

def get_snapshot_by_id(snapshot_id, db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('SELECT * FROM snapshots WHERE id = ?', (snapshot_id,))
    row = c.fetchone()
    conn.close()
    if row:
        item = dict(row)
        try:
            item["digits"] = json.loads(item["digits"])
        except Exception:
            item["digits"] = []
        item["image_url"] = f"/api/snapshots/{item['id']}/image"
        return item
    return None

def clear_all_snapshots(device_id="ESP32_METER_01", db_path=DEFAULT_DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('DELETE FROM snapshots WHERE device_id = ?', (device_id,))
    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DEFAULT_DB_PATH)
