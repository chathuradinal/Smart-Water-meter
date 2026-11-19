#!/usr/bin/env python3
"""
Automated Integration Tests for Smart Water Meter System
Tests Tariff Engine, Two-Tier Leak Detector, and RAG Assistant.
"""

import unittest
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from tariff import calculate_nwsdb_bill
from anomaly import leak_detector
from rag import rag_assistant
from database import (
    init_db, insert_reading, get_latest_reading,
    register_user, authenticate_user,
    save_chat_message, get_user_chat_history, clear_user_chat_history,
    get_recent_snapshots, get_snapshot_by_id
)
from snapshot_engine import (
    record_snapshot, format_reading_to_digits, process_real_camera_frame
)

class TestSmartWaterMeter(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        init_db()
    
    def test_auth_and_user_chat_history(self):
        # 1. Test authenticating default seeded user
        admin_auth = authenticate_user("admin", "admin123")
        self.assertEqual(admin_auth["status"], "success")
        self.assertEqual(admin_auth["username"], "admin")

        # Wrong password
        bad_auth = authenticate_user("admin", "wrongpass")
        self.assertEqual(bad_auth["status"], "error")

        # 2. Test registering a new user
        test_uname = f"testuser_{uuid.uuid4().hex[:8]}"
        reg_res = register_user(test_uname, "secret456")
        self.assertEqual(reg_res["status"], "success")

        # Duplicate username should fail
        dup_res = register_user(test_uname, "secret456")
        self.assertEqual(dup_res["status"], "error")

        # 3. Test saving chat history per user
        clear_user_chat_history("user_alpha")
        clear_user_chat_history("user_beta")

        save_chat_message("user_alpha", "user", "What is my current bill?")
        save_chat_message("user_alpha", "bot", "Your bill is Rs. 350.00", ["Check Leaks"])

        save_chat_message("user_beta", "user", "How do I fix a leaking valve?")
        save_chat_message("user_beta", "bot", "Turn off main stopcock", ["Plumber contact"])

        # 4. Verify user isolation
        alpha_hist = get_user_chat_history("user_alpha")
        beta_hist = get_user_chat_history("user_beta")

        self.assertEqual(len(alpha_hist), 2)
        self.assertEqual(alpha_hist[0]["text"], "What is my current bill?")
        self.assertEqual(alpha_hist[1]["suggestions"], ["Check Leaks"])

        self.assertEqual(len(beta_hist), 2)
        self.assertEqual(beta_hist[0]["text"], "How do I fix a leaking valve?")
        self.assertEqual(beta_hist[1]["suggestions"], ["Plumber contact"])

        # 5. Clear history for user_alpha, ensure user_beta is unaffected
        clear_user_chat_history("user_alpha")
        self.assertEqual(len(get_user_chat_history("user_alpha")), 0)
        self.assertEqual(len(get_user_chat_history("user_beta")), 2)

        print("✅ User authentication and per-user chat history tests passed.")
    
    def test_nwsdb_tariff(self):
        # 0 units -> base charge
        b0 = calculate_nwsdb_bill(0)
        self.assertEqual(b0["total_bill"], 300.0)
        
        # 5 units: 5 * 60 + 300 = 600
        b5 = calculate_nwsdb_bill(5)
        self.assertEqual(b5["total_bill"], 600.0)
        
        # 12 units: (5*60) + (5*80) + (2*100) + 340 (fixed for 11-15 slab) = 300 + 400 + 200 + 340 = 1240
        b12 = calculate_nwsdb_bill(12)
        self.assertEqual(b12["total_bill"], 1240.0)
        print("✅ Tariff engine tests passed.")

    def test_anomaly_leak_detection(self):
        # Normal reading: 0 flow
        res_normal = leak_detector.analyze_reading(current_reading=10.0, previous_reading=10.0, delta_seconds=600.0)
        self.assertFalse(res_normal["is_leak"])
        
        # Pipe burst: sudden 300 L in 10 mins = 30 L/min -> CRITICAL BURST
        res_burst = leak_detector.analyze_reading(current_reading=10.3, previous_reading=10.0, delta_seconds=600.0)
        self.assertTrue(res_burst["is_leak"])
        self.assertIn("BURST", res_burst["message"])
        print("✅ Anomaly & Leak detection tests passed.")

    def test_rag_assistant(self):
        # Test billing question
        reply_bill = rag_assistant.answer_query("How much is my estimated water bill?")
        self.assertIn("NWSDB", reply_bill)
        
        # Test leak question
        reply_leak = rag_assistant.answer_query("Is there any leak detected?")
        self.assertTrue("leak" in reply_leak.lower())
        
        # Test hardware specs
        reply_hw = rag_assistant.answer_query("What pipe size and camera is used?")
        self.assertIn("3/4 inch", reply_hw)

        # Test snapshot query
        reply_snap = rag_assistant.answer_query("Show me the snapshot history and camera images")
        self.assertTrue("Snapshot" in reply_snap or "Camera" in reply_snap)
        print("✅ RAG Assistant context grounding tests passed.")

    def test_snapshot_history_and_ocr(self):
        # 1. Test digit decomposition
        drums = format_reading_to_digits(37.2468)
        self.assertEqual(len(drums), 5)
        # Expected digits: 0, 0, 3, 7, 2
        extracted_digits = [d["digit"] for d in drums]
        self.assertEqual(extracted_digits, [0, 0, 3, 7, 2])
        self.assertEqual(drums[4]["color"], "red")
        self.assertEqual(drums[4]["role"], "Tenths (Speed #8)")

        # 2. Test recording a live snapshot
        snap = record_snapshot(
            reading=38.1250,
            device_id="TEST_METER_01",
            delta_seconds=600.0,
            previous_reading=38.1000
        )
        self.assertIsNotNone(snap)
        self.assertEqual(snap["reading"], 38.1250)
        self.assertEqual(len(snap["digits"]), 5)
        self.assertEqual([d["digit"] for d in snap["digits"]], [0, 0, 3, 8, 1])
        self.assertGreater(snap["confidence_avg"], 0.99)
        self.assertEqual(snap["delta_volume_liters"], 25.0) # 0.025 m3 = 25 L
        self.assertEqual(snap["flow_rate_lpm"], 2.5) # 25 L in 600s = 2.5 L/min

        # 3. Test querying recent snapshots
        recent = get_recent_snapshots("TEST_METER_01", limit=5)
        self.assertGreaterEqual(len(recent), 1)
        self.assertEqual(recent[0]["id"], snap["id"])
        self.assertTrue(recent[0]["image_url"].startswith("/api/snapshots/"))

        print("✅ Snapshot History and Optical OCR tests passed.")

    def test_real_camera_frame_ingestion(self):
        # Test processing an actual JPEG image through the real camera pipeline
        test_img_path = os.path.join(os.path.dirname(__file__), "backend", "snapshots", "test_dial.jpg")
        with open(test_img_path, "rb") as f:
            img_bytes = f.read()

        snap = process_real_camera_frame(
            image_bytes=img_bytes,
            device_id="TEST_REAL_CAM_01",
            custom_reading=39.5420
        )
        self.assertIsNotNone(snap)
        self.assertEqual(snap["reading"], 39.5420)
        self.assertEqual(len(snap["digits"]), 5)
        self.assertEqual([d["digit"] for d in snap["digits"]], [0, 0, 3, 9, 5])
        self.assertTrue(os.path.exists(os.path.join(os.path.dirname(__file__), "backend", "snapshots", snap["image_filename"])))
        print("✅ Real camera frame ingestion and optical pipeline tests passed.")

if __name__ == "__main__":
    unittest.main()
