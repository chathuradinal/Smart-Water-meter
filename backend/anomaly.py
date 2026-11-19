"""
Leak Detection & Anomaly Recognition Engine for 3/4" Domestic Water Pipes
SRS Reference: FR-05, Section 3
Features:
- Two-Tier Detection:
  1. Statistical & Physics Domain Rules (Night-flow surveillance for 3/4" pipe)
  2. Unsupervised Isolation Forest ML Model with feature contribution scoring
"""

import numpy as np
from datetime import datetime
from sklearn.ensemble import IsolationForest

# 3/4" Domestic Pipe Operating Limits
MAX_EXPECTED_FLOW_LPM = 25.0  # Max typical flow for 3/4 inch tap wide open (~1.5 m3/h)
MICRO_LEAK_MIN_LPM = 0.15     # Minimum detectable leakage (~9 liters/hour)
NIGHT_START_HOUR = 1          # 01:00 AM
NIGHT_END_HOUR = 5            # 05:00 AM

class WaterLeakDetector:
    def __init__(self):
        # Isolation Forest for unsupervised multi-variable anomaly scoring
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.is_fitted = False
        self._bootstrap_model()

    def _bootstrap_model(self):
        """
        Initializes the model with synthetic baseline training points
        representing typical domestic 3/4" water usage patterns.
        Features: [flow_rate_lpm, hour_of_day, is_night, consecutive_flow_count]
        """
        rng = np.random.default_rng(42)
        samples = []
        
        # 1. Normal Daytime (06:00 - 23:00): sporadic showers, dishes, washing
        for _ in range(800):
            hr = int(rng.integers(6, 24))
            flow = float(rng.choice([0.0, 0.0, rng.uniform(2.0, 15.0)]))
            consec = 1 if flow > 0 else 0
            samples.append([flow, hr, 0, consec])
            
        # 2. Normal Nighttime (00:00 - 05:00): 98% zero flow, occasional toilet flush
        for _ in range(400):
            hr = int(rng.integers(0, 6))
            flow = float(rng.choice([0.0, 0.0, 0.0, rng.uniform(1.0, 4.0)]))
            consec = 1 if flow > 0 else 0
            samples.append([flow, hr, 1, consec])
            
        # 3. Rare Leaks (synthetic anomalies): continuous low flow at night
        for _ in range(60):
            hr = int(rng.integers(1, 5))
            flow = float(rng.uniform(0.3, 2.5))
            consec = int(rng.integers(3, 10))
            samples.append([flow, hr, 1, consec])
            
        X = np.array(samples, dtype=np.float32)
        self.model.fit(X)
        self.is_fitted = True

    def analyze_reading(self, current_reading: float, previous_reading: float, 
                        delta_seconds: float = 600.0, consecutive_flow_count: int = 0,
                        timestamp: datetime = None) -> dict:
        """
        Evaluates reading for leaks and anomalies.
        Returns detailed status, alert flag, severity, and diagnostic explanation.
        """
        if timestamp is None:
            timestamp = datetime.now()
            
        hour = timestamp.hour
        is_night = 1 if (NIGHT_START_HOUR <= hour < NIGHT_END_HOUR) else 0
        
        # Calculate consumption in m³ and convert to Liters per Minute (L/min)
        delta_m3 = max(0.0, current_reading - previous_reading)
        delta_liters = delta_m3 * 1000.0
        delta_minutes = max(0.1, delta_seconds / 60.0)
        flow_rate_lpm = delta_liters / delta_minutes
        
        # Update consecutive count
        if flow_rate_lpm >= MICRO_LEAK_MIN_LPM:
            consecutive_flow_count += 1
        else:
            consecutive_flow_count = 0
            
        # Feature vector for ML
        feature_vector = np.array([[flow_rate_lpm, hour, is_night, consecutive_flow_count]], dtype=np.float32)
        ml_score = float(self.model.score_samples(feature_vector)[0])
        
        # Rule 1: High flow burst (> pipe physical threshold)
        if flow_rate_lpm > MAX_EXPECTED_FLOW_LPM:
            return {
                "is_leak": True,
                "severity": "CRITICAL",
                "flow_rate_lpm": round(flow_rate_lpm, 2),
                "consecutive_count": consecutive_flow_count,
                "ml_score": round(ml_score, 4),
                "message": f"CRITICAL BURST DETECTED: Flow rate ({flow_rate_lpm:.1f} L/min) exceeds 3/4\" pipe maximum capacity. Possible pipe rupture!",
                "recommendation": "Shut off main valve immediately and inspect supply line."
            }
            
        # Rule 2: Night-time Continuous Leak (01:00 - 05:00 AM)
        if is_night and consecutive_flow_count >= 2 and flow_rate_lpm >= MICRO_LEAK_MIN_LPM:
            return {
                "is_leak": True,
                "severity": "HIGH",
                "flow_rate_lpm": round(flow_rate_lpm, 2),
                "consecutive_count": consecutive_flow_count,
                "ml_score": round(ml_score, 4),
                "message": f"NIGHT-TIME LEAK ALERT: Continuous flow ({flow_rate_lpm:.2f} L/min) detected for {consecutive_flow_count * 10} minutes during resting hours (01:00-05:00).",
                "recommendation": "Check toilet flappers, overhead tank float valves, or underground pipeline joints."
            }
            
        # Rule 3: Prolonged daytime abnormal flow (e.g. running tap left open)
        if consecutive_flow_count >= 6 and flow_rate_lpm >= 1.0:
            return {
                "is_leak": True,
                "severity": "MEDIUM",
                "flow_rate_lpm": round(flow_rate_lpm, 2),
                "consecutive_count": consecutive_flow_count,
                "ml_score": round(ml_score, 4),
                "message": f"CONTINUOUS UNATTENDED FLOW: Water has been running continuously ({flow_rate_lpm:.1f} L/min) for over {consecutive_flow_count * 10} minutes.",
                "recommendation": "Verify if garden hose, washing machine, or indoor tap was left running."
            }
            
        # Rule 4: Machine Learning Anomaly Score Flag
        if ml_score < -0.18 and flow_rate_lpm > 0.5:
            return {
                "is_leak": True,
                "severity": "LOW",
                "flow_rate_lpm": round(flow_rate_lpm, 2),
                "consecutive_count": consecutive_flow_count,
                "ml_score": round(ml_score, 4),
                "message": f"ANOMALOUS CONSUMPTION PATTERN: Isolation Forest detected usage deviation (Score: {ml_score:.3f}).",
                "recommendation": "Monitor next cycle to determine if persistent."
            }
            
        # Normal State
        return {
            "is_leak": False,
            "severity": "NORMAL",
            "flow_rate_lpm": round(flow_rate_lpm, 2),
            "consecutive_count": consecutive_flow_count,
            "ml_score": round(ml_score, 4),
            "message": "Water usage pattern is within normal domestic parameters.",
            "recommendation": "No action required."
        }

leak_detector = WaterLeakDetector()
