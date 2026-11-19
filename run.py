#!/usr/bin/env python3
"""
Application Runner for IoT Smart Water Meter Backend & Dashboard
Usage: python3 run.py
"""

import os
import sys

# Ensure backend directory is in python module search path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.app import app

if __name__ == "__main__":
    # Use port 5001 (port 5000 is reserved by macOS ControlCenter AirPlay)
    port = int(os.environ.get("PORT", 5001))
    print("=" * 65)
    print("💧 IoT Smart Water Meter Retrofitting System")
    print(f"📡 Python Backend API:   http://127.0.0.1:{port}/api")
    print(f"⚛️  Single React Frontend: http://localhost:5173")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=True)

