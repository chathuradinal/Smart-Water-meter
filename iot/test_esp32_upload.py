#!/usr/bin/env python3
"""
Test script to simulate an ESP32-CAM uploading a captured JPEG frame to the backend.
Usage: python3 test_esp32_upload.py [http://localhost:5001]
"""

import sys
import os
import requests

def test_upload(server_url="http://localhost:5001"):
    endpoint = f"{server_url}/api/camera/upload"
    test_image_path = os.path.join(os.path.dirname(__file__), "..", "backend", "snapshots", "test_dial.jpg")

    if not os.path.exists(test_image_path):
        print(f"Error: Test image not found at {test_image_path}")
        return False

    with open(test_image_path, "rb") as f:
        img_bytes = f.read()

    headers = {
        "Content-Type": "image/jpeg",
        "X-Device-Id": "ESP32_METER_01"
    }

    print(f"--> Sending test frame ({len(img_bytes)} bytes) to {endpoint} ...")
    try:
        res = requests.post(endpoint, data=img_bytes, headers=headers, timeout=5)
        print(f"<-- Response Status: {res.status_code}")
        print(f"<-- Response Body: {res.text}")
        if res.status_code == 200:
            print("\n[SUCCESS] Backend successfully ingested ESP32-CAM image!")
            return True
        else:
            print("\n[FAILURE] Backend returned an error.")
            return False
    except Exception as e:
        print(f"[ERROR] Could not connect to backend: {e}")
        return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5001"
    test_upload(url)

