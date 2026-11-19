# IoT Hardware Assembly & Physical Implementation Guide
### Retrofitting AI-Thinker ESP32-CAM to 3/4" Mechanical Water Meters

This guide details the exact physical items, wiring schematics, optical calibration, and firmware flashing steps required to build and deploy the physical camera edge node.

---

## 1. Bill of Materials (Complete Items List)

| Item | Component | Specification | Quantity | Role / Notes |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Microcontroller & Camera** | AI-Thinker ESP32-CAM + OV2640 Lens | 1 | 240MHz Dual-Core, 4MB PSRAM, 2MP sensor with M12 adjustable lens. |
| **2** | **Flashing Programmer** | FTDI USB-to-TTL (FT232RL or CP2102) | 1 | Required to program ESP32-CAM via USB. (Or use ESP32-CAM-MB baseboard). |
| **3** | **Power Supply (Lab / Demo)** | 5V 2A USB Wall Adapter / Cable | 1 | Powers the ESP32-CAM. Peak current reaches 1.5A when Flash LED fires. |
| **4** | **Power Supply (Field Pit)** | 2× 18650 Li-ion Cells (7.4V) in holder | 1 | Autonomous battery power for outdoor meter pit deployment. |
| **5** | **Voltage Regulator** | LM2596 DC-DC Step-Down Buck Converter | 1 | Regulates 7.4V battery pack down to stable 4.3V–5.0V. |
| **6** | **Cellular Modem (Optional)** | SIM800L GPRS/GSM Module + Micro-SIM | 1 | 2G cellular telemetry for remote underground meter pits without Wi-Fi. |
| **7** | **Filter Capacitor** | 1000 µF Electrolytic (16V or higher) | 1 | Prevents voltage sag during 2A cellular burst transmissions. |
| **8** | **Level Shifter Resistors** | 1× 1 kΩ and 1× 2.2 kΩ (1/4W) | 2 | Voltage divider protecting 2.8V SIM800L RX pin from 3.3V ESP32 TX. |
| **9** | **Wiring & Prototyping** | Dupont Jumper Wires (F-F, M-F) | 1 set | For breadboard / harness connections. |
| **10** | **Mechanical Shroud** | 50mm PVC Coupler or 3D Printed Shroud | 1 | 6.5 cm spacer block ensuring fixed focus and zero sunlight glare. |

---

## 2. Flashing the ESP32-CAM (Step-by-Step)

Because the ESP32-CAM lacks an onboard USB chip, connect an **FTDI USB-to-TTL Adapter** as shown below:

```
[FTDI USB-to-TTL]               [ESP32-CAM Module]
   VCC (Set jumper to 5V) ──────► 5V
   GND ─────────────────────────► GND
   TXD ─────────────────────────► U0R (GPIO 3)
   RXD ─────────────────────────► U0T (GPIO 1)
   
                                  GPIO 0 ──┐ (BRIDGE REQUIRED FOR FLASHING)
                                  GND ─────┘
```

### Flashing Procedure in Arduino IDE:
1. **Install ESP32 Board Package**:
   - Go to `Preferences` -> Additional Boards Manager URLs:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to `Tools` -> `Board` -> `Boards Manager` -> Search `esp32` -> Install version `2.0.x` or latest.
2. **Configure Board Settings**:
   - **Board**: `AI Thinker ESP32-CAM`
   - **CPU Frequency**: `240MHz (WiFi/BT)`
   - **Flash Frequency**: `80MHz`
   - **Flash Mode**: `QIO`
   - **Partition Scheme**: `Huge APP (3MB No OTA / 1MB SPIFFS)`
   - **PSRAM**: `Enabled` (Crucial for image frame buffer)
   - **Upload Speed**: `115200` or `921600`
3. **Flashing**:
   - Connect **GPIO 0 to GND** with a jumper wire.
   - Plug the FTDI programmer into your computer's USB port.
   - Press the tiny **RST (Reset)** button on the back of the ESP32-CAM.
   - Click **Upload** in Arduino IDE.
   - Once uploading reaches 100% (`Leaving... Hard resetting via RTS pin`), **disconnect the GPIO 0 from GND jumper wire**.
   - Press the **RST** button again to run the firmware!

---

## 3. Firmware Selection

You have two ready-to-use firmware options in the [`iot/firmware/`](file:///Users/chathurakarunarathna/Desktop/Final%20Project/iot/firmware/) folder:

### Option A: Wi-Fi Live Stream & Auto-Uploader (`esp32_cam_wifi.ino`)
* **Best for**: Testing, lab setups, indoor meters, or homes within Wi-Fi range.
* **Function**: 
  - Connects to your local Wi-Fi / mobile hotspot.
  - Fires the GPIO 4 Flash LED and snaps real frames every 30 seconds.
  - Sends HTTP POST directly to `http://<YOUR_COMPUTER_IP>:5001/api/camera/upload`.
  - Also serves a live view at `http://<ESP32_IP>/capture` for direct dashboard viewing.

### Option B: Edge TinyML + SIM800L Cellular (`water_meter_firmware.ino`)
* **Best for**: Outdoor underground meter pit deployment without Wi-Fi.
* **Function**:
  - Runs on-device INT8 TinyML CNN model (`model.h`) in ESP32 PSRAM.
  - Classifies the 5 mechanical drum digits in ~45 ms.
  - Sends JSON telemetry over 2G SIM800L AT commands.
  - Enters deep sleep for 10 minutes or 6 hours to conserve battery.

---

## 4. Optical Focus Calibration (Physical Hack)

> [!IMPORTANT]
> The OmniVision OV2640 camera arrives from the factory glued at **infinite focus** (~1 meter distance). If placed 6.5 cm from a water meter, the image will be completely blurry!

1. Inspect the tiny brass lens ring on the camera module.
2. You will notice a tiny bead of transparent factory glue securing the thread.
3. Gently hold the camera board flat, and using a pair of small needle-nose pliers or tweezers, gently turn the lens counter-clockwise to break the glue seal.
4. Rotate the lens **2 to 3 full counter-clockwise turns**.
5. Power the camera and stream the feed into the Dashboard. Point the camera at a printed test dial at a distance of **6.5 cm**.
6. Fine-tune the ring 1/8 turn at a time until the thin mechanical drum edges and red fastest drum #8 markings become razor sharp.
7. (Optional) Apply a tiny drop of hot glue or tape on the edge to lock the focus permanently.

---

## 5. Physical Wiring Schematics

### A. Standalone Wi-Fi Operation (Lab / Indoor Setup)
```
[5V 2A USB Adapter] ──┬── (+) 5V ──────► ESP32-CAM (5V pin)
                      └── (-) GND ─────► ESP32-CAM (GND pin)
```

### B. Cellular Outdoor Pit Deployment (SIM800L + Battery)
```
[2x 18650 Li-ion Battery: 7.4V]
             │
             ▼
[LM2596 Step-Down Buck Converter] ── (Trimmer adjusted to 4.3V)
             │
             ├──────────────────────────┬──────────────────────────┐
             │ +4.3V                    │ +4.3V                    │
             ▼                          ▼                          │
    [ESP32-CAM (5V Pin)]       [SIM800L (VCC Pin)]                 │
             │                          │                          │
             │                          │        [1000µF Capacitor]
             │                          │        (+) to VCC, (-) to GND
             ▼                          ▼                          │
           [GND] ───────────────────── [GND] ──────────────────────┘
                                        │
                                        │ (Common Ground)

SIM800L to ESP32-CAM UART Interface:
ESP32-CAM GPIO 15 (TX) ───[ 1 kΩ Resistor ]───┬───► SIM800L RXD (Protected 2.8V)
                                               │
                                     [ 2.2 kΩ Resistor ]
                                               │
                                              GND

ESP32-CAM GPIO 14 (RX) ◄─────────────────────────── SIM800L TXD (Direct connection)
```

---

## 6. Mechanical Shroud & Anti-Glare Mounting

1. **Distance**: Mount the lens precisely **6.5 cm** perpendicularly from the top of the dial glass cover.
2. **5° Anti-Glare Angle**: Mount the camera tilted slightly at a 5° angle relative to the glass plane. This causes the high-power GPIO 4 LED flash to reflect away from the lens, eliminating specular washout on the mechanical drum digits.
3. **Light Shielding**: Use a black cylinder (50mm PVC pipe coupler or 3D printed housing) around the water meter head. This blocks daylight shadows, direct sun reflections, and rain.
