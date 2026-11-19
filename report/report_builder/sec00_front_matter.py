# sec00_front_matter.py

FRONT_MATTER_MD = """# KANDY INNOVATION CENTER
## NATIONAL INSTITUTE OF BUSINESS MANAGEMENT
### BACHELOR OF SCIENCE IN COMPUTER SCIENCE WITH AI

---

# Individual Project Report

<br><br>

# DESIGN AND DEVELOPMENT OF AN IOT RETROFITTING MODULE FOR DOMESTIC WATER METERS IN SRI LANKA WITH EDGE AI, TINYML & CONVERSATIONAL RAG ASSISTANT

<br><br>

### The Assignment Submitted by
**K W G C D B Karunarathne**  
**(Student Registration Number: KIC-BSCCSAI-251P-036)**

<br>

**Supervised by:**  
Internal Supervisor: [Supervisor Name to be inserted]  
Institutional Affiliation: Kandy Innovation Centre, National Institute of Business Management  

<br>

**Date of Submission:** November 06, 2026

<div style="page-break-after: always;"></div>

---

## Declaration of Authorship

I hereby declare that this individual project report entitled **"Design and Development of an IoT Retrofitting Module for Domestic Water Meters in Sri Lanka with Edge AI, TinyML & Conversational RAG Assistant"** is my own original work conducted under the guidance of the faculty of the National Institute of Business Management (NIBM), Kandy Innovation Centre. 

I confirm that:
1. This work has not previously been submitted, in whole or in part, for the award of any other degree, diploma, or qualification at this or any other academic or professional institution.
2. All primary and secondary sources, published literature, software libraries, datasets, and conceptual frameworks utilized throughout this research have been fully cited and referenced in accordance with standard academic conventions.
3. Hardware designs, machine learning architectures, firmware routines, backend application code, and web interfaces described herein represent original engineering contributions, except where explicitly attributed to third-party open-source implementations.
4. The investigation has been carried out in adherence to professional, academic, and ethical integrity standards.

<br><br>

.....................................................  
**K W G C D B Karunarathne**  
(Registration Number: KIC-BSCCSAI-251P-036)  
Date: November 06, 2026  

<div style="page-break-after: always;"></div>

---

## Abstract

**TITLE:** DESIGN AND DEVELOPMENT OF AN IOT RETROFITTING MODULE FOR DOMESTIC WATER METERS IN SRI LANKA WITH EDGE AI, TINYML & CONVERSATIONAL RAG ASSISTANT  
**NAME:** K. W. G. C. D. B. Karunarathne  
**AFFILIATION:** Kandy Innovation Centre, National Institute of Business Management, 1095, Kandy - Colombo Rd, Getambe, Sri Lanka  
**EMAIL:** chathuradinal2016@gmail.com  

### Brief Description of the Dataset
The empirical investigation and machine learning components of this study utilize a primary synthetic dataset comprising 100,000 augmented 28×28 single-channel grayscale image crops of mechanical water meter roller digits (classes 0 through 9). The dataset models the optical acquisition characteristics of an OmniVision OV2640 sensor under diverse ambient operational conditions, including severe lens blur, varying incident LED flash angles, perspective rotations up to ±15°, Gaussian sensor noise, and contrast variations representative of weathered domestic meter faceplates in Sri Lanka. In addition, an operational time-series telemetry baseline consisting of 1,260 physical flow readings calibrated for 3/4-inch domestic supply lines ($Q_{max} \approx 25\text{ L/min}$) was developed to benchmark statistical and physics-based anomaly detection algorithms across daytime active usage, nocturnal baseline resting periods, simulated micro-leaks, and catastrophic pipe rupture conditions.

### Problems Addressed with the Dataset
In Sri Lanka, domestic water utility management administered by the National Water Supply and Drainage Board (NWSDB) is constrained by a monthly manual meter-reading cycle across over 2.8 million residential connections. This operational paradigm creates a 30-day information void for households, precluding early detection of catastrophic pipe bursts, plumbing ruptures, and silent micro-leaks (e.g., faulty toilet cistern valves or underground service line fractures). Undetected leaks lead to massive physical non-revenue water (NRW) losses and culminate in severe financial shocks for consumers under the NWSDB's steep progressive 10-tier slab tariff structure. While commercial smart meters exist globally, their prohibitive capital cost ($150–$300 per unit) and requirement to cut into pressurized plumbing render mass replacement economically unfeasible for developing economies. Furthermore, deploying computer vision on utility meters in resource-constrained residential environments faces acute technological barriers: microcontrollers possess highly restricted SRAM (<520 KB) and strict power limits that preclude continuous streaming of high-resolution camera feeds over cellular networks.

### Methodologies Used for Addressing Problems
To overcome these multi-faceted challenges, an end-to-end, edge-intelligent retrofitting architecture was engineered. The hardware edge node comprises an AI-Thinker ESP32-CAM microcontroller interfaced with a SIM800L 2G GSM cellular modem and an ultra-low-power duty cycle power management unit powered by twin 18650 Li-ion cells. An optimized Convolutional Neural Network (CNN) featuring two convolutional stages, batch normalization, max-pooling, dense representation, and dropout was trained and post-quantized to full 8-bit integer (INT8) precision via TensorFlow Lite Micro. The quantized model runs directly on the ESP32-CAM, performing on-chip optical digit recognition across all five roller drums in ~45 ms, transmitting solely a 120-byte numeric JSON payload rather than heavy visual media. The telemetry payload is ingested by a cloud-hosted Flask REST API and processed by a novel Two-Tier Leak Detection Engine. Tier 1 executes deterministic domain physics rules calibrated for 3/4-inch domestic piping, including nocturnal resting flow gating (01:00–05:00 AM; micro-leak threshold $\ge 0.15\text{ L/min}$) and pipe burst velocity monitoring ($>25\text{ L/min}$). Tier 2 applies an unsupervised Isolation Forest machine learning model to detect multi-dimensional behavioral anomalies. The analytical ecosystem is augmented by a 4-hour diurnal consumption forecaster, an Explainable Artificial Intelligence (XAI) feature contribution module, an automated NWSDB slab billing engine, and a Retrieval-Augmented Generation (RAG) conversational assistant powered by Google Gemini with an offline fallback. The system surfaces all telemetry through a modern, dark-mode aquatic React 18 Single Page Application.

### Key Results Obtained from the Analysis
Experimental evaluation demonstrates that the INT8 quantized TinyML CNN achieved an exceptional 99.91% classification accuracy on a held-out test partition of 20,000 samples, exceeding the 97.0% functional design requirement. The model footprint is compressed to 113.7 KB, fitting comfortably within the ESP32-CAM's internal memory without requiring high-power external PSRAM retention. On-chip inference latency averaged 45 milliseconds per digit crop. Transmitting numeric readings over 2G GSM reduced cellular data consumption by 99.7% compared to transmitting raw image frames (120 bytes vs. 35 KB per capture), lowering per-transmission energy expenditure from 2,053 µWh to 693 µWh and extending estimated battery longevity to over 180 days on standard 18650 cells. The two-tier leak detection engine achieved a 100% detection rate on simulated pipe rupture scenarios within a single 10-minute reporting interval and flagged micro-leaks ($0.15\text{ L/min}$) during nocturnal surveillance windows with zero false alarms during baseline domestic usage. The NWSDB billing engine demonstrated 100% mathematical fidelity across all 10 tariff slabs.

### Conclusions and Discussions
The research validates that edge-intelligent retrofitting represents a technically viable, robust, and cost-effective paradigm for modernizing legacy mechanical utility meters in Sri Lanka without altering existing civil or plumbing infrastructure. By shifting inference to the hardware edge and coupling lightweight cellular telemetry with cloud-based machine learning and conversational AI, the system democratizes real-time consumption awareness, mitigates domestic water losses, and shields consumers from unexpected utility bill escalation.

<div style="page-break-after: always;"></div>

---

## Acknowledgments

I wish to express my deepest gratitude to all individuals and institutions who contributed to the successful completion of this undergraduate capstone engineering research:

- To the academic faculty and administrative leadership of the **National Institute of Business Management (NIBM), Kandy Innovation Centre**, for providing the academic infrastructure, computational resources, and conducive research environment necessary to pursue this work.
- To my **Project Supervisor(s)**, whose scholarly guidance, critical reviews, and constructive feedback throughout the proposal, literature review, and implementation phases proved invaluable in maintaining academic rigor and technical focus.
- To the engineering community and contributors of the open-source **TensorFlow Lite Micro, ESP32 Arduino Core, Flask, scikit-learn, and React** ecosystems, whose robust libraries provided the technological foundation for edge AI and web development.
- Finally, to my family and colleagues, whose continuous encouragement, patience, and moral support sustained my dedication throughout the research and development lifecycle.

<div style="page-break-after: always;"></div>

---

## Table of Contents

- **Abstract** ..................................................................................................................... ii
- **Declaration of Authorship** .............................................................................................. iii
- **Acknowledgments** ........................................................................................................ iv
- **Table of Contents** ........................................................................................................... v
- **List of Tables** ............................................................................................................... vii
- **List of Figures** ............................................................................................................. viii
- **List of Abbreviations** ..................................................................................................... ix

### Chapter 01: INTRODUCTION ........................................................................................ 1
- 1.1 Background of the Study ............................................................................................... 1
  - 1.1.1 Sri Lankan Domestic Water Distribution Context ..................................................... 1
  - 1.1.2 Limitations of the Manual Meter Reading Cycle ....................................................... 2
  - 1.1.3 The NWSDB Domestic Progressive Slab Tariff Structure ............................................ 3
- 1.2 Justification of the Problem ........................................................................................... 4
  - 1.2.1 Undetected Household Leakage and Financial Vulnerability ....................................... 4
  - 1.2.2 Non-Revenue Water and Resource Depletion ............................................................ 5
  - 1.2.3 Economic and Technical Infeasibility of Wholesale Meter Replacement ......................... 6
  - 1.2.4 Critique of Locally Available Commercial Digital Meters ........................................... 7
- 1.3 Objectives of the Study ................................................................................................. 8
  - 1.3.1 Primary Research Objective ................................................................................... 8
  - 1.3.2 Specific Research Objectives ................................................................................. 8
  - 1.3.3 Research Questions .............................................................................................. 9
  - 1.3.4 Scope and Delimitations ........................................................................................ 10

### Chapter 02: LITERATURE REVIEW ................................................................................ 11
- 2.1 From Traditional to Smart Meters: Retrofitting Paradigms ................................................. 11
  - 2.1.1 Mechanical Dial Meters vs. Solid-State Smart Meters ................................................ 11
  - 2.1.2 Principles of Optical Non-Invasive Retrofitting ........................................................ 12
- 2.2 Connectivity and Power Management in Constrained IoT ................................................... 13
  - 2.2.1 Wireless Telemetry Standards: Cellular vs. LPWAN vs. Short-Range ............................. 13
  - 2.2.2 Micro-Power Energy Profiling and Deep-Sleep Architectures ....................................... 14
- 2.3 Digit Recognition on Constrained Edge Hardware ........................................................... 15
  - 2.3.1 Optical Character Recognition (OCR) Pipelines: Staged vs. End-to-End ......................... 15
  - 2.3.2 Model Compression: Quantization, Pruning, and TinyML Inference .............................. 16
- 2.4 Critical Review of Key Selected Studies ........................................................................... 17
  - 2.4.1 Study 1: Nikić et al. (2024) – Edge Digit Recognition with NB-IoT and FL .................... 17
  - 2.4.2 Study 2: Jin et al. (2019) – Image Recognition and NB-IoT Metering ........................... 19
  - 2.4.3 Study 3: Qiao et al. (2025) – Meter-YOLOv8n for Word-Wheel Meters ......................... 20
- 2.5 Comparative Analysis of Prior Literature ......................................................................... 22
- 2.6 Identification of Research Gaps ..................................................................................... 24
  - 2.6.1 Gap 1: Absence of Household-Level Decision Support and Billing Analytics ................. 24
  - 2.6.2 Gap 2: Thin Empirical Evidence on Low-Power 2G/GSM Microcontroller Operation ....... 24
  - 2.6.3 Gap 3: Microcontroller Deployability vs. Detection Accuracy Trade-Off ....................... 25
  - 2.6.4 Gap 4: Lack of Validation Under Real-World Sri Lankan Environmental Conditions ....... 25
- 2.7 Positioning and Conceptual Framework of the Present Research ........................................ 26

### Chapter 03: METHODOLOGY ......................................................................................... 28
- 3.1 Research Design & Overall Architectural Framework ........................................................ 28
  - 3.1.1 Multi-Tier Architectural Topology ........................................................................... 28
  - 3.1.2 End-to-End Operational Workflow ........................................................................... 29
- 3.2 Data Collection & Dataset Generation ............................................................................. 30
  - 3.2.1 Synthetic Dial Image Dataset Generation ................................................................. 30
  - 3.2.2 Operational Flow Telemetry Dataset ....................................................................... 32
- 3.3 Data Preprocessing & Input Tensor Normalization Pipeline ................................................. 33
- 3.4 Hardware Engineering & IoT Edge Node Design ................................................................. 35
  - 3.4.1 Bill of Materials (BOM) & Microcontroller Selection ................................................... 35
  - 3.4.2 Electrical Circuit Design, Level Shifting & Transient Buffering .................................... 36
  - 3.4.3 Optical Alignment, Illumination & Custom Enclosure Shroud ...................................... 37
  - 3.4.4 Power Management, Sleep Modes & Energy Budget Formulation ................................. 38
- 3.5 TinyML Convolutional Neural Network Pipeline ................................................................ 39
  - 3.5.1 CNN Architecture Topology ................................................................................... 39
  - 3.5.2 Training Regime & Hyper-Parameter Optimization .................................................... 41
  - 3.5.3 Post-Training Quantization (PTQ) to INT8 Precision ................................................... 42
  - 3.5.4 TensorFlow Lite Micro C-Header Deployment .......................................................... 43
- 3.6 Two-Tier Leak & Anomaly Detection Engine ..................................................................... 44
  - 3.6.1 Hydraulic Calibration for 3/4-Inch Domestic Supply Lines ......................................... 44
  - 3.6.2 Tier 1: Deterministic Physics and Domain Rules ....................................................... 45
  - 3.6.3 Tier 2: Unsupervised Isolation Forest Machine Learning Engine ................................. 47
- 3.7 Predictive Diurnal Consumption Forecaster ...................................................................... 49
- 3.8 Explainable Artificial Intelligence (XAI) Attribution Module ................................................ 51
- 3.9 Conversational Telemetry-Grounded RAG Assistant ........................................................... 53
  - 3.9.1 Retrieval-Augmented Generation Architecture .......................................................... 53
  - 3.9.2 Dual Engine: Google Gemini API & Offline Deterministic Fallback ................................ 54
- 3.10 NWSDB Domestic Progressive Slab Billing Engine ........................................................... 56
- 3.11 Full-Stack Web Application Architecture & Database Schema ............................................ 58
  - 3.11.1 Flask REST API Backend Architecture ................................................................... 58
  - 3.11.2 SQLite Relational Database Schema ..................................................................... 59
  - 3.11.3 React 18 Single Page Application Dashboard ......................................................... 61

### Chapter 04: RESULTS .................................................................................................... 63
- 4.1 Data Preprocessing & Input Tensor Pipeline Evaluation ..................................................... 63
- 4.2 Exploratory Data Analysis & Consumption Profiling .......................................................... 64
- 4.3 TinyML Model Evaluation & INT8 Quantization Benchmarks ................................................ 66
  - 4.3.1 Classification Accuracy & Confusion Matrix ............................................................ 66
  - 4.3.2 Quantization Impact on Model Footprint & Memory Allocation ..................................... 68
  - 4.3.3 On-Chip Inference Latency Profiling ....................................................................... 69
- 4.4 Anomaly & Leak Detection Engine Performance ............................................................... 70
  - 4.4.1 Empirical Validation of Tier-1 Domain Rules ............................................................ 70
  - 4.4.2 Isolation Forest Sensitivity & Score Distribution ...................................................... 72
  - 4.4.3 Simulation Testing: Normal, Micro-Leak, and Pipe Burst Scenarios ............................. 73
- 4.5 Diurnal Consumption Forecasting & NWSDB Slab Billing Validation .................................... 74
  - 4.5.1 Forecaster Trajectory vs. Realized Telemetry ........................................................... 74
  - 4.5.2 Slab Tariff Mathematical Verification Across All 10 Tiers ........................................... 75
- 4.6 Conversational RAG Assistant & Camera Snapshot Archive Verification ................................ 76
- 4.7 Project Outcomes & Requirement Traceability Matrix ......................................................... 78
- 4.8 Comparison of Results ................................................................................................. 80
  - 4.8.1 Benchmark 1: Edge Computing vs. Cloud-Only Image Transmission ............................ 80
  - 4.8.2 Benchmark 2: Comparative Positioning Against Published Studies ............................. 82

### Chapter 05: DISCUSSION .............................................................................................. 84
- 5.1 Interpretation of Findings in Context of the Literature ...................................................... 84
- 5.2 Significance and Socio-Economic Implications for Sri Lanka ............................................... 86
  - 5.2.1 Consumer Protection Against Water Loss & Shock Billing ......................................... 86
  - 5.2.2 Utility Scale Non-Revenue Water (NRW) Reduction ................................................... 87
  - 5.2.3 Economic Viability vs. Commercial AMR/AMI Solutions ............................................ 88
- 5.3 Limitations of the Study ............................................................................................... 89
  - 5.3.1 Synthetic Dataset Font Generalization ................................................................... 89
  - 5.3.2 2G GSM Infrastructure Sunset Considerations ......................................................... 89
  - 5.3.3 Half-Rotated Roller Drum Digits & Mechanical Dial Wear .......................................... 90

### Chapter 06: CONCLUSION & RECOMMENDATIONS ........................................................... 91
- 6.1 Summary of Contributions ............................................................................................ 91
- 6.2 Recommendations for Practical Implementation ............................................................... 92
- 6.3 Directions for Future Research ....................................................................................... 93

### REFERENCES .............................................................................................................. 95
### APPENDICES ............................................................................................................... 100
- Appendix A: SQLite Database Schema & REST API Specifications ............................................ 100
- Appendix B: Hardware Bill of Materials (BOM) & Electrical Schematic ..................................... 103
- Appendix C: TinyML CNN Architecture & Quantization Code Implementation ............................. 105
- Appendix D: Automated Verification Test Suite Summary & Coverage ...................................... 108

<div style="page-break-after: always;"></div>

---

## List of Tables

- **Table 2.1:** Comprehensive Technical Comparison of Reviewed Literature Studies ..................... 22
- **Table 2.2:** Functional Capabilities Matrix: Prior Art vs. Present Work ................................... 23
- **Table 2.3:** Research Gaps, Project Responses, and Produced Empirical Evidence ..................... 26
- **Table 3.1:** Outline of the 100,000-Sample Synthetic Water Meter Dial Dataset ......................... 31
- **Table 3.2:** Bill of Materials (BOM) for IoT Edge Retrofitting Node ......................................... 35
- **Table 3.3:** Convolutional Neural Network Layer Architecture & Tensor Shapes ........................ 40
- **Table 3.4:** Hydraulic Calibration Parameters for 3/4-Inch Domestic Water Service Line ............ 44
- **Table 3.5:** Two-Tier Leak Detection Engine Multi-Rule Specification ..................................... 46
- **Table 3.6:** Explainable AI (XAI) Feature Attribution Weights and Risk Categories .................... 52
- **Table 3.7:** Conversational RAG Assistant Domain Topic Categorization & Trigger Keywords ...... 55
- **Table 3.8:** Official Sri Lanka NWSDB Domestic Progressive Slab Water Tariff Structure ........... 57
- **Table 3.9:** SQLite Relational Database Architecture & Table Descriptions .............................. 60
- **Table 4.1:** Confusion Matrix for 10-Class TinyML CNN on 20,000 Test Dial Digit Samples .......... 67
- **Table 4.2:** Empirical Anomaly Detection Performance Across Simulated Operational States ......... 71
- **Table 4.3:** Mathematical Validation of NWSDB Slab Tariff Engine Across Sample Consumptions .... 75
- **Table 4.4:** System Requirements Traceability and Verification Matrix (FR & NFR) .................... 79
- **Table 4.5:** Empirical Benchmark: Edge Inference vs. Cloud-Only Image Offloading ................... 81
- **Table 4.6:** Quantitative Comparison with State-of-the-Art Meter Reading Literature ................. 83

<div style="page-break-after: always;"></div>

---

## List of Figures

- **Figure 3.1:** High-Level End-to-End Three-Tier System Architecture Diagram ........................... 29
- **Figure 3.2:** Mechanical Water Meter Dial Faceplate Showing Five Digit Regions of Interest ...... 34
- **Figure 3.3:** Electrical Schematic and Interfacing Wiring Diagram of the IoT Edge Node ............. 37
- **Figure 3.4:** Deep Sleep and Active Surveillance Duty Cycle State Machine ............................ 39
- **Figure 3.5:** TinyML Quantized CNN Optical Digit Recognition Processing Pipeline ................... 43
- **Figure 3.6:** Two-Tier Leak Detection Workflow: Physics Threshold Gating & Isolation Forest ...... 48
- **Figure 3.7:** Diurnal Domestic Consumption Profile and 4-Hour Predictive Forecasting Curve ..... 50
- **Figure 3.8:** Retrieval-Augmented Generation (RAG) Telemetry Grounding Information Flow ....... 54
- **Figure 4.1:** Representative Sample Grayscale Digit Crops (Classes 0 to 9) .............................. 64
- **Figure 4.2:** Twenty-Four Hour Domestic Baseline Flow Rate Profile ...................................... 65
- **Figure 4.3:** Training and Validation Accuracy/Loss Curves Over 10 Epochs ............................. 68
- **Figure 4.4:** Isolation Forest Anomaly Score Distribution for Normal vs. Leakage States ............ 72
- **Figure 4.5:** Full-Stack React Single Page Application Operational Dashboard Interface ........... 77

<div style="page-break-after: always;"></div>

---

## List of Abbreviations

- **AI:** Artificial Intelligence
- **AMI:** Advanced Metering Infrastructure
- **AMR:** Automated Meter Reading
- **API:** Application Programming Interface
- **BOM:** Bill of Materials
- **CNN:** Convolutional Neural Network
- **CORS:** Cross-Origin Resource Sharing
- **EDA:** Exploratory Data Analysis
- **ESP32:** Espressif Systems 32-bit Microcontroller
- **FL:** Federated Learning
- **FN:** False Negative
- **FP:** False Positive
- **FPR:** False Positive Rate
- **GFLOPs:** Giga Floating-Point Operations
- **GPRS:** General Packet Radio Service
- **GSM:** Global System for Mobile Communications
- **HTTP:** Hypertext Transfer Protocol
- **INT8:** 8-Bit Signed Integer
- **IoT:** Internet of Things
- **JSON:** JavaScript Object Notation
- **KB:** Kilobyte
- **LED:** Light Emitting Diode
- **LLM:** Large Language Model
- **LKR / Rs.:** Sri Lankan Rupee
- **LPM:** Litres Per Minute
- **LPWAN:** Low-Power Wide-Area Network
- **m³:** Cubic Metre (1,000 Litres / 1 Water Unit)
- **mAP:** Mean Average Precision
- **MCU:** Microcontroller Unit
- **ML:** Machine Learning
- **NB-IoT:** Narrowband Internet of Things
- **NFR:** Non-Functional Requirement
- **NRW:** Non-Revenue Water
- **NWSDB:** National Water Supply and Drainage Board (Sri Lanka)
- **OCR:** Optical Character Recognition
- **Otsu:** Otsu's Image Binarization Algorithm
- **OV2640:** OmniVision 2640 Camera Sensor Module
- **PBKDF2:** Password-Based Key Derivation Function 2
- **PSRAM:** Pseudo-Static Random-Access Memory
- **PTQ:** Post-Training Quantization
- **QVGA:** Quarter Video Graphics Array ($320 \\times 240$ pixels)
- **RAG:** Retrieval-Augmented Generation
- **RAM:** Random Access Memory
- **ReLU:** Rectified Linear Unit
- **REST:** Representational State Transfer
- **ROI:** Region of Interest
- **ROM:** Read-Only Memory
- **RTC:** Real-Time Clock
- **SIM:** Subscriber Identity Module
- **SRAM:** Static Random-Access Memory
- **TFLM:** TensorFlow Lite for Microcontrollers
- **TN:** True Negative
- **TP:** True Positive
- **TPR:** True Positive Rate
- **UART:** Universal Asynchronous Receiver-Transmitter
- **UI:** User Interface
- **Vite:** Modern Frontend Build Tool
- **XAI:** Explainable Artificial Intelligence
- **XOR:** Exclusive OR Binary Operation
- **YOLO:** You Only Look Once

<div style="page-break-after: always;"></div>
"""
print("Front matter module written.")
