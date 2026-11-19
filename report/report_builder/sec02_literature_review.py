# sec02_literature_review.py

CHAPTER_02_MD = """# Chapter 02: LITERATURE REVIEW

## 2.1 From Traditional to Smart Meters: Retrofitting Paradigms

### 2.1.1 Mechanical Dial Meters vs. Solid-State Smart Meters
Water resource monitoring globally is undergoing a transition from passive mechanical instrumentation to digital, automated telemetry. Historically, traditional mechanical meters (TMs)—predominantly multi-jet, single-jet, and rotary piston meters—have served as the global utility standard due to their robust mechanical durability, wide dynamic flow range, and total operational independence from electrical power sources (Nikić et al., 2024). However, as urban water scarcity intensifies, the fundamental limitation of TMs becomes apparent: they are disconnected recording devices that mandate manual physical inspection to extract cumulative volumetric readings.

To overcome the inefficiencies of manual meter reading, Advanced Metering Infrastructure (AMI) and Automated Meter Reading (AMR) solutions have emerged. Modern commercial smart meters replace mechanical gearboxes with solid-state measurement techniques, primarily ultrasonic time-of-flight transducers or electromagnetic induction sensors, integrated with onboard microprocessors, digital displays, and wireless transceivers (Bawankar et al., 2024). These devices deliver continuous, high-frequency consumption telemetry directly to utility central servers. 

Despite their technological superiority, the global adoption of dedicated smart meters is severely impeded by capital replacement costs. As observed by Nikić et al. (2024), the capital expenditure of discarding functional mechanical meters and procuring specialized smart meters represents the single largest bottleneck hindering utility modernization. In developing economies such as Sri Lanka, where public utility budgets are constrained and millions of mechanical meters have decades of remaining operational life, complete infrastructure replacement is financially unviable.

### 2.1.2 Principles of Optical Non-Invasive Retrofitting
Retrofitting presents an economically compelling alternative to wholesale meter replacement. In a retrofitting paradigm, the underlying mechanical meter, pressurized plumbing joints, and calibrated municipal service connections remain completely intact. An external, non-invasive electronic gadget is attached over the transparent dial register of the meter to autonomously observe, digitize, and transmit consumption data (Jin et al., 2019).

Optical retrofitting systems generally operate through one of two primary architectural configurations:
1. **Cloud-Centric Offloading:** The retrofitted edge device acts solely as a remote camera sensor, capturing photographs of the meter dial and transmitting raw uncompressed or JPEG-compressed image files over wireless networks to a centralized cloud server, where computationally intensive computer vision or optical character recognition (OCR) algorithms are executed.
2. **Edge-Intelligent Computing (TinyML):** The retrofitted gadget incorporates both an optical sensor and an embedded microcontroller capable of executing lightweight machine learning models locally on the device. Only the extracted numeric reading is transmitted over the network.

While cloud-centric offloading simplifies edge hardware design, it introduces severe operational liabilities in battery-operated utility environments, including massive cellular data overhead, vulnerability to poor wireless uplink bandwidth, and severe battery depletion caused by sustained radio transmission states (Nikić et al., 2024). Consequently, edge-intelligent retrofitting represents the optimal convergence of non-invasive deployment, minimal telemetry overhead, and extended field longevity.

---

## 2.2 Connectivity and Power Management in Constrained IoT

### 2.2.1 Wireless Telemetry Standards: Cellular vs. LPWAN vs. Short-Range
A critical engineering challenge in retrofitting domestic water meters is selecting an appropriate wireless communication standard. Water meters are typically installed in outdoor boundary wall enclosures, subsurface subterranean pits, or shaded building perimeters characterized by severe radio frequency attenuation.

Prior literature evaluates diverse wireless communication technologies across utility IoT deployments:
- **Short-Range Wireless (Wi-Fi and Zigbee):** Early retrofitting prototypes evaluated by Naim et al. (2021) utilized Wi-Fi (IEEE 802.11) enabled microcomputers such as the Raspberry Pi. While Wi-Fi delivers high bandwidth, its operational range is inadequate for boundary meters located 20–50 metres from household routers. Furthermore, Wi-Fi transceivers exhibit high active current consumption ($150–250\\text{ mA}$), exhausting a 9,800 mAh battery within 46 hours without external mains or solar harvesting (Naim et al., 2021; Bawankar et al., 2024). Zigbee offers lower power consumption but requires the installation and maintenance of intermediate residential mesh gateways, increasing deployment complexity.
- **Unlicensed LPWAN (LoRa and Sigfox):** Low-Power Wide-Area Networks operating on unlicensed Industrial, Scientific, and Medical (ISM) spectrum bands (such as LoRaWAN at 868/915 MHz) offer exceptional link budgets ($+140\\text{ dBm}$) and battery lifespans extending across several years. However, LoRaWAN necessitates dedicated public or private gateway base stations, which are sparsely deployed across semi-urban and rural regions of Sri Lanka.
- **Cellular Standards (NB-IoT, LTE-M, and 2G GSM):** Cellular connectivity provides the definitive advantage of utilizing pre-existing, ubiquitous national telecommunication infrastructure without requiring auxiliary consumer-premises gateways. Jin et al. (2019) and Nikić et al. (2024) advocate strongly for Narrowband IoT (NB-IoT), highlighting its 3GPP-standardized Power Saving Mode (PSM) and $+20\\text{ dB}$ coverage extension over legacy GSM. However, NB-IoT commercial availability is geographically fragmented in developing nations. In contrast, 2G GSM/GPRS networks remain universally deployed across virtually all residential regions of Sri Lanka, offering a dependable, ubiquitous telemetry bearer despite lacking advanced 3GPP sleep modes.

### 2.2.2 Micro-Power Energy Profiling and Deep-Sleep Architectures
Because domestic water meters are positioned far from mains electrical outlets, retrofitted nodes must operate strictly on autonomous energy reserves, typically primary lithium or rechargeable lithium-ion battery cells. Extending operational life across months or years requires a strict deep-sleep duty cycle architecture (Warden and Situnayake, 2019).

In a deep-sleep architectural paradigm, the microcontroller de-energizes its primary high-speed processing cores, phase-locked loops, radio transceivers, and camera interfaces, retaining power only to an ultra-low-power Real-Time Clock (RTC) timer and a minuscule fraction of internal SRAM. The quiescent current consumption during deep sleep plunges to microampere levels ($10–50\\text{ µA}$). At pre-programmed surveillance intervals, the RTC timer issues an interrupt that re-energizes the main core to perform capture, inference, and transmission before immediately returning to deep sleep.

Empirical energy measurements conducted by Nikić et al. (2024) demonstrate that in cellular IoT nodes, the energy consumed by the cellular radio during network registration and data transmission vastly exceeds the energy required for local optical capture and computation:
- Local camera capture, image preprocessing, and on-chip CNN inference consumed $249\\text{ µWh}$.
- A single cellular data transmission consumed $693\\text{ µWh}$, surging to $2,053\\text{ µWh}$ when initial cold-start base station registration was required—an energy expenditure **8.24 times greater** than the on-device computational processing.

This empirical finding establishes that transmitting numeric-only telemetry rather than raw visual data is an absolute physical necessity for achieving multi-month battery operation on constrained cellular nodes.

---

## 2.3 Digit Recognition on Constrained Edge Hardware

### 2.3.1 Optical Character Recognition (OCR) Pipelines: Staged vs. End-to-End
Automated recognition of numeric values from mechanical dial meters poses distinct computer vision challenges. Unlike flat printed documents, water meter dials feature cylindrical rotating drums that cast shadows, collect condensation, undergo mechanical dial jitter, and frequently stall between two discrete digits during slow flow transitions (Qiao et al., 2025).

The literature categorizes meter digit recognition into two competing architectural pipelines:
1. **Staged Segmentation-Classification Pipelines:** In this traditional approach, the meter dial face is first detected; individual digit drum windows (Regions of Interest - ROIs) are cropped, binarized, and filtered; and each segmented digit window is independently classified using a machine learning classifier or compact Convolutional Neural Network (Jin et al., 2019; Nikić et al., 2024). Staged pipelines are computationally efficient and map directly onto the strict memory limitations of microcontrollers, but require stable mechanical alignment between the optical lens and the meter faceplate.
2. **Direct End-to-End Object Detection Pipelines:** Modern deep learning architectures utilize single-stage object detectors (such as YOLOv8) to simultaneously locate and classify all digits across the entire unsegmented image (Qiao et al., 2025). While this eliminates manual ROI cropping and demonstrates high robustness to perspective tilt, the computational complexity and parameter volume of such architectures severely exceed the static memory capacities of low-cost microcontrollers.

### 2.3.2 Model Compression: Quantization, Pruning, and TinyML Inference
Deploying deep learning on microcontrollers—a discipline designated as TinyML (Tiny Machine Learning)—mandates aggressive model compression techniques to reconcile modern neural network architectures with hardware constraints (Ray, 2022; Dutta and Bharali, 2021). The ESP32-CAM microcontroller, for example, possesses an Xtensa LX6 dual-core processor clocked at $240\\text{ MHz}$ with $520\\text{ KB}$ of internal Static RAM (SRAM), of which less than $300\\text{ KB}$ is typically allocatable to continuous machine learning runtime buffers (tensor arenas).

To bridge this disparity, two primary optimization techniques are utilized:
- **Topology Specialization:** Rather than shrinking massive general-purpose classification backbones (such as MobileNetV2 or ShuffleNet, which typically suffer severe accuracy degradation when pruned to $<200\\text{ KB}$; Nikić et al., 2024), purpose-built compact CNN architectures with minimal filter depths ($16–32$ filters) and small receptive fields ($3\\times 3$ kernels) are engineered specifically for $28\\times 28$ single-channel inputs.
- **Post-Training Quantization (PTQ):** Neural network training is conventionally executed in 32-bit floating-point (FP32) arithmetic. Post-training quantization maps 32-bit floating-point weights and activation tensors into signed 8-bit integers (INT8) using an affine transformation:

$$q = \\text{round}\\left(\\frac{r}{S}\\right) + Z$$

where $r$ represents the real FP32 value, $S$ denotes an arbitrary positive scaling factor, $Z$ represents the zero-point integer offset, and $q$ is the resulting INT8 quantized value. Quantization reduces the model memory footprint by exactly **75%**, enables hardware-accelerated integer SIMD instructions, and eliminates the heavy software floating-point emulation overhead on resource-constrained embedded microcontrollers (Warden and Situnayake, 2019).

---

## 2.4 Critical Review of Key Selected Studies

To position the present research against current state-of-the-art developments, three seminal studies spanning edge retrofitting, cellular telemetry, and meter digit recognition were selected for comprehensive critical analysis:
1. **Nikić et al. (2024):** *Lightweight Digit Recognition in Smart Metering System Using Narrowband Internet of Things and Federated Learning*, published in *Future Internet*.
2. **Jin et al. (2019):** *A Smart Water Metering System Based on Image Recognition and Narrowband Internet of Things*, published in *Revue d'Intelligence Artificielle*.
3. **Qiao et al. (2025):** *Meter-YOLOv8n: A Lightweight and Efficient Algorithm for Word-Wheel Water Meter Reading Recognition*, published in the *International Journal of Advanced Computer Science and Applications (IJACSA)*.

### 2.4.1 Study 1: Nikić et al. (2024) – Edge Digit Recognition with NB-IoT and FL
**Methodological Approach:**  
Nikić et al. engineered an autonomous edge retrofitting node centered on an ESP32-CAM microcontroller interfaced with a 5-megapixel camera, an auxiliary white LED illuminator, and a multi-standard cellular module supporting NB-IoT, LTE-M, and EGPRS fallback. Their recognition pipeline extracts six $16\\times 24$ pixel digit crops, binarizes each crop using $k$-means clustering ($k=2$), and cleans stray pixel fragments using a morphological region-coloring algorithm. 

To conserve energy, the authors introduced an optical digit-change detector that performs a bitwise Exclusive-OR (XOR) operation between the least significant digit of consecutive captures; transmissions are suppressed if fewer than $32.5$ pixels differ. Digit classification is executed directly on the ESP32-CAM using a custom 7-layer CNN (one convolution, max-pooling, batch normalization, and three dense layers) written in bare-metal C/C++. Furthermore, the authors introduced a decentralized Federated Learning (FL) framework using Federated Averaging (FedAvg), allowing edge nodes to collaboratively train a global digit model while preserving local batch normalization parameters.

**Key Findings and Performance:**  
Evaluating across 3,500 successive meter states ($21,000\\text{ digit crops}$) distributed across ten physical edge devices, the initial single-device accuracy of 87.40% escalated to 93.60% after two federated aggregation rounds, ultimately achieving a peak average accuracy of **97.01%**. The compiled CNN binary occupied **$172\\text{ KB}$** of memory. 

Using a high-resolution Otii Arc power analyzer, the authors logged comprehensive energy metrics: local capture, preprocessing, and inference required $249\\text{ µWh}$, while a single NB-IoT transmission consumed $693\\text{ µWh}$ (rising to $2,053\\text{ µWh}$ during cold-start network attachment). Based on hourly optical captures and a single daily telemetry transmission, the authors projected an operational battery life of **477 days** on a single $1,000\\text{ mAh}$, $3.6\\text{ V}$ lithium cell, maintaining an average system current draw of $87\\text{ µA}$.

**Strengths:**
- Demonstrates direct architectural alignment with microcontroller edge intelligence, confirming the feasibility of running on-device CNN inference on an ESP32-CAM.
- Provides empirical, laboratory-grade power measurements documenting that cellular RF transmission is the dominant energy sink.
- Incorporates optical XOR change detection to prevent redundant cellular data transmissions.

**Critical Limitations and Unaddressed Gaps:**
- **Zero Household Decision Support:** The system terminates entirely at delivering raw integer readings via REST, MQTT, or CoAP to utility databases; it provides no consumer-facing interface, no tariff calculation, and no automated leak detection.
- **Artificial Laboratory Setup:** Experiments were restricted to an idealized dark laboratory test bench using a pulse-actuated mechanical counter, omitting environmental weathering, condensation, and sunlight ingress.
- **Reliance on NB-IoT Power Saving Mode:** The 477-day longevity projection assumes the availability of 3GPP NB-IoT PSM networks; performance over standard 2G GSM cellular networks was neither modeled nor empirically measured.

### 2.4.2 Study 2: Jin et al. (2019) – Image Recognition and NB-IoT Metering
**Methodological Approach:**  
Jin et al. constructed a smart water metering prototype based on an STM32F103ZET6 ARM Cortex-M3 microcontroller interfaced with an OmniVision OV7725 camera module, an external SD card reader, an LCD panel, and a USR-NB75 NB-IoT cellular transceiver. The image processing workflow captured the character wheel, converted frames to grayscale, detected high-frequency edges using Canny filtering, calculated dynamic binarization thresholds via Otsu's method, corrected optical perspective tilt using a Hough transform, and extracted individual digit bounding boxes. Segmented digits were classified and uploaded over NB-IoT to a remote monitoring platform.

**Key Findings and Performance:**  
Tested across a dataset of 9,544 bitmap digit crops, the authors reported individual digit recognition success rates ranging between **97.18%** (digit '0') and **99.45%** (digit '4'). The authors concluded that non-invasive camera attachment provides an effective engineering path to digitizing mechanical meters without premature asset retirement.

**Strengths:**
- One of the earliest academic demonstrations of coupling non-invasive optical capture with narrowband cellular telemetry on traditional water meters.
- Implements a rigorous classical computer vision preprocessing chain (Canny edge detection, Otsu binarization, and Hough perspective correction).

**Critical Limitations and Unaddressed Gaps:**
- **Absence of Power and Longevity Analysis:** The authors provided no electrical current measurements, sleep-mode implementations, or battery life calculations, despite battery autonomy being the paramount constraint of retrofitting.
- **Cumbersome Hardware Architecture:** The inclusion of an SD card interface and full LCD display represents a bloated development-board architecture unsuitable for commercial field encapsulation.
- **Architectural Discrepancy:** The paper exhibits a fundamental technical contradiction: Section 3 asserts that $20\\times 20$ bitmap digits are classified by a lightweight back-propagation neural network running on the STM32 MCU, whereas Section 4 describes a massive ResNet-101 Feature Pyramid Network with Region Proposal Networks—a deep model containing over 44 million parameters that could not possibly execute within the $64\\text{ KB}$ of RAM available on an STM32F103.
- **Utility-Centric Focus:** The cloud platform acts merely as a passive data repository, providing no automated leak diagnostics or household billing transparency.

### 2.4.3 Study 3: Qiao et al. (2025) – Meter-YOLOv8n for Word-Wheel Meters
**Methodological Approach:**  
Qiao et al. tackled the acute computer vision problem of recognizing mechanical meter digits caught in partial rotational transitions. They proposed *Meter-YOLOv8n*, a specialized convolutional object detection architecture modifying the baseline YOLOv8n network through three structural innovations:
1. Incorporating a C2f-iRMBS module (an inverted residual mobile block utilizing shift-wise convolutions) into the backbone network to enhance multi-scale feature extraction while suppressing background noise.
2. Developing a lightweight *Slim-Neck* utilizing GSConv and VoVGSCSP modules to dramatically reduce intermediate computational channel dimensions.
3. Formulating an *Inner-EIoU* bounding box regression loss function to accelerate gradient convergence on elongated character wheels.

To handle transitional wheel states, the authors annotated 20 discrete target classes: the ten standard Arabic numerals ($0–9$) plus ten transitional hybrid classes representing intermediate roller drum positions (e.g., $0/1$, $1/2$, ..., $9/0$). The model was trained and evaluated on an augmented dataset of 3,680 high-resolution images ($960\\times 540$ pixels) using an NVIDIA GeForce RTX 3090 desktop GPU.

**Key Findings and Performance:**  
Compared to the baseline YOLOv8n model, Meter-YOLOv8n reduced parameter volume by $0.56\\text{ M}$ and computational complexity by $2.6\\text{ GFLOPs}$, achieving a precision of **95.4%**, recall of **89.1%**, and an overall mean Average Precision ($mAP@0.5$) of **96.3%**. Recognition performance on difficult transitional digits improved significantly, yielding a $5.1\\text{ percentage point}$ increase in transitional $mAP@0.5$. The model operated at an inference throughput of 87 frames per second on the desktop GPU, with a compiled weights file size of **$5.6\\text{ MB}$**.

**Strengths:**
- Establishes state-of-the-art recognition accuracy on real-world, unsegmented word-wheel dial images.
- Systematically formulates and solves the transitional digit problem through a 20-class taxonomy and specialized regression loss.
- Comprehensive ablation studies validating the efficacy of inverted residual mobile blocks and slim-neck architectures.

**Critical Limitations and Unaddressed Gaps:**
- **Incompatible Computational Scale:** The architecture was trained and benchmarked strictly on a 350-watt desktop GPU. With a binary file size of $5.6\\text{ MB}$ and a computational demand of $6.1\\text{ GFLOPs}$, the model is **over 32 times larger** than the $172\\text{ KB}$ model deployed by Nikić et al. on an ESP32, rendering it entirely unexecutable on low-cost microcontrollers.
- **Absence of IoT, Power, and Telemetry Systems:** The research is strictly an offline algorithm study; it contains no hardware edge node, no wireless telemetry, no battery management, and no backend utility infrastructure.
- **Methodological Risk:** The authors do not state whether dataset augmentation was applied prior to or following the 7:1:2 train/validation/test split, introducing potential data leakage risks that may artificially inflate reported precision metrics.

---

## 2.5 Comparative Analysis of Prior Literature

A rigorous comparative synthesis of the three analyzed studies alongside the proposed research is presented in **Table 2.1**, contrasting hardware platforms, optical preprocessing, machine learning algorithms, dataset characteristics, accuracy benchmarks, and energy evidence.

### Table 2.1: Comprehensive Technical Comparison of Reviewed Literature Studies

| Evaluation Dimension | Nikić et al. (2024) | Jin et al. (2019) | Qiao et al. (2025) | Present Research (Proposed) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Project Focus** | Low-power retrofit with on-device CNN & federated learning | Smart water metering via classical image recognition & NB-IoT | Lightweight deep detector for word-wheel meters | End-to-end edge AI retrofit with 2-tier leak detection & RAG |
| **Hardware Platform** | Custom ESP32-CAM node + 5MP camera + LED + NB-IoT/EGPRS | STM32F103ZET6 + OV7725 + SD card + LCD + USR-NB75 NB-IoT | None (Algorithm study); NVIDIA RTX 3090 Desktop GPU | AI-Thinker ESP32-CAM + OV2640 + SIM800L 2G GSM |
| **Image Preprocessing** | $k$-means binarization ($k=2$) + morphological region coloring | Canny edge detection + Otsu binarization + Hough transform | Dynamic multi-scale data augmentation (7 methods) | Grayscale conversion, ROI window cropping, min-max normalization |
| **Recognition Algorithm** | 7-layer CNN (bare-metal C/C++) with Federated Averaging | Disputed: BP-NN ($20\\times 20$ input) vs. ResNet-101 FPN | Meter-YOLOv8n (C2f-iRMBS + Slim-Neck + Inner-EIoU) | INT8 Quantized CNN (Conv2D + BatchNorm + MaxPool + Dense) |
| **Dataset Characteristics** | 3,500 readings ($21,000\\text{ crops}$); fixed dark lab; 10 devices | 9,544 bitmap digit crops | 3,680 augmented images ($960\\times 540\\text{ px}$); public contest data | 100,000 synthetic augmented crops ($28\\times 28\\text{ px}$) + 1,260 flow series |
| **Headline Benchmark** | 97.01% average accuracy; $172\\text{ KB}$ model footprint | 97.18%–99.45% per-digit success rate | 96.3% $mAP@0.5$; $5.6\\text{ MB}$ weights; $6.1\\text{ GFLOPs}$ | **99.91% test accuracy; 113.7 KB INT8 model footprint** |
| **Power & Battery Evidence** | Measured via Otii Arc; $87\\text{ µA}$ avg; 477-day estimate | None reported | None reported ($6.1\\text{ GFLOPs}$ compute only) | Analytically modeled duty cycle; dual 18650 cells ($>180\\text{ days}$) |
| **Household Decision Support** | None; readings exposed via REST, MQTT, or CoAP | None; cloud server displays raw database values | None (Algorithm investigation only) | **Full: Progressive slab billing, 2-tier leaks, XAI & RAG AI** |
| **Target Telemetry Network** | NB-IoT / LTE-M with EGPRS fallback | Narrowband IoT (NB-IoT) | None | **Universal 2G GSM/GPRS via HTTP POST** |

To highlight functional disparities from a utility and end-user perspective, **Table 2.2** condenses these dimensions into a binary capabilities matrix.

### Table 2.2: Functional Capabilities Matrix: Prior Art vs. Present Work

| System Functional Capability | Nikić et al. (2024) | Jin et al. (2019) | Qiao et al. (2025) | Present Research |
| :--- | :---: | :---: | :---: | :---: |
| **Non-Invasive Mechanical Meter Retrofit** | **Yes** | **Yes** | Not Applicable | **Yes** |
| **On-Chip Edge Machine Learning Inference** | **Yes** | **Yes** | No (Desktop GPU) | **Yes** |
| **Microcontroller Deployable ($<200\\text{ KB}$)** | **Yes** ($172\\text{ KB}$) | Unclear / Disputed | No ($5.6\\text{ MB}$) | **Yes** (**113.7 KB**) |
| **Cellular Wireless Telemetry Integration** | **Yes** (NB-IoT) | **Yes** (NB-IoT) | No | **Yes** (2G GSM) |
| **Empirical Energy Profiling / Battery Model** | **Yes** | No | No | **Yes** |
| **Automated Progressive Slab Tariff Billing** | No | No | No | **Yes** (NWSDB) |
| **Multi-Tier Continuous Leak Surveillance** | No | No | No | **Yes** (2-Tier) |
| **Explainable AI (XAI) Causal Diagnostics** | No | No | No | **Yes** |
| **Conversational Decision Support Assistant** | No | No | No | **Yes** (RAG AI) |
| **Household User Dashboard Application** | No | No | No | **Yes** (React 18) |

---

## 2.6 Identification of Research Gaps

A critical examination of the literature reveals four pronounced research and engineering gaps:

### 2.6.1 Gap 1: Absence of Household-Level Decision Support and Billing Analytics
Across all reviewed studies, the technological pipeline terminates abruptly once the numeric reading is decoded or delivered to a server. Neither Nikić et al. (2024), Jin et al. (2019), nor Qiao et al. (2025) translate consumption telemetry into actionable intelligence for the consumer. However, in real-world utility management—particularly under complex progressive slab tariffs such as Sri Lanka's NWSDB schedule—the primary value of real-time metering lies in empowering consumers to understand their financial trajectory, detect leaks early, and mitigate bill shock. The absence of automated slab billing, real-time leak categorization, and conversational decision support represents the most glaring deficiency in current academic literature.

### 2.6.2 Gap 2: Thin Empirical Evidence on Low-Power 2G/GSM Microcontroller Operation
The empirical power literature is exceedingly sparse. Only Nikić et al. (2024) provide empirical energy measurements, but their multi-year battery life projection relies strictly on 3GPP NB-IoT networks configured with Power Saving Mode (PSM). In developing countries where NB-IoT is not deployed, smart utility nodes must operate over standard 2G GSM/GPRS networks (e.g., using SIM800L modems). A 2G modem cannot enter deep 3GPP cellular sleep; it draws massive transient currents (up to $2.0\\text{ A}$) during transmission bursts and requires significant energy to re-attach to the network. Systematic empirical investigations measuring the battery viability of 2G GSM cellular telemetry paired with TinyML edge microcontrollers are virtually absent.

### 2.6.3 Gap 3: Microcontroller Deployability vs. Detection Accuracy Trade-Off
A stark dichotomy exists in the literature between model accuracy and hardware deployability. Advanced neural architectures like Meter-YOLOv8n (Qiao et al., 2025) achieve high precision ($96.3\\%\\text{ }mAP$) and effectively handle transitional digits, but demand GPU-level computation ($6.1\\text{ GFLOPs}$, $5.6\\text{ MB}$) that is entirely incompatible with low-cost microcontrollers. Conversely, existing microcontroller models (such as the 7-layer CNN of Nikić et al. achieving $97.01\\%$) operate within memory limits but suffer from elevated error rates when confronted with noisy, rotated, or weathered digits. A critical gap persists in developing an aggressively optimized, INT8-quantized CNN architecture that attains near-perfect accuracy ($>99\\%$) while strictly conforming to a $<200\\text{ KB}$ SRAM envelope.

### 2.6.4 Gap 4: Lack of Validation Under Real-World Sri Lankan Environmental Conditions
Existing literature is contextualized entirely in European or East Asian operational environments. No published study investigates optical retrofitting on standard Sri Lankan water meters (calibrated to domestic 3/4-inch service lines), evaluates models against local weathered dial fonts, or integrates telemetry with the NWSDB progressive slab tariff gazette.

---

## 2.7 Positioning and Conceptual Framework of the Present Research

The present research is systematically positioned to directly resolve each of the four identified research gaps. As summarized in **Table 2.3**, the project does not claim the generic novelty of attaching a camera to a meter—an architectural concept demonstrated by Jin et al. and Nikić et al. Instead, the novel academic and engineering contributions of this work reside in:
1. Synthesizing the **household intelligence layer**, providing real-time NWSDB progressive slab billing, two-tier physics-guided leak detection, explainable AI diagnostics, and a conversational RAG assistant.
2. Developing and evaluating an ultra-compact **INT8 quantized TinyML CNN** that surpasses $99.9\\%$ accuracy while occupying only $113.7\\text{ KB}$ on an ESP32-CAM.
3. Formulating an **energy-efficient 2G GSM telemetry pipeline** combining deep sleep, hardware transient buffering, and compact numeric payloads to achieve practical battery longevity in developing nations.
4. Conducting complete empirical validation calibrated specifically for **Sri Lankan municipal water infrastructure**.

### Table 2.3: Research Gaps, Project Responses, and Produced Empirical Evidence

| Identified Research Gap | Systematic Project Response | Empirical Evidence Produced in this Study |
| :--- | :--- | :--- |
| **Gap 1: Absence of Household Decision Support & Billing** | Engineered Flask REST API with automated NWSDB progressive tariff engine, 2-tier leak detection, and Gemini RAG assistant. | Exact billing parity across all 10 NWSDB tiers; 100% leak detection on simulated pipe ruptures and nocturnal micro-leaks. |
| **Gap 2: Thin Evidence on Low-Power 2G GSM Operation** | Implemented RTC deep sleep, LM2596 buck regulation, 1000 µF capacitive burst buffer, and numeric-only HTTP POST telemetry. | 99.7% cellular bandwidth reduction (120 bytes vs. 35 KB); modeled operational battery life exceeding 180 days on twin 18650 cells. |
| **Gap 3: Microcontroller Deployability vs. Accuracy Trade-Off** | Developed custom compact CNN trained on 100,000 augmented dial crops, quantized to full INT8 via TensorFlow Lite Micro. | 99.91% test accuracy across 20,000 samples; 113.7 KB compiled model footprint; ~45 ms on-chip execution latency. |
| **Gap 4: Lack of Validation Under Sri Lankan Local Context** | Calibrated flow physics for 3/4" NWSDB service lines ($Q_{max} \\approx 25\\text{ L/min}$); 3D printed light-occluding dial shroud. | Verified operational stability across nocturnal resting flow thresholds ($0.15\\text{ L/min}$) and domestic slab boundaries. |
"""
print("Chapter 02 module written.")
