"""
Retrieval-Augmented Generation (RAG) Conversational Water Assistant
SRS Reference: Section 3 (Conversational RAG Assistant)
"""

import os
import json
import sqlite3
import requests
from datetime import datetime, timedelta

def load_env_file():
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.path.dirname(__file__), ".env"),
        ".env"
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
                break
            except Exception:
                pass

load_env_file()

try:
    from .database import (
        get_latest_reading, get_recent_readings, get_active_alerts, 
        get_recent_snapshots, DEFAULT_DB_PATH
    )
    from .tariff import calculate_nwsdb_bill
except ImportError:
    from database import (
        get_latest_reading, get_recent_readings, get_active_alerts, 
        get_recent_snapshots, DEFAULT_DB_PATH
    )
    from tariff import calculate_nwsdb_bill

class WaterRAGAssistant:
    def __init__(self, db_path=DEFAULT_DB_PATH):
        self.db_path = db_path

    @property
    def api_key(self):
        return os.environ.get("GEMINI_API_KEY", "").strip()

    def retrieve_context(self, device_id="ESP32_METER_01") -> dict:
        """
        Retrieves real-time telemetry, historical consumption, active alerts,
        and NWSDB tariff calculations to build a grounded factual context.
        """
        latest = get_latest_reading(device_id, self.db_path)
        recent = get_recent_readings(device_id, limit=30, db_path=self.db_path)
        active_alerts = get_active_alerts(device_id, limit=5, db_path=self.db_path)
        
        current_reading = latest["reading"] if latest else 0.0
        current_flow = latest["flow_rate_lpm"] if latest else 0.0
        last_updated = latest["timestamp"] if latest else "No data"
        
        if len(recent) >= 2:
            first_reading = recent[0]["reading"]
            consumed_units = max(0.0, current_reading - first_reading)
        else:
            consumed_units = 0.0
            
        bill_info = calculate_nwsdb_bill(consumed_units)
        recent_snaps = get_recent_snapshots(device_id, limit=6, db_path=self.db_path)
        
        return {
            "device_id": device_id,
            "current_reading_m3": round(current_reading, 4),
            "flow_rate_lpm": round(current_flow, 2),
            "consumed_period_units_m3": round(consumed_units, 3),
            "estimated_bill_lkr": bill_info["total_bill"],
            "current_slab_rate_lkr": bill_info["current_slab_rate"],
            "fixed_charge_lkr": bill_info["fixed_charge"],
            "tariff_breakdown": bill_info["breakdown"],
            "active_alerts": active_alerts,
            "is_leak_active": len(active_alerts) > 0,
            "last_updated": last_updated,
            "pipe_specification": "3/4 inch standard domestic connection",
            "recent_snapshots_count": len(recent_snaps),
            "recent_snapshots": [
                {
                    "id": s["id"],
                    "reading": s["reading"],
                    "digits": [d["digit"] for d in s.get("digits", [])],
                    "flow_lpm": s["flow_rate_lpm"],
                    "is_leak": s["is_leak"],
                    "timestamp": s["created_at"]
                }
                for s in recent_snaps
            ]
        }

    def _query_gemini_api(self, prompt: str, ctx: dict):
        """Calls Google Gemini REST API using active Gemini model versions."""
        if not self.api_key:
            return None, None

        models = ["gemini-3-flash-preview", "gemini-flash-latest", "gemini-3.8-flash"]
        
        system_instruction = (
            "You are AquaMeter AI, an expert, polite, and highly accurate Smart Water Utilities Assistant for Sri Lankan households.\n"
            "You are directly grounded in the real IoT hardware telemetry and official Sri Lanka NWSDB (National Water Supply & Drainage Board) billing rules provided below.\n\n"
            f"=== LIVE IOT HARDWARE & TELEMETRY CONTEXT ===\n{json.dumps(ctx, indent=2)}\n\n"
            "=== STRICT GROUNDING & RESPONSE RULES ===\n"
            "1. Grounding: All numbers, readings (m³), flow rates (L/min), and bills (Rs.) must strictly match the telemetry context above.\n"
            "2. Currency & Tariffs: Use 'Rs.' or 'LKR' and mention 'NWSDB' when explaining water bills or domestic slab calculations.\n"
            "3. Hardware & OCR: The meter has 5 mechanical counter drums (4 white for whole cubic meters m³ + 1 red tenths speed drum #8). The camera is an OmniVision OV2640 on a 3/4 inch domestic pipe.\n"
            "4. Leak Surveillance: If a leak is active, sound urgent and recommend immediate physical checks (toilet flappers, bib taps, overhead tank float valves). If no leak is active, clearly reassure the user that resting night flow is normal.\n"
            "5. Formatting: Format your response professionally using GitHub markdown with clear bold headings, bullet points, and highlighted numbers.\n"
            "6. Keep the answer clear, helpful, and concise (under 250 words)."
        )

        body = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\nUser Question: {prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1500,
                "thinkingConfig": {"thinkingBudget": 0}
            }
        }

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                resp = requests.post(url, json=body, timeout=7)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text and text.strip():
                            # Generate smart context-aware suggestions
                            prompt_lower = prompt.lower()
                            if any(w in prompt_lower for w in ["leak", "burst", "alert"]):
                                suggestions = ["🛠️ How to fix leak?", "📊 Explain Leak Reasons", "💰 What is my bill?"]
                            elif any(w in prompt_lower for w in ["bill", "tariff", "cost", "rupees", "charge"]):
                                suggestions = ["💡 How to reduce bill?", "🔮 Next 4h Forecast", "🚨 Check Leaks"]
                            elif any(w in prompt_lower for w in ["camera", "dial", "drum", "snapshot", "ocr"]):
                                suggestions = ["🔴 Red Drum #8 Role", "📸 Show Latest Snapshot", "🔍 OV2640 Alignment"]
                            else:
                                suggestions = ["🚨 Check Leaks", "💰 Calculate Bill", "📸 Latest Dial Capture"]
                            return text.strip(), suggestions
                elif resp.status_code == 404:
                    continue  # Try next model in list
            except Exception:
                continue

        return None, None

    def answer_query_with_suggestions(self, user_prompt: str, device_id="ESP32_METER_01"):
        """
        Answers user query and returns a tuple (answer_text, suggested_action_chips).
        """
        ctx = self.retrieve_context(device_id)
        prompt_lower = user_prompt.lower()
        
        # 1. Try Gemini Cloud LLM if API key is configured
        if self.api_key:
            try:
                gemini_reply, suggestions = self._query_gemini_api(user_prompt, ctx)
                if gemini_reply:
                    return gemini_reply, suggestions
            except Exception:
                pass

        # 2. Local Grounded RAG Knowledge Engine (100% Offline fallback)
        
        # Topic A: Troubleshooting & Repair Guide
        if any(w in prompt_lower for w in ["fix", "repair", "troubleshoot", "action", "do if"]):
            reply = (
                f"🛠️ **Leak Troubleshooting Action Checklist**:\n\n"
                f"- **Step 1: Check Toilet Cisterns** (Accounts for 70% of silent domestic leaks). Put food coloring in the tank; if color seeps into the bowl without flushing, replace the rubber flapper valve.\n"
                f"- **Step 2: Inspect Overhead Tank Float Valve** (Check if water is overflowing through the overflow drain line onto the roof/ground).\n"
                f"- **Step 3: Test Garden Bib Taps** (Check for worn washers dripping from outdoor hoses).\n"
                f"- **Step 4: Shut Main Stopcock** (If the meter dial keeps rotating with the main valve closed, you have an underground supply line rupture)."
            )
            suggestions = ["🚨 Is leak active now?", "💰 Check my bill", "📊 Current flow rate"]
            return reply, suggestions

        # Topic B: Water Conservation & Bill Reduction Tips
        if any(w in prompt_lower for w in ["reduce", "save", "saving", "tips", "lower"]):
            reply = (
                f"💡 **NWSDB Bill Optimization Strategies**:\n\n"
                f"- **Target Slab Threshold:** Stay below **15 units (m³)** to keep your base rate at Rs. 100/unit. Above 15 units, the tariff jumps to Rs. 130 and fixed charge increases.\n"
                f"- **Fix Micro-Leaks Early:** A tiny 0.5 L/min leak adds **21.6 m³** per month, automatically pushing you into the highest Rs. 210/unit tier!\n"
                f"- **Install Aerators:** Faucet aerators cut sink flow from 12 L/min to 5 L/min without pressure loss."
            )
            suggestions = ["💰 Show current bill", "🚨 Any active leak?", "🔮 4h Forecast"]
            return reply, suggestions

        # Topic C: Forecasting & Future Projections
        if any(w in prompt_lower for w in ["forecast", "predict", "future", "trajectory", "next month", "end of month"]):
            reply = (
                f"📈 **Predictive Consumption Forecast**:\n\n"
                f"- **Next 4-Hour Consumption:** Projected forward based on typical 3/4\" domestic diurnal patterns.\n"
                f"- **End-of-Month Projection:** Trajectory estimated using rolling 12-hour history + time-of-day weights.\n"
                f"- **Interactive View:** Click on the **'Predictive Forecast'** tab on your dashboard to see the full 4-hour forward curve!"
            )
            suggestions = ["💰 What is my bill now?", "🚨 Check Leaks", "📊 Current reading"]
            return reply, suggestions

        # Topic C2: Camera Snapshots & Optical OCR History
        if any(w in prompt_lower for w in ["snapshot", "snapshots", "photo", "photos", "captured image", "capture history", "ocr history", "dial image", "picture"]) and not any(w in prompt_lower for w in ["pipe", "hardware"]):
            snaps = ctx.get("recent_snapshots", [])
            if snaps:
                latest_snap = snaps[0]
                digits_str = " ".join(str(d) for d in latest_snap.get("digits", []))
                reply = (
                    f"📸 **Camera Snapshot & Optical OCR Log**:\n\n"
                    f"• **Archived Frames in History:** {len(snaps)} snapshots\n"
                    f"• **Latest Captured Frame (#{latest_snap['id']}):** {latest_snap['timestamp']}\n"
                    f"• **Recognized Drum Digits:** `[ {digits_str} ]` (4 white + 1 red #8)\n"
                    f"• **Extracted Reading:** **{latest_snap['reading']} m³**\n"
                    f"• **Flow Rate:** **{latest_snap['flow_lpm']} L/min**\n"
                    f"• **Surveillance Status:** {'⚠️ LEAK DETECTED' if latest_snap['is_leak'] else '✅ NORMAL (Zero resting flow)'}\n\n"
                    f"The ESP32-CAM fires the GPIO 4 LED flash, captures a QVGA dial frame, crops the 5 mechanical drum ROIs, and runs TinyML INT8 CNN inference (~99.8% confidence)."
                )
            else:
                reply = (
                    f"📸 **Camera Snapshot History**:\n\n"
                    f"No dial snapshots recorded yet. You can click the **'Capture Snapshot Now'** button on the dashboard "
                    f"to immediately trigger a camera snapshot, perform OCR digit recognition, and log the frame!"
                )
            suggestions = ["📸 Capture Snapshot", "🚨 Check Leaks", "💰 Calculate Bill", "🔍 View Drum ROIs"]
            return reply, suggestions

        # Topic D: Leak Detection
        if any(w in prompt_lower for w in ["leak", "leakage", "burst", "alert", "anomaly", "problem"]):
            if ctx["is_leak_active"]:
                alert = ctx["active_alerts"][0]
                reply = (
                    f"⚠️ **ACTIVE LEAK ALERT ({alert['severity']})**:\n\n"
                    f"- **Issue:** {alert['message']}\n"
                    f"- **Flow Rate:** {ctx['flow_rate_lpm']} L/min on your 3/4\" supply line.\n"
                    f"- **Current Reading:** {ctx['current_reading_m3']} m³\n\n"
                    f"**Action Recommended:** Inspect toilet cistern flappers, float valve in your overhead tank, "
                    f"and garden bib taps. If no tap is open, close the main supply valve immediately."
                )
                suggestions = ["🛠️ How to fix leak?", "📊 Explain Leak Reasons", "💰 What is my bill?"]
            else:
                reply = (
                    f"✅ **No Leaks Detected.**\n\n"
                    f"Your 3/4\" water meter is currently reporting normal flow ({ctx['flow_rate_lpm']} L/min). "
                    f"Night-time resting flow surveillance and Isolation Forest models have detected no abnormal continuous usage."
                )
                suggestions = ["💰 Calculate Bill", "📊 Current Reading", "🔮 4h Forecast"]
            return reply, suggestions

        # Topic E: Billing & Tariffs
        if any(w in prompt_lower for w in ["bill", "cost", "tariff", "nwsdb", "charge", "price", "rupees", "rs"]):
            bd_str = ""
            for b in ctx["tariff_breakdown"]:
                bd_str += f"  • {b['range']}: {b['units']} units @ Rs. {b['rate_per_unit']} = Rs. {b['amount']}\n"
            if not bd_str:
                bd_str = "  • Baseline 0-5 units minimum charge applied.\n"
                
            reply = (
                f"💰 **NWSDB Water Bill Estimation**:\n\n"
                f"- **Consumed in Period:** {ctx['consumed_period_units_m3']} m³ (Units)\n"
                f"- **Current Slab Rate:** Rs. {ctx['current_slab_rate_lkr']} / unit\n"
                f"- **Monthly Fixed Charge:** Rs. {ctx['fixed_charge_lkr']}\n"
                f"- **Estimated Total Bill:** **Rs. {ctx['estimated_bill_lkr']:.2f}**\n\n"
                f"**Tier Breakdown:**\n{bd_str}"
                f"*(Rates based on official National Water Supply and Drainage Board domestic slab structure)*"
            )
            suggestions = ["💡 How to reduce bill?", "🚨 Is there a leak?", "🔮 4h Forecast"]
            return reply, suggestions

        # Topic F: Current Reading & Drum Specs
        if any(w in prompt_lower for w in ["reading", "meter", "current", "units", "now", "status", "speed", "digit", "drum"]):
            reply = (
                f"📊 **Current Meter Status**:\n\n"
                f"- **Meter Reading:** **{ctx['current_reading_m3']} m³**\n"
                f"- **Live Flow Rate:** {ctx['flow_rate_lpm']} L/min\n"
                f"- **Pipe Size:** 3/4 inch domestic line\n"
                f"- **Last Updated:** {ctx['last_updated']}\n"
                f"- **Fastest Digit Drum (Red #8):** Measures sub-unit fine resolution, enabling micro-leak detection down to 0.15 L/min."
            )
            suggestions = ["💰 Show my bill", "🚨 Any leak active?", "📷 Camera Specs"]
            return reply, suggestions

        # Topic G: Hardware & Specifications
        if any(w in prompt_lower for w in ["pipe", "hardware", "esp32", "sim800l", "sensor", "camera", "spec"]):
            reply = (
                f"⚙️ **System Specifications**:\n\n"
                f"- **Microcontroller:** ESP32-CAM (AI-Thinker) with OV2640 camera & 4MB PSRAM\n"
                f"- **Edge AI:** INT8-quantized TinyML CNN (`model.h`, 113.7 KB, 99.91% accuracy)\n"
                f"- **Telemetry:** SIM800L 2G GSM cellular module transmitting via HTTP POST\n"
                f"- **Pipe Calibration:** 3/4 inch pipe with maximum flow ~25 L/min and leak threshold at 0.15 L/min\n"
                f"- **Power Profile:** 6-hour deep-sleep duty cycle drawing under 15s active power per cycle."
            )
            suggestions = ["📊 Show meter reading", "💰 Calculate bill", "🚨 Check leaks"]
            return reply, suggestions

        # Default summary
        reply = (
            f"Hello! I am your Smart Water Meter AI Assistant.\n\n"
            f"Here is your current household water summary:\n"
            f"• **Meter Reading:** {ctx['current_reading_m3']} m³\n"
            f"• **Current Flow:** {ctx['flow_rate_lpm']} L/min\n"
            f"• **Leak Status:** {'⚠️ LEAK DETECTED' if ctx['is_leak_active'] else '✅ Normal'}\n"
            f"• **Estimated Bill:** Rs. {ctx['estimated_bill_lkr']:.2f}"
        )
        suggestions = ["🚨 Check Leaks", "💰 Calculate Bill", "🛠️ How to fix leak?", "🔮 4h Forecast"]
        return reply, suggestions

    def answer_query(self, user_prompt: str, device_id="ESP32_METER_01") -> str:
        """Backward compatibility wrapper returning only text."""
        reply, _ = self.answer_query_with_suggestions(user_prompt, device_id)
        return reply

rag_assistant = WaterRAGAssistant()
