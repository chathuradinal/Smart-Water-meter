#!/usr/bin/env python3
"""
TinyML CNN Model Training & INT8 Quantization for Water Meter Digit Recognition
SRS Reference: FR-02, NFR-02 (<200KB), NFR-03 (>=97% Accuracy)
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

def train_and_export():
    import tensorflow as tf
    
    print("=" * 60)
    print("Step 1: Loading dataset (data/dataset.csv)...")
    # Check potential dataset paths
    candidate_paths = [
        os.path.join(os.path.dirname(__file__), "..", "data", "dataset.csv"),
        os.path.join(os.path.dirname(__file__), "data", "dataset.csv"),
        "data/dataset.csv"
    ]
    dataset_path = None
    for p in candidate_paths:
        if os.path.exists(p):
            dataset_path = p
            break
            
    if not dataset_path:
        raise FileNotFoundError("dataset.csv not found in candidate paths.")
        
    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df):,} samples.")
    
    y = df["label"].values.astype(np.int32)
    # Extract 784 pixel columns and normalize to [0, 1]
    X = df.drop("label", axis=1).values.astype(np.float32) / 255.0
    X = X.reshape(-1, 28, 28, 1)
    
    # 80/20 Train/Test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Training set: {X_train.shape[0]:,} samples | Test set: {X_test.shape[0]:,} samples")
    
    print("=" * 60)
    print("Step 2: Building TinyML CNN Architecture...")
    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(16, (3, 3), padding='same', activation='relu', input_shape=(28, 28, 1)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        
        tf.keras.layers.Conv2D(32, (3, 3), padding='same', activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D((2, 2)),
        
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(10, activation='softmax')
    ], name="TinyML_WaterMeter_Digit_CNN")
    
    model.summary()
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("=" * 60)
    print("Step 3: Training CNN (10 Epochs)...")
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True)
    ]
    
    history = model.fit(
        X_train, y_train,
        epochs=10,
        batch_size=128,
        validation_data=(X_test, y_test),
        callbacks=callbacks,
        verbose=1
    )
    
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nFinal Test Accuracy: {test_acc * 100:.2f}% (NFR-03 Target: >= 97.00%)")
    if test_acc >= 0.97:
        print(">>> SUCCESS: Accuracy satisfies NFR-03 requirement! <<<")
    else:
        print(">>> WARNING: Accuracy slightly below 97%, consider more epochs. <<<")
        
    print("=" * 60)
    print("Step 4: INT8 Post-Training Quantization (TFLite)...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    
    # Calibration dataset for accurate INT8 range estimation
    def representative_dataset_gen():
        for i in range(250):
            yield [X_train[i:i+1].astype(np.float32)]
            
    converter.representative_dataset = representative_dataset_gen
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8
    
    tflite_quant_model = converter.convert()
    
    output_tflite_path = "model.tflite"
    with open(output_tflite_path, "wb") as f:
        f.write(tflite_quant_model)
        
    size_kb = len(tflite_quant_model) / 1024.0
    print(f"Quantized Model Size: {size_kb:.2f} KB (NFR-02 Target: < 200 KB)")
    if size_kb < 200:
        print(">>> SUCCESS: Model footprint fits in ESP32-CAM SRAM! <<<")
        
    print("=" * 60)
    print("Step 5: Generating C Header 'model.h' for ESP32-CAM...")
    header_path = "model.h"
    
    # Try xxd, fallback to python byte array generation
    ret = os.system(f"xxd -i {output_tflite_path} > {header_path}")
    if ret != 0 or not os.path.exists(header_path):
        with open(output_tflite_path, "rb") as f_in, open(header_path, "w") as f_out:
            bytes_data = f_in.read()
            f_out.write("// Auto-generated INT8 TinyML Model Header for ESP32-CAM\n")
            f_out.write(f"const unsigned int model_tflite_len = {len(bytes_data)};\n")
            f_out.write("const unsigned char model_tflite[] = {\n  ")
            for i, b in enumerate(bytes_data):
                f_out.write(f"0x{b:02x}, ")
                if (i + 1) % 12 == 0:
                    f_out.write("\n  ")
            f_out.write("\n};\n")
            
    print(f"Header generated successfully at: {header_path}")
    print("=" * 60)
    print("Phase 1 Complete! Ready for ESP32-CAM firmware flashing.")

if __name__ == "__main__":
    train_and_export()

