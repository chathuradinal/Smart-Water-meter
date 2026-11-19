"""
AI Feature 2: Predictive Time-Series Forecasting for Water Consumption
SRS Reference: AI Subsystems Section 3 & ai_features.md
Forecasts next 4 hours (24 x 10-min steps) and projects end-of-month bill trajectory.
"""

import numpy as np
from datetime import datetime, timedelta
try:
    from .database import get_recent_readings, DEFAULT_DB_PATH
    from .tariff import calculate_nwsdb_bill
except ImportError:
    from database import get_recent_readings, DEFAULT_DB_PATH
    from tariff import calculate_nwsdb_bill

WINDOW = 72    # 12 hours of 10-min history
HORIZON = 24   # 4 hours forward forecast (24 intervals)

class WaterForecaster:
    def __init__(self, db_path=DEFAULT_DB_PATH):
        self.db_path = db_path

    def get_forecast(self, device_id="ESP32_METER_01") -> dict:
        """
        Generates 4-hour ahead consumption forecast and projected monthly spend.
        Uses time-decayed diurnal profile combined with recent telemetry trends.
        """
        readings = get_recent_readings(device_id, limit=WINDOW, db_path=self.db_path)
        now = datetime.now()
        
        # Extract recent flow rates, clamped to realistic 3/4" domestic pipe bounds (0 - 25 L/min)
        recent_flows = [
            min(25.0, max(0.0, float(r["flow_rate_lpm"])))
            for r in readings
            if r["flow_rate_lpm"] <= 50.0  # filter out first-record uncalibrated delta anomalies
        ]
        recent_mean = float(np.mean(recent_flows[-6:])) if recent_flows else 1.2
        
        # Diurnal baseline pattern for 3/4" domestic household (24 hours)
        # Hour -> typical flow in L/min
        DIURNAL_WEIGHTS = {
            0: 0.05, 1: 0.02, 2: 0.01, 3: 0.01, 4: 0.02, 5: 0.1,
            6: 1.2,  7: 2.8,  8: 3.5,  9: 2.1, 10: 1.4, 11: 1.1,
            12: 1.8, 13: 1.5, 14: 0.9, 15: 0.8, 16: 1.2, 17: 2.0,
            18: 3.2, 19: 3.8, 20: 3.0, 21: 2.2, 22: 1.1, 23: 0.4
        }
        
        forecast_points = []
        forecast_labels = []
        total_projected_liters_4h = 0.0
        
        for step in range(1, HORIZON + 1):
            future_time = now + timedelta(minutes=10 * step)
            future_hr = future_time.hour
            time_label = future_time.strftime("%H:%M")
            forecast_labels.append(time_label)
            
            # Blend diurnal expected curve with current trend
            diurnal_base = DIURNAL_WEIGHTS.get(future_hr, 1.0)
            # Damped continuity from recent mean flow
            decay = max(0.0, 1.0 - (step / 18.0))
            predicted_lpm = round((diurnal_base * (1.0 - decay * 0.5)) + (recent_mean * decay * 0.5), 2)
            predicted_lpm = max(0.0, predicted_lpm)
            
            forecast_points.append(predicted_lpm)
            total_projected_liters_4h += (predicted_lpm * 10.0) # 10 minutes interval
            
        projected_4h_m3 = round(total_projected_liters_4h / 1000.0, 4)
        
        # Project 30-day monthly consumption based on daily average
        # Typical Sri Lankan household uses ~10-25 units (m3) per month
        daily_projected_m3 = (projected_4h_m3 * 6.0) # 24h approximation
        monthly_projected_units = max(5.0, min(80.0, round(daily_projected_m3 * 30.0, 2)))
        
        projected_bill = calculate_nwsdb_bill(monthly_projected_units)
        
        return {
            "status": "success",
            "horizon_hours": 4,
            "forecast_intervals": HORIZON,
            "labels": forecast_labels,
            "predicted_flow_lpm": forecast_points,
            "projected_4h_m3": projected_4h_m3,
            "projected_monthly_units_m3": monthly_projected_units,
            "projected_monthly_bill_lkr": projected_bill["total_bill"],
            "model_type": "Diurnal-Trend Predictive Forecaster"
        }

forecaster = WaterForecaster()
