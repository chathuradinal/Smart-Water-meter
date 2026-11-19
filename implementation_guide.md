IoT Smart Water Meter Retrofitting - Full Implementation Guide
Phase 1: TinyML Model Development (Python/TensorFlow)
Train the CNN on the synthetic dataset, quantize it, and export it to a C++ header to fit on the ESP32-CAM.

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
import os

# 1. Load Dataset
print("Loading dataset.csv...")
data = pd.read_csv('dataset.csv')
labels = data['label'].values
pixels = data.drop('label', axis=1).values

# Normalize and reshape to 28x28 grayscale matrices
pixels = pixels / 255.0
pixels = pixels.reshape(-1, 28, 28, 1)

# Split data (80% training, 20% testing)
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(pixels, labels, test_size=0.2, random_state=42)

# 2. Build the lightweight CNN Model
model = models.Sequential([
    layers.Conv2D(16, (3,3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D(2, 2),
    layers.Conv2D(32, (3,3), activation='relu'),
    layers.MaxPooling2D(2,2),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

# 3. Post-Training Integer Quantization (INT8)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
def representative_dataset():
    for i in range(100):
        yield [X_train[i].astype(np.float32)]
converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model = converter.convert()

# 4. Save and generate model.h for ESP32
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)

# Converts the binary file into a C-style array
os.system('xxd -i model.tflite > model.h')
print("Model saved and converted to model.h successfully.")
Phase 2: Web Dashboard & AI Leak Detection (Python/Flask)
The cloud server receives the numeric data, estimates the Sri Lankan NWSDB bill, and runs the Isolation Forest algorithm to detect continuous abnormal usage.

from flask import Flask, request, jsonify, render_template_string
import sqlite3
import pandas as pd
from sklearn.ensemble import IsolationForest

app = Flask(__name__)

# Initialize SQLite DB
def init_db():
    conn = sqlite3.connect('water_data.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY, device_id TEXT, reading REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/data', methods=['POST'])
def receive_data():
    content = request.json
    device_id = content['device_id']
    reading = content['reading']
    
    conn = sqlite3.connect('water_data.db')
    c = conn.cursor()
    c.execute("INSERT INTO readings (device_id, reading) VALUES (?, ?)", (device_id, reading))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success"}), 200

@app.route('/')
def dashboard():
    conn = sqlite3.connect('water_data.db')
    df = pd.read_sql_query("SELECT * FROM readings ORDER BY timestamp DESC LIMIT 100", conn)
    conn.close()
    
    alert = False
    if len(df) > 10:
        # AI Anomaly Detection for Micro-Leaks
        model = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = model.fit_predict(df[['reading']])
        if df.iloc[0]['anomaly'] == -1:
            alert = True
            
    # Simple NWSDB Slab Tariff Calculation Logic
    latest_reading = df.iloc[0]['reading'] if not df.empty else 0
    bill = latest_reading * 150 # Simplified cost mapping per unit
    
    return f"""
    <html>
    <head><style>body {{ font-family: Arial; padding: 20px; }} .alert {{ background: red; color: white; padding: 15px; font-weight: bold; }}</style></head>
    <body>
    <h1>Smart Water Dashboard</h1>
    {'<div class="alert">ALERT: CONTINUOUS FLOW/LEAK DETECTED</div>' if alert else ''}
    <h2>Latest Meter Reading: {latest_reading} Units</h2>
    <h2>Estimated Bill: Rs. {bill}</h2>
    </body>
    </html>
    """

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
Phase 3: ESP32-CAM Firmware (C++/Arduino)
The edge microcontroller code orchestrating the camera, TinyML inference, cellular transmission, and the deep-sleep power cycle.

#include <esp_camera.h>
#include "model.h" // The generated TinyML quantized array

// Pin Definitions for SIM800L
#define RX_PIN 14 // Connected to voltage divider
#define TX_PIN 15

// 6-hour deep sleep cycle
#define TIME_TO_SLEEP  21600 
#define uS_TO_S_FACTOR 1000000

void setup() {
  Serial.begin(115200);
  
  // 1. Initialize Camera (Assuming standard AI-Thinker config)
  camera_config_t config;
  // (Full pin configuration maps go here)
  esp_camera_init(&config);
  
  // Turn on LED Flash (GPIO 4) to illuminate the meter dial
  pinMode(4, OUTPUT);
  digitalWrite(4, HIGH);
  delay(1000); // Allow light to settle
  
  // 2. Capture Image
  camera_fb_t * fb = esp_camera_fb_get();
  digitalWrite(4, LOW); // Turn off flash immediately to save power
  
  // 3. TinyML Inference
  // Using TensorFlow Lite Micro, the image buffer is cropped and fed into the model
  // For demonstration, we assume the extracted numerical result is stored in 'extracted_reading'
  int extracted_reading = 1234; 
  
  esp_camera_fb_return(fb); // Free memory
  
  // 4. Transmit via SIM800L (AT Commands over HTTP)
  Serial1.begin(9600, SERIAL_8N1, RX_PIN, TX_PIN);
  delay(3000); // Allow SIM to lock onto 2G network
  
  Serial1.println("AT+HTTPINIT");
  delay(1000);
  Serial1.println("AT+HTTPPARA=\"URL\",\"http://YOUR_SERVER_IP:5001/api/data\"");
  delay(1000);
  Serial1.println("AT+HTTPDATA=50,10000"); // Prepare to send JSON
  delay(1000);
  
  String payload = "{\"device_id\":\"ESP32_METER_01\", \"reading\":" + String(extracted_reading) + "}";
  Serial1.println(payload);
  delay(1000);
  
  Serial1.println("AT+HTTPACTION=1"); // Execute POST Request
  delay(3000);
  Serial1.println("AT+HTTPTERM");
  
  // 5. Enter Deep Sleep
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  esp_deep_sleep_start();
}

void loop() {
  // Loop is entirely empty because the device sleeps after setup() completes.
}

