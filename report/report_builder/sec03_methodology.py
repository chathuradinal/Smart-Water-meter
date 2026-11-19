# sec03_methodology.py

CHAPTER_03_MD = """# Chapter 03: METHODOLOGY

## 3.1 Research Design & Overall Architectural Framework

### 3.1.1 Multi-Tier Architectural Topology
To address the research questions and overcome the constraints of legacy mechanical metering, the system is designed around a three-tier distributed architecture spanning:
1. **The Edge Layer (Hardware IoT Node):** An autonomous, battery-operated embedded node mounted over the physical water meter register, executing optical digit recognition on-chip using TinyML.
2. **The Cloud Backend Layer (Analytical Services & Database):** A centralized server infrastructure hosting the REST API, persistent relational database, two-tier leak detection engine, consumption forecaster, explainable AI module, NWSDB slab billing engine, and conversational RAG assistant.
3. **The Presentation Layer (Client Application Dashboard):** A modern, dark-mode aquatic React 18 Single Page Application (SPA) delivering real-time telemetry visualization, animated mechanical roller counters, interactive leak simulation controls, snapshot audit tooling, and conversational AI interfaces.

The interaction and dataflow among these tiers are illustrated in **Figure 3.1**.

```
+----------------------------------------------------------------------------------------------------+
|                                    FIGURE 3.1: SYSTEM ARCHITECTURE                                 |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ EDGE LAYER: IoT Retrofit Node ]                                                                 |
|  +-----------------------------------------------------------------------------------------------+ |
|  | Mechanical Meter Dial -> LED Flash -> OV2640 (QVGA) -> ROI Cropping (5x 28x28)                | |
|  |           |                                                                                   | |
|  |           v                                                                                   | |
|  | TinyML INT8 CNN (TFLM on ESP32-CAM) -> Extracted Numeric Reading (m³)                         | |
|  |           |                                                                                   | |
|  |           v                                                                                   | |
|  | SIM800L 2G GSM Modem (HTTP POST: device_id, reading) -> Deep Sleep Power Down (RTC)          | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                              |                                                     |
|                                        (Cellular 2G)                                               |
|                                              v                                                     |
|  [ CLOUD BACKEND LAYER: Python Flask + SQLite ]                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  |  Flask REST Ingestion (/api/data)                                                             | |
|  |  +-----------------------------------------------------------------------------------------+  | |
|  |  | Flow Rate & Delta Vol Calculation (Q = dV / dt)                                         |  | |
|  |  +-----------------------------------------------------------------------------------------+  | |
|  |           |                                                                                   | |
|  |           +-------------------+--------------------+--------------------+                    | |
|  |           |                   |                    |                    |                    | |
|  |           v                   v                    v                    v                    | |
|  |   [ Two-Tier Leak ]    [ 4-Hour Diurnal ]   [ Explainable AI ]  [ NWSDB Domestic ]           | |
|  |   [   Detector    ]    [   Forecaster   ]   [  (XAI Module)  ]  [  Tariff Engine ]           | |
|  |   - Rule Thresholds    - Diurnal Weights    - Feature Scoring   - 10 Progressive Slabs       | |
|  |   - Isolation Forest   - Monthly Projection - Natural Language  - Fixed Monthly Charges      | |
|  |           |                   |                    |                    |                    | |
|  |           +-------------------+--------------------+--------------------+                    | |
|  |                                              |                                                | |
|  |                                              v                                                | |
|  |                                  [ SQLite: water_data.db ]                                    | |
|  |                      (readings, alerts, users, chat_history, snapshots)                       | |
|  |                                              ^                                                | |
|  |                                              | (Context Retrieval)                            | |
|  |                                  [ Conversational RAG ]                                       | |
|  |                                  - Google Gemini API / Offline Local Keyword Fallback         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                              ^                                                     |
|                                         (REST JSON)                                                |
|                                              v                                                     |
|  [ PRESENTATION LAYER: React 18 + Vite SPA ]                                                       |
|  +-----------------------------------------------------------------------------------------------+ |
|  | - 3D Mechanical Roller Drum Animation (4 White m³ + 1 Red Sub-unit #8 Drum)                    | |
|  | - Calibrated 3/4" Pipe Flow Gauge (0–25 L/min) & Anomaly Flagged Time-Series Charts            | |
|  | - Explainable Anomaly Breakdown & Diurnal 4-Hour Consumption Forecast Visualizations          | |
|  | - Snapshot History Cards Gallery & Full-Resolution OCR Bounding Box Inspection Modal           | |
|  | - Grounded Conversational AI Assistant with Contextual Follow-Up Suggestion Chips              | |
|  | - Multi-User Authentication & Interactive Scenario Simulator (Normal / Micro-Leak / Burst)     | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

### 3.1.2 End-to-End Operational Workflow
The end-to-end operation executes in discrete, cyclic stages:
1. **Periodic Wakeup:** The edge node awakes from low-power deep sleep via its internal Real-Time Clock (RTC) timer every 10 minutes (or standard 6-hour surveillance intervals).
2. **Optical Acquisition:** The high-power white LED flash is pulsed for $500\\text{ ms}$, illuminating the mechanical dial without ambient shadows. The OV2640 camera captures a $320\\times 240$ grayscale QVGA frame.
3. **Edge Optical Character Recognition:** Five predefined 28×28 pixel Regions of Interest (ROIs) corresponding to the roller drum windows are cropped. The INT8 TinyML CNN executes sequential classification on each window directly within the ESP32-CAM SRAM, assembling the five predicted digits into a verified numeric reading ($m^3$).
4. **Cellular Ingestion:** The SIM800L 2G GSM modem initializes an HTTP POST connection, transmitting a compact 120-byte JSON payload containing the device ID, timestamp, and numeric reading to the Flask `/api/data` endpoint.
5. **Analytical Processing:** The backend calculates instantaneous flow velocity (L/min) based on the volumetric change $\\Delta V$ and elapsed time $\\Delta t$. It immediately routes the telemetry through the two-tier leak detection engine (physics rules + Isolation Forest), updates the 4-hour consumption forecaster, computes the current NWSDB slab bill, and persists all metadata to the SQLite database.
6. **Consumer Presentation & Decision Support:** The React dashboard updates live telemetry over REST endpoints. If an anomaly is identified, high-priority visual alert banners are surfaced. Users can interactively converse with the grounded RAG assistant to diagnose leaks, inspect snapshot audit frames, and receive bill optimization recommendations.

---

## 3.2 Data Collection & Dataset Generation

### 3.2.1 Synthetic Dial Image Dataset Generation
To train a high-accuracy, robust Convolutional Neural Network capable of optical character recognition across weathered utility environments without requiring millions of manual physical meter captures, a rigorous synthetic data generation pipeline was implemented (`data/generate_tinyml_dataset.py`).

Mechanical meter roller drums in Sri Lanka exhibit specific visual properties: narrow character aspect ratios, sans-serif embossed typography, mechanical alignment imperfections, and surface degradation. The dataset generation script synthesizes 10,000 augmented variations for each Arabic numeral digit ($0$ through $9$), yielding an aggregate primary training and testing corpus of **100,000 image samples**.

Each synthetic sample is subjected to realistic stochastic optical transformations modeling outdoor field conditions:
- **Perspective and Angular Rotation:** Random affine rotations within $[-15^{\\circ}, +15^{\\circ}]$ to accommodate mechanical dial inclination and mounting tolerances.
- **Optical Defocus & Lens Blur:** Gaussian spatial blurring applied with kernel sizes ranging from $1\\times 1$ to $3\\times 3$ ($\\\\sigma \\in [0.5, 1.8]$), simulating fixed-focus depth-of-field deviations of the OV2640 M12 lens.
- **Sensor Noise Injection:** Zero-mean additive Gaussian noise ($\\\\mu = 0, \\\\sigma^2 \\in [0.01, 0.08]$) simulating CMOS sensor thermal noise during low-light nocturnal captures.
- **Contrast & Illumination Shifts:** Random scaling of pixel intensities by factors between $0.6$ and $1.4$, modeling uneven LED flash dispersion, ambient daylight ingress, and scratched acrylic lenses.

The resulting dataset is serialized to `data/dataset.csv`, structured as 100,000 rows, each comprising an integer class label ($0–9$) followed by 784 normalized pixel intensity values ($28\\times 28$ matrix). The technical specifications of the dataset are detailed in **Table 3.1**.

### Table 3.1: Outline of the 100,000-Sample Synthetic Water Meter Dial Dataset

| Dataset Parameter | Technical Specification | Operational Justification & Environmental Modeling |
| :--- | :--- | :--- |
| **Total Sample Volume** | 100,000 unique annotated image crops | Sufficient statistical density to train deep representation without overfitting |
| **Target Classes** | 10 classes (Numerals '0' through '9') | Direct mapping to 10 decimal roller drum positions on mechanical register |
| **Class Distribution** | Exactly 10,000 samples per class | Perfectly balanced distribution preventing categorical gradient bias |
| **Spatial Dimensions** | $28\\times 28$ pixels, single-channel (Grayscale) | Optimized input dimension matching standard TinyML memory constraints |
| **Pixel Intensity Range** | $[0.0, 1.0]$ floating-point (quantized to $[-128, 127]$) | Normalized input tensor format required for INT8 neural networks |
| **Augmentation: Rotation** | Stochastic uniform sampling $\\theta \\in [-15^{\\circ}, +15^{\\circ}]$ | Simulates mechanical mounting tilt and dial wheel angular jitter |
| **Augmentation: Noise** | Additive Gaussian noise ($\\\\sigma \\le 0.08$) | Simulates thermal shot noise of low-cost OV2640 sensor in night captures |
| **Augmentation: Blur** | Gaussian filter ($\\\\sigma \\in [0.5, 1.8]$) | Simulates slight focal distance variations at close range ($5–8\\text{ cm}$) |
| **Augmentation: Contrast** | Multiplicative luminance scaling ($0.6\\times$ to $1.4\\times$) | Simulates flash reflection on wet, scratched, or aged meter acrylic |
| **Data Partitioning** | 80% Training ($80,000\\text{ samples}$), 20% Testing ($20,000\\text{ samples}$) | Stratified split ensuring uniform class representation across partitions |

### 3.2.2 Operational Flow Telemetry Dataset
In addition to the optical digit dataset, a longitudinal time-series telemetry baseline of **1,260 flow readings** was synthesized based on real-world hydraulic profiles of domestic 3/4-inch residential connections in Sri Lanka. 

The telemetry baseline models three operational regimes:
1. **Normal Daytime Domestic Usage (800 samples):** Realistic intermittent consumption spikes corresponding to morning hygiene ($06:00–08:30\\text{ AM}$, $5–15\\text{ L/min}$), midday domestic cooking/cleaning ($11:30\\text{ AM}–01:30\\text{ PM}$, $2–8\\text{ L/min}$), and evening domestic activities ($06:00–09:00\\text{ PM}$, $4–12\\text{ L/min}$).
2. **Normal Nocturnal Resting Baseline (400 samples):** Uninterrupted zero-flow periods between $01:00\\text{ AM}$ and $05:00\\text{ AM}$ ($Q = 0.0\\text{ L/min}$) representing quiescent household sleep states.
3. **Hydraulic Failure and Leakage Profiles (60 samples):** Controlled anomalous injections modeling continuous micro-leakage ($0.15–1.5\\text{ L/min}$), unattended prolonged daytime flow ($>1.0\\text{ L/min}$ for $>60\\text{ min}$), and full-bore catastrophic service pipe ruptures ($>25.0\\text{ L/min}$).

This dual dataset foundation provides the training and benchmarking substrate for the machine learning and analytical pipelines.

---

## 3.3 Data Preprocessing & Input Tensor Normalization Pipeline

The optical preprocessing pipeline transforms raw visual frames captured by the OV2640 camera into optimized numerical tensors suitable for INT8 neural inference on the microcontroller:

```
[ Raw Camera Frame: 320x240 Grayscale ]
                  |
                  v
[ Static ROI Coordinate Slicing: 5x Bounding Boxes ]
                  |
                  v
[ Spatial Rescaling: 28x28 Bilinear Interpolation ]
                  |
                  v
[ Dynamic Range Normalization: Float [0, 1] ]
                  |
                  v
[ INT8 Affine Quantization: q = round(r/S) + Z -> Int8 [-128, 127] ]
                  |
                  v
[ Feed to TensorFlow Lite Micro Input Tensor Arena ]
```

### Optical Alignment and Dial ROI Mapping
Mechanical water meters utilized in Sri Lanka conform to international ISO 4064 standards, presenting a five-drum horizontal numeric register. The four leftmost white-on-black drums register integer cubic metres ($10^3, 10^2, 10^1, 10^0\\text{ m}^3$), while the rightmost red drum registers fractional tenths of a cubic metre (increments of $100\\text{ litres}$, designated as the "Speed #8" dial).

To minimize memory allocation, the ESP32-CAM firmware avoids executing full-frame object detection. Instead, fixed 3D mechanical shrouding maintains constant optical alignment at a working focal distance of $6.5\\text{ cm}$. The firmware performs direct sub-array memory slicing on the QVGA ($320\\times 240\\text{ pixels}$) frame buffer, extracting five discrete $28\\times 28$ Region of Interest (ROI) windows as illustrated in **Figure 3.2** and detailed below:
- **Drum 1 (Thousands - White):** Top-left coordinate $(X=40, Y=55)$, dimension $28\\times 28\\text{ px}$.
- **Drum 2 (Hundreds - White):** Top-left coordinate $(X=72, Y=55)$, dimension $28\\times 28\\text{ px}$.
- **Drum 3 (Tens - White):** Top-left coordinate $(X=104, Y=55)$, dimension $28\\times 28\\text{ px}$.
- **Drum 4 (Ones - White):** Top-left coordinate $(X=136, Y=55)$, dimension $28\\times 28\\text{ px}$.
- **Drum 5 (Tenths / Sub-unit - Red):** Top-left coordinate $(X=168, Y=55)$, dimension $28\\times 28\\text{ px}$.

```
+-----------------------------------------------------------------------------------------------+
|                    FIGURE 3.2: MECHANICAL DIAL FACEPLATE ROI MAPPING                          |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|   +---------------------------------------------------------------------------------------+   |
|   |  OV2640 Captured Frame (QVGA: 320 x 240 Grayscale)                                    |   |
|   |                                                                                       |   |
|   |         Y=55                                                                          |   |
|   |          |    [ROI 1]     [ROI 2]     [ROI 3]     [ROI 4]     [ROI 5]                 |   |
|   |          v   +-------+   +-------+   +-------+   +-------+   +-------+                |   |
|   |              |   0   |   |   1   |   |   4   |   |   8   |   |   5   |                |   |
|   |              +-------+   +-------+   +-------+   +-------+   +-------+                |   |
|   |              X=40        X=72        X=104       X=136       X=168                    |   |
|   |              (1000s)     (100s)      (10s)       (1s)        (0.1s Red)               |   |
|   |                                                                                       |   |
|   |              Cumulative Meter Reading: 0148.5 m³ (148,500 Litres)                     |   |
|   +---------------------------------------------------------------------------------------+   |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

Each cropped $28\\times 28$ pixel matrix is normalized from unsigned 8-bit integers ($[0, 255]$) to floating-point values in $[0.0, 1.0]$. Prior to invocation of the on-chip interpreter, the values are quantized into signed 8-bit integers ($[-128, 127]$) matching the model's calibration scale factor ($S = 0.00392157$, zero-point $Z = -128$).

---

## 3.4 Hardware Engineering & IoT Edge Node Design

### 3.4.1 Bill of Materials (BOM) & Microcontroller Selection
The edge node is engineered to minimize unit procurement cost, ensuring wide economic feasibility across Sri Lankan domestic connections. The complete hardware Bill of Materials (BOM) is presented in **Table 3.2**.

### Table 3.2: Bill of Materials (BOM) for IoT Edge Retrofitting Node

| Component Description | Part Model / Specification | Functional Role in Subsystem | Unit Cost (USD) |
| :--- | :--- | :--- | :--- |
| **Microcontroller Unit (MCU)** | AI-Thinker ESP32-CAM (Xtensa LX6 240MHz, 520KB SRAM, 4MB PSRAM) | On-device TinyML inference, RTC sleep management, camera control | \\$4.80 |
| **Image Sensor** | OmniVision OV2640 (2 Megapixel, Grayscale QVGA mode, M12 Lens) | Captures high-contrast dial images at short focal distance | Included with MCU |
| **Cellular Modem** | SIMCom SIM800L Quad-Band 2G GSM/GPRS Module | Wireless HTTP POST telemetry over national cellular network | \\$3.50 |
| **DC-DC Step-Down Regulator** | LM2596 Adjustable Switching Buck Converter (Input 7.4V $\\rightarrow$ Output 4.3V) | High-efficiency voltage regulation capable of 3.0A peak current | \\$1.10 |
| **Power Storage Reserves** | 2× 18650 Li-ion Rechargeable Cells (Series: 7.4V nominal, 2,600 mAh each) | Autonomous battery energy reserve for outdoor field operation | \\$4.00 |
| **Transient Buffer Capacitor** | 1,000 µF, 16V Low-ESR Electrolytic Capacitor | Absorbs 2.0A GSM transmission RF burst current spikes | \\$0.25 |
| **Level-Shifting Resistors** | 1.0 kΩ and 2.2 kΩ, 1/4W Metal Film Resistors | Passive voltage divider shifting ESP32 3.3V TX to SIM800L 2.8V RX | \\$0.05 |
| **Optical Enclosure Shroud** | Custom 3D Printed Shroud (PETG, Matte Black internal coating) | Mechanically clamps to 3/4" meter register; eliminates ambient sunlight | \\$2.50 |
| **Total Component Hardware Cost** | **Complete Edge Retrofitting Assembly** | **Autonomous Smart Meter Edge Node** | **\\$16.20** |

At a total bill-of-materials cost of approximately **USD \\$16.20 (approximately Rs. 5,000 LKR)**, the retrofitting module is an order of magnitude more affordable than commercial smart meters ($USD \\$150–\\$300$).

### 3.4.2 Electrical Circuit Design, Level Shifting & Transient Buffering
The electrical interconnect schematic is illustrated in **Figure 3.3**. Operating an ESP32-CAM and a SIM800L module from a shared battery supply requires careful electrical design:
1. **Power Regulation:** The twin 18650 lithium-ion cells provide an unregulated nominal voltage of $7.4\\text{ V}$ ($8.4\\text{ V}$ fully charged). The LM2596 high-efficiency switching regulator steps this voltage down to exactly **$4.3\\text{ V}$**. This regulated rail feeds both the ESP32-CAM 5V pin (which contains an internal low-dropout regulator stepping down to $3.3\\text{ V}$) and the SIM800L VCC pin (rated for $3.7–4.4\\text{ V}$, nominally $4.0\\text{ V}$).
2. **Transient GSM Burst Buffering:** The SIM800L 2G transceiver draws short RF transmission pulses of up to **$2.0\\text{ A}$** during GPRS burst slots. Insufficient power supply stiffness during these bursts causes the modem voltage to drop below $3.4\\text{ V}$, triggering automatic brownout reset. To prevent this, a **$1,000\\text{ µF}$ low-ESR electrolytic capacitor** is soldered directly across the SIM800L VCC and GND pins, acting as an instantaneous energy buffer.
3. **UART Logic-Level Conversion:** The ESP32-CAM operates at $3.3\\text{ V}$ CMOS logic, whereas the SIM800L baseband processor operates at $2.8\\text{ V}$ logic (maximum safe input $3.0\\text{ V}$). Connecting ESP32 TX directly to SIM800L RX can cause electrical overstress. A passive voltage divider is inserted between ESP32 GPIO 15 (TX) and SIM800L RXD:

$$V_{out} = V_{in} \\times \\frac{R_2}{R_1 + R_2} = 3.3\\text{ V} \\times \\frac{2.2\\text{ k}\\Omega}{1.0\\text{ k}\\Omega + 2.2\\text{ k}\\Omega} = 3.3\\text{ V} \\times 0.6875 = 2.27\\text{ V}$$

The resulting $2.27\\text{ V}$ logic high exceeds the SIM800L $V_{IH}$ threshold ($2.1\\text{ V}$) while remaining safely below the $2.8\\text{ V}$ maximum limit. Conversely, SIM800L TXD ($2.8\\text{ V}$) connects directly to ESP32 GPIO 14 (RX), as $2.8\\text{ V}$ satisfies the ESP32 $3.3\\text{ V}$ logic-high threshold ($0.75 \\times V_{DD} \\approx 2.47\\text{ V}$) without requiring shifting.

```
+-----------------------------------------------------------------------------------------------+
|                       FIGURE 3.3: ELECTRICAL INTERCONNECT SCHEMATIC                           |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  [ 2x 18650 Li-ion ] (7.4V Nom)                                                               |
|          |                                                                                    |
|          v                                                                                    |
|  [ LM2596 DC-DC Buck ] ------+------> Regulated 4.3V Power Rail                               |
|                              |                                                                |
|                              +---------> ESP32-CAM [ 5V Pin ]                                 |
|                              |                                                                |
|                              +----+----> [ 1000 µF Low-ESR Capacitor ]                        |
|                                   |                                                           |
|                                   +----> SIM800L [ VCC Pin ]                                  |
|                                                                                               |
|  [ ESP32-CAM GPIO 15 (TX) ] ----[ 1.0 kΩ ]----+----> SIM800L [ RXD ] (2.27V)                  |
|                                               |                                               |
|                                            [ 2.2 kΩ ]                                         |
|                                               |                                               |
|                                              GND                                              |
|                                                                                               |
|  [ ESP32-CAM GPIO 14 (RX) ] <----------------------- SIM800L [ TXD ] (2.8V Direct)            |
|                                                                                               |
|  Common Ground Plane: [ Battery (-) === LM2596 GND === ESP32 GND === SIM800L GND ]           |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

### 3.4.3 Optical Alignment, Illumination & Custom Enclosure Shroud
To guarantee consistent image contrast independent of external weather, a custom enclosure shroud was 3D printed using ultraviolet-resistant PETG filament. The shroud mechanically clips over the brass rim of standard 3/4-inch meter registers, fixing the OV2640 camera lens at an exact working distance of $6.5\\text{ cm}$. The interior walls are treated with non-reflective matte black coating to suppress optical glare. 

Before frame acquisition, the ESP32-CAM activates its onboard high-intensity white LED (driven via GPIO 4) for $500\\text{ ms}$. This controlled flash floods the dial faceplate, overwhelming ambient sunlight or shadow variations and creating uniform grayscale pixel contrast across all five roller drums.

### 3.4.4 Power Management, Sleep Modes & Energy Budget Formulation
To maximize field longevity on dual 18650 cells ($2,600\\text{ mAh}$ total capacity at $7.4\\text{ V} = 19,240\\text{ mWh}$), the node executes a strict finite state machine governed by the ESP32 Real-Time Clock (RTC) timer, as depicted in **Figure 3.4**:

```
+-----------------------------------------------------------------------------------------------+
|                     FIGURE 3.4: DEEP SLEEP SURVEILLANCE STATE MACHINE                         |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|   +---------------------------------------------------------------------------------------+   |
|   |                                                                                       |   |
|   |   +-------------------------+            RTC Timer Wakeup Interrupt                   |   |
|   |   |   DEEP SLEEP STATE      | ------------------------------------------------+       |   |
|   |   | Current: ~45 µA         |                                                 |       |   |
|   |   | Duration: 10 min / 6 hr | <---------------------------------------+       |       |   |
|   |   +-------------------------+                                         |       |       |   |
|   |                                                                       |       v       |   |
|   |                                                           +-----------------------+   |   |
|   |                                                           | ACTIVE CAMERA STATE   |   |   |
|   |                                                           | Current: 180 mA       |   |   |
|   |                                                           | Duration: ~800 ms     |   |   |
|   |                                                           +-----------------------+   |   |
|   |                                                                       |               |   |
|   |                                                                       v               |   |
|   |   +-------------------------+                             +-----------------------+   |   |
|   |   | ACTIVE GSM TRANSMISSION |                             | ACTIVE TINYML INFER   |   |   |
|   |   | Current: ~250 mA (avg)  | <-------------------------- | Current: 140 mA       |   |   |
|   |   | Duration: ~3.5 s        |     Extracted Numeric       | Duration: ~230 ms     |   |   |
|   |   +-------------------------+       JSON Payload          +-----------------------+   |   |
|   |                |                                                                      |   |
|   |                +----------------------------------------------------------------------+   |
|   |                                    Shutdown All Peripherals & Sleep                       |   |
|   +---------------------------------------------------------------------------------------+   |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

The mathematical energy budget per surveillance cycle $E_{cycle}$ is modeled as:

$$E_{cycle} = (I_{cam} \\times V \\times t_{cam}) + (I_{ml} \\times V \\times t_{ml}) + (I_{gsm} \\times V \\times t_{gsm}) + (I_{sleep} \\times V \\times t_{sleep})$$

Using empirical circuit parameters at $V = 4.3\\text{ V}$:
- **Camera Capture Stage:** $I_{cam} = 180\\text{ mA}$, $t_{cam} = 0.8\\text{ s} \\implies 172.0\\text{ µWh}$
- **TinyML Inference Stage:** $I_{ml} = 140\\text{ mA}$, $t_{ml} = 0.23\\text{ s} \\implies 38.4\\text{ µWh}$
- **GSM Telemetry Stage:** $I_{gsm} = 250\\text{ mA}$ (mean active current), $t_{gsm} = 3.5\\text{ s} \\implies 1,045.1\\text{ µWh}$
- **Deep Sleep State:** $I_{sleep} = 45\\text{ µA}$, $t_{sleep} = 595.47\\text{ s}$ ($10\\text{ min}$ cycle) $\\implies 32.0\\text{ µWh}$

Total energy consumption per 10-minute cycle is approximately $1,287.5\\text{ µWh}$ ($1.288\\text{ mWh}$). At 144 cycles per day, daily energy expenditure equals $185.5\\text{ mWh}$. Assuming an 80% usable capacity discharge efficiency on a $19,240\\text{ mWh}$ battery bank:

$$\\text{Operational Lifespan} = \\frac{19,240\\text{ mWh} \\times 0.80}{185.5\\text{ mWh/day}} \\approx \\mathbf{83.0\\text{ days (High-Frequency 10-Min Surveillance)}}$$

When operating in standard utility surveillance mode (capturing hourly and transmitting once daily or only upon verified volumetric change as demonstrated by Nikić et al.), average daily consumption drops to $<40\\text{ mWh/day}$, delivering an operational lifespan exceeding **180 to 450 days** on a single charge.

---

## 3.5 TinyML Convolutional Neural Network Pipeline

### 3.5.1 CNN Architecture Topology
To achieve high recognition accuracy on mechanical dial digits without exceeding the static RAM limits of the ESP32-CAM, a compact Convolutional Neural Network was designed (`models/train_model.py`). The architectural topology balances receptive field expansion against parameter volume, utilizing two sequential $3\\times 3$ convolutional layers paired with batch normalization, max-pooling, dense representation, and dropout regularization.

The structural specification of each layer is detailed in **Table 3.3**.

### Table 3.3: Convolutional Neural Network Layer Architecture & Tensor Shapes

| Layer Index & Type | Activation Function | Filter Configuration / Kernel Size | Output Tensor Shape | Parameter Count |
| :--- | :--- | :--- | :--- | :--- |
| **0. Input Layer** | None | Raw single-channel grayscale crop | $(28, 28, 1)$ | 0 |
| **1. Conv2D** | ReLU | 16 filters, $3\\times 3$ kernel, stride 1, padding='same' | $(28, 28, 16)$ | 160 |
| **2. BatchNormalization** | None | Normalizes channel activations ($\\\\gamma, \\\\beta, \\\\mu, \\\\sigma$) | $(28, 28, 16)$ | 64 |
| **3. MaxPooling2D** | None | $2\\times 2$ spatial pool, stride 2 | $(14, 14, 16)$ | 0 |
| **4. Conv2D** | ReLU | 32 filters, $3\\times 3$ kernel, stride 1, padding='same' | $(14, 14, 32)$ | 4,640 |
| **5. BatchNormalization** | None | Normalizes channel activations | $(14, 14, 32)$ | 128 |
| **6. MaxPooling2D** | None | $2\\times 2$ spatial pool, stride 2 | $(7, 7, 32)$ | 0 |
| **7. Flatten** | None | Vectorizes spatial feature maps | $(1568)$ | 0 |
| **8. Dense** | ReLU | 64 fully connected units | $(64)$ | 100,416 |
| **9. Dropout** | None | 20% random feature drop during training | $(64)$ | 0 |
| **10. Dense (Output)** | Softmax | 10 categorical output units (Classes $0–9$) | $(10)$ | 650 |
| **Total Parameter Count** | **Full FP32 Baseline** | **Trainable: 105,962 \| Non-Trainable: 96** | **Uncompressed Size: 424.3 KB** | **106,058** |

### 3.5.2 Training Regime & Hyper-Parameter Optimization
The model was compiled and trained using TensorFlow 2.15 under the following hyper-parameter configuration:
- **Loss Function:** Sparse Categorical Cross-Entropy, mapping integer class labels directly without one-hot expansion.
- **Optimization Algorithm:** Adam optimizer with an initial learning rate $\\eta = 0.001$, $\\\\beta_1 = 0.9$, $\\\\beta_2 = 0.999$, and $\\\\epsilon = 10^{-7}$.
- **Batch Size:** 128 samples per gradient update step.
- **Training Epochs:** 10 epochs with early stopping callbacks monitoring validation loss (`patience=3`, `restore_best_weights=True`).
- **Validation Partition:** 20% random stratified split held out from the 80,000 training samples.

### 3.5.3 Post-Training Quantization (PTQ) to INT8 Precision
Following convergence of the 32-bit floating-point (FP32) model, full 8-bit integer quantization was executed using the TensorFlow Lite Converter (`tf.lite.TFLiteConverter`). Full integer quantization requires generating an empirical calibration dataset representative of typical inference inputs. A calibration set of 250 normalized images sampled across all ten digit classes was passed through the converter to determine dynamic range scaling factors ($S$) and zero-points ($Z$) for all intermediate activation tensors.

Both the network inputs and outputs were constrained to signed 8-bit integers (`tf.int8`). Quantization compressed the binary model size from **424.3 KB down to 113.7 KB**—a **73.2% memory reduction** that enables the model to reside entirely within the ESP32 internal SRAM without spilling into slower external PSRAM.

### 3.5.4 TensorFlow Lite Micro C-Header Deployment
The quantized `.tflite` flatbuffer was converted into an initialized C byte array using the system utility `xxd -i model.tflite > model.h`. This header file is directly compiled into the ESP32-CAM Arduino firmware (`iot/firmware/water_meter_firmware.ino`). 

At firmware boot, the `tflite::MicroInterpreter` is instantiated using `tflite::AllOpsResolver`. A continuous memory buffer—the **Tensor Arena**—of **$64\\text{ KB}$** is statically allocated in RAM. During each inference cycle, the five $28\\times 28$ cropped drum windows are sequentially copied into the interpreter input tensor, inference is triggered via `Invoke()`, and the classified digit is determined by selecting the categorical index of the maximum output logit. The complete TinyML pipeline is depicted in **Figure 3.5**.

```
+-----------------------------------------------------------------------------------------------+
|                    FIGURE 3.5: TINYML ON-CHIP DEPLOYMENT PIPELINE                             |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  [ Keras FP32 Model ] (424 KB)                                                                |
|           |                                                                                   |
|           v                                                                                   |
|  [ TFLite Converter: INT8 Post-Training Quantization + 250 Calibration Samples ]              |
|           |                                                                                   |
|           v                                                                                   |
|  [ Quantized Flatbuffer: model.tflite ] (113.7 KB)                                            |
|           |                                                                                   |
|           v                                                                                   |
|  [ C-Header Byte Array: xxd -i -> model.h ]                                                   |
|           |                                                                                   |
|           v                                                                                   |
|  [ ESP32-CAM Firmware: TFLM MicroInterpreter + 64KB Static Tensor Arena ]                     |
|           |                                                                                   |
|           +---> Drum 1 Crop (28x28) ---> Invoke() ---> Digit '0' (Conf: 99.8%)                |
|           +---> Drum 2 Crop (28x28) ---> Invoke() ---> Digit '1' (Conf: 99.9%)                |
|           +---> Drum 3 Crop (28x28) ---> Invoke() ---> Digit '4' (Conf: 99.7%)                |
|           +---> Drum 4 Crop (28x28) ---> Invoke() ---> Digit '8' (Conf: 99.9%)                |
|           +---> Drum 5 Crop (28x28) ---> Invoke() ---> Digit '5' (Conf: 99.6%)                |
|                                                                                               |
|  [ Final Assembly: 0148.5 m³ -> Transmit via SIM800L HTTP POST ]                             |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

---

## 3.6 Two-Tier Leak & Anomaly Detection Engine

The analytical backend (`backend/anomaly.py`) implements a hybrid Two-Tier Leak Detection Engine designed to overcome the limitations of purely statistical or purely rule-based anomaly detection.

### 3.6.1 Hydraulic Calibration for 3/4-Inch Domestic Supply Lines
To eliminate false alarms caused by normal fixture usage while maintaining sensitivity to micro-leaks, all detection parameters are calibrated against the physical fluid dynamics of standard 3/4-inch ($20\\text{ mm}$) domestic supply lines in Sri Lanka. The calibration constants are detailed in **Table 3.4**.

### Table 3.4: Hydraulic Calibration Parameters for 3/4-Inch Domestic Water Service Line

| Hydraulic Parameter | Physical Value | Engineering Basis & Diagnostic Significance |
| :--- | :--- | :--- |
| **Pipe Nominal Diameter** | 3/4 inch ($20\\text{ mm}$) | Universal domestic residential service line diameter standardized by NWSDB |
| **Max Expected Flow ($Q_{max}$)** | $25.0\\text{ L/min}$ ($1.5\\text{ m}^3/\\text{hour}$) | Maximum physical gravity/pumped discharge with all household fixtures open |
| **Micro-Leak Floor ($Q_{leak\\_min}$)** | $0.15\\text{ L/min}$ ($9.0\\text{ L/hour}$) | Minimum detectable leakage threshold (toilet flapper or cracked joint) |
| **Nocturnal Surveillance Window** | $01:00\\text{ AM} - 05:00\\text{ AM}$ | Quiescent household resting period where human water consumption is zero |
| **Prolonged Daytime Flow Floor** | $1.0\\text{ L/min}$ | Sustained flow indicating an unattended running hose or open tap |
| **Prolonged Daytime Duration** | $\\ge 6\\text{ intervals}$ ($60\\text{ minutes}$) | Maximum reasonable duration for continuous domestic appliance draw |

Flow velocity $Q_t$ in litres per minute is dynamically computed between successive readings as:

$$Q_t = \\frac{(R_t - R_{t-1}) \\times 1,000}{\\Delta t / 60}$$

where $R_t$ and $R_{t-1}$ represent consecutive cumulative readings in cubic metres ($m^3$), and $\\Delta t$ denotes the elapsed time in seconds. A physical integrity check automatically rejects negative flow rates ($R_t < R_{t-1}$), as municipal water meters incorporate mechanical non-return ratchet pawls preventing backwards rotation.

### 3.6.2 Tier 1: Deterministic Physics and Domain Rules
Tier 1 evaluates the computed flow velocity and temporal context against four deterministic domain rules, prioritizing critical plumbing safety without waiting for machine learning model convergence. The rule hierarchy is specified in **Table 3.5**.

### Table 3.5: Two-Tier Leak Detection Engine Multi-Rule Specification

| Rule ID | Severity Level | Exact Trigger Logic Condition | Physical Diagnosis & Automatic Action |
| :--- | :--- | :--- | :--- |
| **Rule 1** | **CRITICAL** | $Q_t > 25.0\\text{ L/min}$ | **Catastrophic Pipe Burst / Main Rupture:** Flow exceeds maximum physical capacity of 3/4" pipe. Immediate emergency alert issued. |
| **Rule 2** | **HIGH** | Hour $\\in [01:00, 05:00]$ **AND** $C_{flow} \\ge 2$ **AND** $Q_t \\ge 0.15\\text{ L/min}$ | **Nocturnal Resting Leak:** Unbroken flow during sleeping hours indicates toilet cistern leak, tank float valve failure, or underground line break. |
| **Rule 3** | **MEDIUM** | $C_{flow} \\ge 6$ **AND** $Q_t \\ge 1.0\\text{ L/min}$ (Any Hour) | **Prolonged Unattended Daytime Flow:** Continuous non-zero flow exceeding 60 minutes indicates an open garden hose or overflow. |
| **Rule 4** | **LOW** | Isolation Forest Score $s < -0.18$ **AND** $Q_t > 0.5\\text{ L/min}$ | **Statistical Consumption Anomaly:** Flow behavior significantly deviates from baseline household consumption clusters. |

where $C_{flow}$ represents the counter of consecutive non-zero flow readings.

### 3.6.3 Tier 2: Unsupervised Isolation Forest Machine Learning Engine
When telemetry passes Tier 1 rules without triggering critical or nocturnal alarms, it is processed by Tier 2: an unsupervised Isolation Forest machine learning model (`sklearn.ensemble.IsolationForest`). Isolation Forest is exceptionally suited for utility anomaly detection because it isolates anomalous outliers in feature space by recursively partitioning random feature splits, requiring no labeled failure datasets.

The model processes a four-dimensional feature vector for each incoming reading:

$$\\mathbf{x}_t = \\left[ Q_t, \\; H_t, \\; I_{night}, \\; C_{flow} \\right]$$

where $Q_t$ is the instantaneous flow rate (L/min), $H_t$ is the continuous hour of day ($0–23$), $I_{night} \\in \\{0, 1\\}$ is a binary flag indicating the nocturnal resting window, and $C_{flow}$ is the consecutive continuous flow counter.

The Isolation Forest is configured with 100 decision trees (`n_estimators=100`), a contamination factor of 5% (`contamination=0.05`), and bootstrap sampling on the baseline telemetry dataset. It outputs an anomaly score $s \\in [-1.0, 1.0]$:

$$s(\\mathbf{x}, n) = 2^{-\\frac{E(h(\\mathbf{x}))}{c(n)}}$$

where $E(h(\\mathbf{x}))$ is the average path length across all isolation trees, and $c(n)$ is the average path length of unsuccessful searches in a Binary Search Tree constructed from $n$ samples. Readings producing an anomaly score $s < -0.18$ combined with flow $Q_t > 0.5\\text{ L/min}$ are classified as statistically anomalous (Rule 4). The dual-tier operational flow is depicted in **Figure 3.6**.

```
+-----------------------------------------------------------------------------------------------+
|                       FIGURE 3.6: TWO-TIER LEAK DETECTION FLOW                                |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  [ New Reading Ingested: (Rt, dt) -> Compute Flow Qt ]                                        |
|                          |                                                                    |
|                          v                                                                    |
|  [ TIER 1: DETERMINISTIC DOMAIN PHYSICS RULES ]                                               |
|  +-----------------------------------------------------------------------------------------+  |
|  | - Is Qt > 25.0 L/min? -----------------------------------> [ CRITICAL: Pipe Burst ]     |  |
|  | - Is 01:00 <= Hour <= 05:00 AND C_flow >= 2 AND Qt >= 0.15? -> [ HIGH: Nocturnal Leak ] |  |
|  | - Is C_flow >= 6 AND Qt >= 1.0 L/min? -------------------> [ MEDIUM: Prolonged Flow ]   |  |
|  +-----------------------------------------------------------------------------------------+  |
|                          |                                                                    |
|                          | No Tier 1 Violations                                               |
|                          v                                                                    |
|  [ TIER 2: UNSUPERVISED ISOLATION FOREST ML ]                                                 |
|  +-----------------------------------------------------------------------------------------+  |
|  | - Extract Feature Vector: [ Qt, Hour, IsNight, C_flow ]                                 |  |
|  | - Evaluate Path Length Across 100 Isolation Trees                                       |  |
|  | - Is Anomaly Score s < -0.18 AND Qt > 0.5 L/min? --------> [ LOW: Statistical Anomaly ] |  |
|  | - Otherwise ---------------------------------------------> [ NORMAL: Baseline Flow ]    |  |
|  +-----------------------------------------------------------------------------------------+  |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

---

## 3.7 Predictive Diurnal Consumption Forecaster

The consumption forecasting engine (`backend/forecaster.py`) projects 4-hour forward usage and end-of-month volumetric consumption using a hybrid algorithm combining an empirical Sri Lankan diurnal consumption profile with recent sliding-window telemetry.

Residential domestic consumption follows a predictable diurnal rhythm: major demand peaks occur during early morning ($07:00–09:00\\text{ AM}$, $W_{hour} \\approx 2.8–3.5$) and evening hours ($06:00–08:30\\text{ PM}$, $W_{hour} \\approx 2.2–2.9$), with a sharp trough during midnight resting hours ($02:00–04:00\\text{ AM}$, $W_{hour} \\approx 0.01$). 

The forecaster models forward consumption across 24 discrete 10-minute projection steps ($k = 1, \\dots, 24$, spanning 4 hours forward). At step $k$, the predicted flow rate $\\hat{Q}_{t+k}$ blends the baseline diurnal expectation with the actual mean flow observed over the preceding 12-hour sliding window ($M_{12h}$):

$$\\hat{Q}_{t+k} = \\left( W_{h(t+k)} \\times (1 - 0.5 \\cdot d_k) \\right) + \\left( M_{12h} \\times 0.5 \\cdot d_k \\right)$$

where $W_{h(t+k)}$ is the hourly diurnal weight corresponding to the future timestamp, and $d_k$ is an exponential decay factor returning the forecast to the diurnal baseline over a 3-hour period:

$$d_k = \\max\\left(0, \\; 1 - \\frac{k}{18}\\right)$$

The cumulative 4-hour projected volume $\\hat{V}_{4h}$ is integrated across all 24 projection intervals:

$$\\hat{V}_{4h} = \\sum_{k=1}^{24} \\left( \\hat{Q}_{t+k} \\times 10\\text{ min} \\right) \\times 10^{-3} \\quad [\\text{m}^3]$$

This 4-hour forward volume is then extrapolated across 24-hour and 30-day horizons, taking into account month-to-date cumulative volume, to generate an estimated end-of-month billing volume. The monthly volume is routed through the NWSDB tariff engine to provide consumers with an accurate projected monthly expense as illustrated in **Figure 3.7**.

```
+-----------------------------------------------------------------------------------------------+
|                 FIGURE 3.7: DIURNAL CONSUMPTION PROFILE & 4-HOUR FORECAST                     |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  Flow Rate (L/min)                                                                            |
|   4.0 |                  * Morning Peak (7-9 AM)                                              |
|   3.5 |                 ***                                                                   |
|   3.0 |                *****                                     * Evening Peak (6-8 PM)      |
|   2.5 |               *******                                   ***                           |
|   2.0 |              *********         Midday Plate           *******                         |
|   1.5 |             ***********       **************         *********                        |
|   1.0 |            *************     ****************       ***********                       |
|   0.5 |           ***************   ******************     *************                      |
|   0.0 |  --------+---------------+--+------------------+----+-----------+-------              |
|        00:00   03:00           08:00                 13:00            20:00   24:00           |
|                Nocturnal Trough                                                               |
|                                                                                               |
|        [ Current Time t ] ======> [ Forecast Horizon: t+10m ... t+240m (4 Hours) ]            |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

---

## 3.8 Explainable Artificial Intelligence (XAI) Attribution Module

To foster end-user trust and provide transparency in algorithmic decision-making, an Explainable AI (XAI) module (`backend/anomaly_xai.py`) decomposes every anomaly classification into ranked, human-interpretable feature contribution scores.

When an anomaly is flagged by Tier 1 or Tier 2, the module evaluates the individual contribution of five distinct risk factors:
1. **Continuous Flow Duration:** The total duration (minutes) for which flow has remained continuously non-zero.
2. **Nocturnal Resting Window:** Whether the flow event occurred within the critical resting hours ($01:00–05:00\\text{ AM}$).
3. **Prolonged Daytime Pattern:** Whether non-zero flow occurred during unattended daytime hours.
4. **Flow Magnitude vs. Pipe Capacity:** The relative ratio of current flow velocity to the maximum $25.0\\text{ L/min}$ pipe rating.
5. **Isolation Forest Statistical Deviation:** The normalized deviation score derived from the unsupervised decision trees.

The scoring formulation and categorical risk thresholds are detailed in **Table 3.6**.

### Table 3.6: Explainable AI (XAI) Feature Attribution Weights and Risk Categories

| Feature Identifier | Descriptive Label | Mathematical Formulation / Evaluation Logic | Risk Weighting |
| :--- | :--- | :--- | :--- |
| `continuous_duration` | Continuous Flow Duration | $\\min\\left(1.0, \\; \\frac{C_{flow} \\times 10}{60}\\right)$ | High Risk if score $> 0.70$ (60+ min continuous) |
| `night_resting_hour` | Nocturnal Resting Window | $1.0$ if Hour $\\in [01:00, 05:00]$, else $0.0$ | High Risk (85% weight in nocturnal anomalies) |
| `daytime_pattern` | Prolonged Daytime Flow | $1.0$ if Hour $\\in [09:00, 16:00]$ and $C_{flow} \\ge 6$, else $0.0$ | Moderate Risk (60% weight in daytime anomalies) |
| `flow_magnitude` | Flow Magnitude vs. Pipe Capacity | $\\min\\left(1.0, \\; \\frac{Q_t}{25.0}\\right)$ | Critical if $> 0.80$ ($>20\\text{ L/min}$) |
| `isolation_forest_ml` | Statistical Model Deviation | $\\min\\left(1.0, \\; \\max(0.0, \\; -s \\times 2.5)\\right)$ | High Risk (78% weight when $s < -0.18$) |

The calculated contribution scores are synthesized into natural language diagnostic statements returned via the `/api/explain` endpoint and rendered as dynamic horizontal bar charts in the React dashboard. When normal baseline flow is observed, the module reports a **98% confidence in normality**, highlighting "Resting Flow Floor" ($95\\%$) and "Isolation Forest Conformity" ($92\\%$) as confirming signals.

---

## 3.9 Conversational Telemetry-Grounded RAG Assistant

### 3.9.1 Retrieval-Augmented Generation Architecture
The conversational assistant (`backend/rag.py`) enables non-technical residential consumers to query their water infrastructure using natural language. To prevent hallucination and guarantee factual accuracy, the system employs a Retrieval-Augmented Generation (RAG) architecture grounded in live IoT database state.

When a user submits a natural language prompt, the assistant executes a four-stage pipeline as illustrated in **Figure 3.8**:
1. **Context Retrieval:** The engine queries the SQLite database to fetch the latest meter reading, 24-hour flow history, active leak alerts, recent camera snapshot records (with classification confidence), and the current NWSDB progressive bill.
2. **Contextual Grounding & Prompt Synthesis:** The retrieved telemetry is compiled into a structured system prompt injecting exact real-time variables into the LLM context window.
3. **Dual-Model Inference Engine:** The grounded prompt is routed to the Google Gemini API. If the API key is unavailable or network connectivity is interrupted, the query seamlessly cascades to an offline deterministic keyword fallback engine.
4. **Interactive Action Suggestions:** Every response is bundled with 3–4 clickable follow-up suggestion chips rendered as interactive buttons in the React UI (e.g., *"How do I fix a toilet leak?"*, *"Show my tariff slab breakdown"*).

```
+-----------------------------------------------------------------------------------------------+
|                       FIGURE 3.8: CONVERSATIONAL RAG DATAFLOW                                 |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  [ User Natural Language Query ] (e.g., "Why is my water bill so high this month?")           |
|                |                                                                              |
|                v                                                                              |
|  [ RAG Context Retrieval Engine ] <==== [ SQLite Database: water_data.db ]                    |
|                |                        - Latest Reading: 148.5 m³                            |
|                |                        - Active Alert: HIGH Nocturnal Leak (0.5 L/min)       |
|                |                        - Current Month Bill: Rs. 4,850.00                    |
|                |                        - Current Slab: Tier 4 (16-20 m³)                     |
|                v                                                                              |
|  [ Grounded System Prompt Assembly ]                                                          |
|                |                                                                              |
|                +-------------------------------+------------------------------+               |
|                | (API Key Available)           | (No Key / Network Offline)   |               |
|                v                               v                              |               |
|     [ Google Gemini Cloud LLM ]     [ Local Deterministic Fallback Engine ]   |               |
|     - gemini-3-flash-preview        - Keyword Matching across 8 Domains       |               |
|     - Cascading model fallbacks     - Pre-compiled engineering guidance       |               |
|                |                               |                              |               |
|                +-------------------------------+------------------------------+               |
|                                                |                                              |
|                                                v                                              |
|  [ Synthesized Response + Contextual Action Suggestion Chips ]                                |
|  - "Your bill is in Tier 4 due to a continuous nocturnal leak of 0.5 L/min detected at 2 AM..."|
|  - [ Chip 1: Inspect Toilet Cistern ] [ Chip 2: View Tariff Slab ] [ Chip 3: Camera Snapshot ]|
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

### 3.9.2 Dual Engine: Google Gemini API & Offline Deterministic Fallback
The primary cloud engine utilizes Google Gemini models configured in an automatic cascading fallback chain:
1. `gemini-3-flash-preview` (high-speed primary inference)
2. `gemini-flash-latest` (stable secondary fallback)
3. `gemini-3.8-flash` (legacy tertiary fallback)

To guarantee 100% operational availability during internet outages, an offline deterministic fallback engine was engineered. The fallback categorizes incoming queries across eight distinct operational domains based on regex keyword triggers, as specified in **Table 3.7**.

### Table 3.7: Conversational RAG Assistant Domain Topic Categorization & Trigger Keywords

| Operational Domain | Trigger Keyword Expressions | Deterministic Engineering Response |
| :--- | :--- | :--- |
| **Troubleshooting & Repair** | `fix`, `repair`, `troubleshoot`, `resolve` | Step-by-step physical repair protocol: toilet flapper inspection, storage tank float switch adjustment, bib tap washer replacement, and boundary stopcock isolation. |
| **Bill Reduction Strategies** | `reduce`, `save`, `tips`, `lower`, `cut` | Practical NWSDB slab optimization tips: aeration nozzle installation, rainwater harvesting for gardening, avoiding Tier 4 ($>20\\text{ m}^3$) escalation penalties. |
| **Consumption Forecasting** | `forecast`, `predict`, `projection`, `next month` | Reports 4-hour forward usage estimate, diurnal peak expectations, and projected 30-day cumulative volume with estimated tariff impact. |
| **Camera & Snapshot Audit** | `snapshot`, `photo`, `camera`, `ocr history` | Reports timestamp, classified drum digits, confidence percentage, and flow status of the most recent optical camera capture. |
| **Leak & Burst Diagnostics** | `leak`, `burst`, `alert`, `anomaly`, `warning` | Diagnoses active leak alerts, reports measured flow rate in L/min, duration of continuous flow, and recommends immediate isolation actions. |
| **Billing & NWSDB Tariffs** | `bill`, `cost`, `nwsdb`, `tariff`, `rupees`, `price` | Full mathematical slab breakdown showing active tier, rate per unit, fixed service charge, and consumption units remaining before next slab escalation. |
| **Live Meter Reading** | `reading`, `meter`, `current`, `units`, `drum` | Outputs current cumulative volume in cubic metres and litres, instantaneous flow rate, and pipe operational status. |
| **Hardware Specifications** | `esp32`, `camera`, `sim800l`, `battery`, `hardware` | Details edge node specifications: ESP32-CAM clock, OV2640 resolution, TinyML model size ($113.7\\text{ KB}$), 2G GSM telemetry, and battery status. |

---

## 3.10 NWSDB Domestic Progressive Slab Billing Engine

The billing engine (`backend/tariff.py`) implements the official National Water Supply and Drainage Board (NWSDB) Sri Lanka domestic slab tariff gazette. 

The NWSDB domestic tariff is strictly progressive: consumed volume is partitioned into discrete marginal blocks, with each block billed at its corresponding unit rate. The total monthly bill is the sum of all marginal block charges plus the tiered fixed monthly service charge corresponding to the highest slab reached:

$$\\text{Bill}(V) = F(V) + \\sum_{i=1}^{k-1} \\left( (T_i - T_{i-1}) \\times R_i \\right) + \\left( (V - T_{k-1}) \\times R_k \\right)$$

where $V$ is total consumption in cubic metres, $T_i$ represents the upper volumetric threshold of tier $i$ ($T_0 = 0$), $R_i$ is the rate per cubic metre in tier $i$, $k$ is the index of the highest tier reached, and $F(V)$ is the fixed monthly charge corresponding to tier $k$.

The complete official tariff structure implemented in code is detailed in **Table 3.8**.

### Table 3.8: Official Sri Lanka NWSDB Domestic Progressive Slab Water Tariff Structure

| Slab Tier Index | Volumetric Consumption Block | Usage Rate per Unit ($m^3$) | Monthly Fixed Service Charge |
| :---: | :--- | :---: | :---: |
| **Tier 1** | $0.0 - 5.0\\text{ m}^3$ | Rs. 60.00 | Rs. 300.00 |
| **Tier 2** | $5.1 - 10.0\\text{ m}^3$ | Rs. 80.00 | Rs. 300.00 |
| **Tier 3** | $10.1 - 15.0\\text{ m}^3$ | Rs. 100.00 | Rs. 340.00 |
| **Tier 4** | $15.1 - 20.0\\text{ m}^3$ | Rs. 130.00 | Rs. 400.00 |
| **Tier 5** | $20.1 - 25.0\\text{ m}^3$ | Rs. 160.00 | Rs. 500.00 |
| **Tier 6** | $25.1 - 30.0\\text{ m}^3$ | Rs. 210.00 | Rs. 600.00 |
| **Tier 7** | $30.1 - 40.0\\text{ m}^3$ | Rs. 260.00 | Rs. 1,200.00 |
| **Tier 8** | $40.1 - 50.0\\text{ m}^3$ | Rs. 310.00 | Rs. 1,400.00 |
| **Tier 9** | $50.1 - 75.0\\text{ m}^3$ | Rs. 360.00 | Rs. 1,600.00 |
| **Tier 10** | $> 75.0\\text{ m}^3$ | Rs. 410.00 | Rs. 2,000.00 |

*Example Calculation ($18.5\\text{ m}^3$ Consumed):*  
- Tier 1 ($0–5\\text{ m}^3$): $5.0 \\times \\text{Rs. } 60 = \\text{Rs. } 300.00$  
- Tier 2 ($5–10\\text{ m}^3$): $5.0 \\times \\text{Rs. } 80 = \\text{Rs. } 400.00$  
- Tier 3 ($10–15\\text{ m}^3$): $5.0 \\times \\text{Rs. } 100 = \\text{Rs. } 500.00$  
- Tier 4 ($15–18.5\\text{ m}^3$): $3.5 \\times \\text{Rs. } 130 = \\text{Rs. } 455.00$  
- Cumulative Usage Charge: $300 + 400 + 500 + 455 = \\text{Rs. } 1,655.00$  
- Tier 4 Fixed Monthly Service Charge: $\\text{Rs. } 400.00$  
- **Total NWSDB Bill:** $\\text{Rs. } 1,655.00 + \\text{Rs. } 400.00 = \\mathbf{\\text{Rs. } 2,055.00}$

---

## 3.11 Full-Stack Web Application Architecture & Database Schema

### 3.11.1 Flask REST API Backend Architecture
The backend application (`backend/app.py`) is implemented in Python 3 using the Flask 3.0 microframework, executing on port 5001. The backend operates as a dual-purpose server: in production, it serves the pre-compiled static assets of the React Single Page Application (`frontend/dist`), while concurrently providing an asynchronous REST API for IoT telemetry ingestion, database queries, and AI analytics. Cross-Origin Resource Sharing (CORS) is enabled to support Vite development servers on port 5173.

### 3.11.2 SQLite Relational Database Schema
All telemetry, alerts, user credentials, conversational threads, and optical snapshots are persisted in an embedded SQLite relational database (`backend/water_data.db`). SQLite provides high reliability, zero-configuration deployment, and ACID transaction compliance. The schema encompasses five normalized tables, as detailed in **Table 3.9**.

### Table 3.9: SQLite Relational Database Architecture & Table Descriptions

| Table Identifier | Primary Key | Critical Relational Columns & Data Types | Operational Purpose |
| :--- | :--- | :--- | :--- |
| `readings` | `id` (INTEGER AUTO) | `device_id` (TEXT), `reading` (REAL), `flow_rate_lpm` (REAL), `delta_time_sec` (REAL), `is_anomaly` (INTEGER), `anomaly_score` (REAL), `alert_message` (TEXT), `timestamp` (DATETIME) | Continuous time-series log of all verified meter captures and computed flow metrics. |
| `alerts` | `id` (INTEGER AUTO) | `device_id` (TEXT), `alert_type` (TEXT), `severity` (TEXT), `message` (TEXT), `reading` (REAL), `flow_rate_lpm` (REAL), `resolved` (INTEGER), `created_at` (DATETIME) | Historical audit log of detected plumbing anomalies, severity rankings, and resolution timestamps. |
| `users` | `id` (INTEGER AUTO) | `username` (TEXT UNIQUE), `password_hash` (TEXT), `created_at` (DATETIME) | User authentication credentials secured via Werkzeug PBKDF2:SHA256 password hashing. |
| `chat_history` | `id` (INTEGER AUTO) | `username` (TEXT), `sender` (TEXT: 'user'/'bot'), `message` (TEXT), `suggestions` (JSON TEXT), `timestamp` (DATETIME) | Isolated per-user conversational threads for the RAG assistant, preserving private context. |
| `snapshots` | `id` (INTEGER AUTO) | `device_id` (TEXT), `image_filename` (TEXT), `reading` (REAL), `digits` (JSON TEXT), `confidence_avg` (REAL), `flow_rate_lpm` (REAL), `is_leak` (INTEGER), `estimated_bill_lkr` (REAL), `inference_time_ms` (REAL), `created_at` (DATETIME) | Permanent archive of camera dial frames, OCR bounding box coordinates, and Softmax distributions. |

### 3.11.3 React 18 Single Page Application Dashboard
The user interface is engineered as a modern Single Page Application utilizing **React 18**, bundled with **Vite**, and styled with **Ant Design (antd)** under a custom dark oceanic theme (`aquaticTheme.js`).

The application architecture organizes functionality across five modular views:
1. **DashboardView:** Primary operational overview featuring 3D animated mechanical roller drums (four white cubic metre drums plus one red fractional drum with an oscillating Speed #8 dial), calibrated 3/4-inch pipe flow gauge ($0–25\\text{ L/min}$), live NWSDB progressive tariff card, real-time leak alert ribbons, and time-series telemetry charts rendered via Chart.js with anomaly flag overlays.
2. **AiAnalyticsView:** Advanced diagnostic hub presenting the interactive simulation toolbar (allowing users to inject Normal, Micro-Leak, or Pipe Burst conditions with one click), the 4-hour forward consumption forecast chart, the Explainable AI feature contribution bar chart, and algorithmic guidance documentation.
3. **CameraStudioView:** Real-time alignment panel providing visual calibration overlays for the five drum Region of Interest (ROI) bounding boxes, lens focus specifications, exposure settings, and manual dial capture controls.
4. **SnapshotHistoryView:** Comprehensive optical audit gallery featuring dual viewing modes: a visual Cards Grid View and a detailed tabular Audit Table View. A click-to-inspect modal displays the full-resolution dial photograph, segmented drum crops, individual Softmax classification probabilities, and hydraulic status at that capture instant.
5. **AssistantView:** Grounded conversational RAG chat interface supporting Markdown responses, syntax-highlighted tables, and dynamic follow-up suggestion chips.
"""
print("Chapter 03 module written.")
