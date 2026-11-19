#!/usr/bin/env python3
"""
Crop the mechanical water meter digit window and erase all numbers
using OpenCV inpainting to generate a clean, textured base dial template.
"""

import sys
import subprocess

# Automatically verify / install required packages
try:
    import cv2
    import numpy as np
except ImportError:
    print("Installing required packages (opencv-python, numpy)...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "numpy"])
    import cv2
    import numpy as np


def locate_digit_window(img):
    """
    Locates the rectangular window containing the water meter digits.
    Uses calibrated bounding box coordinates for image.png.
    """
    # Exact coordinates for the rectangular digit window in image.png
    return 370, 770, 1018, 1120


def generate_base_dial(image_path="image.png", output_path="base_dial.jpg"):
    # 1. Load image
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image at {image_path}")

    # 2. Crop the rectangular window containing the digits
    ymin, ymax, xmin, xmax = locate_digit_window(img)
    cropped = img[ymin:ymax, xmin:xmax].copy()
    h, w, _ = cropped.shape
    print(f"Cropped rectangular window: {w}x{h} pixels [Y: {ymin}:{ymax}, X: {xmin}:{xmax}]")

    # 3. Create precise inpainting mask for digits
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    mask = np.zeros((h, w), dtype=np.uint8)

    # The transition from white rollers to red rollers is near the vertical midpoint
    split_y = int(h * 0.49)

    # Top section (white rollers):
    # Digits (0, 3, 7, 2), m^3 mark, and any dark markings are darker than background.
    # We use a Black Hat transform to extract darker structures on non-uniform light background.
    white_roi = gray[26:split_y, 14:w - 4]
    kernel_bhat = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    blackhat = cv2.morphologyEx(white_roi, cv2.MORPH_BLACKHAT, kernel_bhat)
    _, mask_white = cv2.threshold(blackhat, 16, 255, cv2.THRESH_BINARY)
    mask[26:split_y, 14:w - 4] = mask_white

    # Bottom section (red rollers):
    # Numbers (4, 6, 3, 8) and graduation marks are white/bright.
    # In BGR, white numbers have high green/blue values compared to red plastic.
    # We use Top Hat on the green channel to capture bright text on dark-green red background.
    red_roi_g = cropped[split_y:h - 24, 12:w - 4, 1]
    kernel_tophat = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    tophat_g = cv2.morphologyEx(red_roi_g, cv2.MORPH_TOPHAT, kernel_tophat)
    _, mask_red_white = cv2.threshold(tophat_g, 22, 255, cv2.THRESH_BINARY)

    # Also capture dark pointer/index marks on the red section
    red_roi_bgr = cropped[split_y:h - 24, 12:w - 4]
    r_chan = red_roi_bgr[:, :, 2]
    gray_red = gray[split_y:h - 24, 12:w - 4]
    dark_on_red = (r_chan < 110) & (gray_red < 90)
    mask_red = cv2.bitwise_or(mask_red_white, (dark_on_red.astype(np.uint8) * 255))
    mask[split_y:h - 24, 12:w - 4] = mask_red

    # Morphological dilation to cover anti-aliasing edges around strokes
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_dilated = cv2.dilate(mask, kernel_dilate, iterations=1)

    # 4. Digitally erase digits using OpenCV Inpainting (Telea algorithm)
    base_dial = cv2.inpaint(cropped, mask_dilated, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    # 5. Save blank textured background template
    cv2.imwrite(output_path, base_dial, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Saved template to {output_path}")

    # Also save horizontally oriented version for convenience
    horiz_path = output_path.replace(".jpg", "_horizontal.jpg")
    cv2.imwrite(horiz_path, cv2.rotate(base_dial, cv2.ROTATE_90_COUNTERCLOCKWISE), [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    print(f"Saved horizontal template to {horiz_path}")

    return base_dial


if __name__ == "__main__":
    generate_base_dial()
