#!/usr/bin/env python3
"""
Generate 100,000 single-digit (0-9) 28x28 grayscale images from water meter dial templates
for TinyML digit recognition, with augmentations and transitional rotation shifts,
and export the dataset into dataset.csv.
"""

import os
import sys
import time
import subprocess

# Ensure opencv-python and numpy are installed
try:
    import cv2
    import numpy as np
except ImportError:
    print("Installing opencv-python and numpy...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "numpy"])
    import cv2
    import numpy as np


def extract_templates(dial_image_path="base_dial_horizontal.jpg"):
    """
    Crops clean 50x50 pixel squares from the white and red sections of the base dial.
    """
    if not os.path.exists(dial_image_path):
        raise FileNotFoundError(f"Base dial image '{dial_image_path}' not found.")

    dial = cv2.imread(dial_image_path)
    if dial is None:
        raise ValueError(f"Failed to load image from '{dial_image_path}'.")

    h, w, _ = dial.shape
    # Center vertically around y=51: [26:76]
    y_start, y_end = (h // 2) - 25, (h // 2) + 25

    # White section (left half of horizontal dial): x in [65:115]
    white_patch = dial[y_start:y_end, 65:115].copy()

    # Red section (right half of horizontal dial): x in [255:305]
    red_patch = dial[y_start:y_end, 255:305].copy()

    # Save templates for verification
    cv2.imwrite("template_white_50x50.jpg", white_patch)
    cv2.imwrite("template_red_50x50.jpg", red_patch)
    print(f"Extracted pure background templates (50x50): white and red.")

    return white_patch, red_patch


def apply_augmentations(img, rng):
    """
    Applies random augmentations:
    1. +-5 degree rotation
    2. Simulated water droplets (35% probability)
    3. Varying exposure (contrast and brightness)
    4. Gaussian noise
    """
    h, w = img.shape[:2]

    # 1. Rotation +-5 degrees
    angle = rng.uniform(-5.0, 5.0)
    rot_mat = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, 1.0)
    img = cv2.warpAffine(img, rot_mat, (w, h), borderMode=cv2.BORDER_REFLECT)

    # 2. Simulated water droplets (35% probability)
    if rng.random() < 0.35:
        num_droplets = rng.integers(1, 4)
        for _ in range(num_droplets):
            dx = int(rng.integers(6, w - 6))
            dy = int(rng.integers(6, h - 6))
            dr = int(rng.integers(3, 7))

            sub = img.astype(np.float32)
            mask_d = np.zeros((h, w), dtype=np.uint8)
            cv2.circle(mask_d, (dx, dy), dr, 255, -1)

            # Refraction / magnification lens brightness boost
            np.copyto(sub, sub * 1.15, where=(mask_d[:, :, None] == 255))

            # Specular glint highlight at top-left of droplet
            hx = max(0, dx - dr // 2)
            hy = max(0, dy - dr // 2)
            cv2.circle(sub, (hx, hy), max(1, dr // 3), (255, 255, 255), -1)

            # Shadow rim along bottom-right edge of droplet
            cv2.circle(sub, (dx, dy), dr, (30, 30, 30), 1)
            img = np.clip(sub, 0, 255).astype(np.uint8)

    # 3. Varying exposure (contrast and brightness)
    alpha = rng.uniform(0.78, 1.22)
    beta = rng.uniform(-18.0, 18.0)
    img = np.clip(alpha * img.astype(np.float32) + beta, 0, 255).astype(np.uint8)

    # 4. Gaussian noise
    sigma = rng.uniform(2.0, 9.0)
    noise = rng.normal(0, sigma, img.shape)
    img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    return img


def render_digit(digit, is_red_bg, white_bg, red_bg, rng):
    """
    Renders digit onto 50x50 background with blocky font and Y-axis shift
    simulating transitional mechanical digits.
    """
    bg = red_bg if is_red_bg else white_bg
    img = bg.copy()

    font = cv2.FONT_HERSHEY_DUPLEX
    scale = 1.15
    thickness = 2
    pitch = 38

    # Digit color
    if is_red_bg:
        # White text with subtle natural shade variations
        c = int(rng.integers(235, 256))
        color = (c, c, c)
    else:
        # Dark text with subtle natural shade variations
        c = int(rng.integers(15, 38))
        color = (c, c, c)

    # Baseline center: x around 14 (+-3 px jitter)
    x = 14 + int(rng.integers(-3, 4))

    # Y-axis shift to simulate half-rotated transitional digits
    y_shift = int(rng.integers(-17, 18))
    base_y = 36 + y_shift

    # Draw primary digit
    cv2.putText(img, str(digit), (x, base_y), font, scale, color, thickness, cv2.LINE_AA)

    # If shifted significantly, draw transitional adjacent digit entering from top/bottom
    if y_shift < -6:
        next_digit = (digit + 1) % 10
        cv2.putText(img, str(next_digit), (x, base_y + pitch), font, scale, color, thickness, cv2.LINE_AA)
    elif y_shift > 6:
        prev_digit = (digit - 1) % 10
        cv2.putText(img, str(prev_digit), (x, base_y - pitch), font, scale, color, thickness, cv2.LINE_AA)

    # Apply augmentations (rotation, droplets, exposure, noise)
    img = apply_augmentations(img, rng)

    # Convert to 28x28 grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (28, 28), interpolation=cv2.INTER_AREA)

    return resized.flatten()


def generate_dataset(num_samples=100000, output_csv="dataset.csv", batch_size=5000):
    t_start = time.time()
    print(f"Generating {num_samples:,} samples for TinyML dataset...")

    white_bg, red_bg = extract_templates("base_dial_horizontal.jpg")

    # Reproducible random generator
    rng = np.random.default_rng(42)

    # Generate balanced labels (10,000 per digit 0-9)
    labels = np.repeat(np.arange(10, dtype=np.uint8), num_samples // 10)
    rng.shuffle(labels)

    # Background flags: 50% white, 50% red
    is_red = rng.choice([True, False], size=num_samples)

    # Write to CSV in batches
    header = "label," + ",".join(f"pixel{i}" for i in range(784)) + "\n"

    total_batches = (num_samples + batch_size - 1) // batch_size
    with open(output_csv, "w", buffering=8 * 1024 * 1024) as f:
        f.write(header)

        for b in range(total_batches):
            idx_start = b * batch_size
            idx_end = min(idx_start + batch_size, num_samples)
            b_count = idx_end - idx_start

            lines = []
            for i in range(idx_start, idx_end):
                digit = int(labels[i])
                red_flag = bool(is_red[i])
                flat_pixels = render_digit(digit, red_flag, white_bg, red_bg, rng)

                # Format as CSV line: label,val0,val1,...,val783
                line = str(digit) + "," + ",".join(map(str, flat_pixels)) + "\n"
                lines.append(line)

            f.writelines(lines)
            elapsed = time.time() - t_start
            print(f"Progress: {idx_end:,}/{num_samples:,} samples generated ({((b + 1) / total_batches) * 100:.1f}%) in {elapsed:.1f}s")

    t_total = time.time() - t_start
    csv_size_mb = os.path.getsize(output_csv) / (1024 * 1024)
    print(f"\nDataset generation completed successfully!")
    print(f"Exported to: {output_csv} ({csv_size_mb:.2f} MB)")
    print(f"Total time: {t_total:.2f} seconds ({num_samples / t_total:.1f} samples/sec)")


if __name__ == "__main__":
    generate_dataset()

