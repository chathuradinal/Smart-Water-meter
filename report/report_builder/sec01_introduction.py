# sec01_introduction.py

CHAPTER_01_MD = """# Chapter 01: INTRODUCTION

## 1.1 Background of the Study

### 1.1.1 Sri Lankan Domestic Water Distribution Context
In Sri Lanka, the provision, management, and governance of public domestic water supply fall under the statutory jurisdiction of the National Water Supply and Drainage Board (NWSDB). Supplying piped, potable drinking water to over 2.8 million active domestic service connections across urban, semi-urban, and rural municipalities, the NWSDB plays an indispensable role in safeguarding national public health and supporting socioeconomic development. The vast majority of these residential connections terminate at the customer boundary wall or road verge, where water consumption is metered through mechanical rotary or multi-jet dial meters housed in cast-iron or plastic surface boxes. 

These legacy mechanical water meters operate on purely hydrodynamic principles: incoming pressurized water flows through an internal measuring chamber, turning an impeller or oscillating piston whose rotational velocity is mechanically coupled via a reduction gear train to a set of cylindrical roller drums on the meter register. The roller counter displays the cumulative volume of water drawn in cubic metres ($m^3$) and sub-units. While mechanical meters offer high physical reliability, wide availability, and zero reliance on electrical power, they are strictly passive recording instruments devoid of computational logic, internal memory, or telecommunication capabilities.

### 1.1.2 Limitations of the Manual Meter Reading Cycle
Because mechanical dial meters cannot transmit data autonomously, the NWSDB manages billing through a labor-intensive, human-operated manual reading process. Once per 30-day billing cycle, a field meter reader physically visits every residential property, visually inspects the glass dial face of the water meter, notes the displayed integer reading, and inputs this value into a portable hand-held terminal or paper book to generate a physical monthly utility invoice. 

This operational framework suffers from acute systemic limitations:
1. **Severe Information Latency:** Residential consumers receive consumption feedback exactly once a month, typically several days after the reading date. Between billing visits, households operate in a total informational vacuum regarding their daily, hourly, or cumulative volumetric consumption.
2. **Human Error and Reading Disputes:** Manual data entry under adverse outdoor weather conditions (heavy monsoon rains, muddy meter pits, scratched or fogged glass dials) frequently introduces recording errors, transposition typos, or estimated bills when premises are locked or inaccessible.
3. **Operational Overhead:** Deploying thousands of meter readers nationwide imposes substantial recurring operational expenditures on the utility, including transportation, field personnel wages, and dispute resolution overhead.

### 1.1.3 The NWSDB Domestic Progressive Slab Tariff Structure
The economic impact of consumption latency is drastically amplified by Sri Lanka's domestic water pricing structure. In accordance with national conservation mandates and equity policies, the NWSDB enforces a steep, progressive tiered (slab) tariff system. Under this structure, volumetric consumption is categorized into consecutive unit blocks ($1\\text{ unit} = 1\\text{ m}^3 = 1,000\\text{ litres}$), with the marginal cost per unit escalating sharply as consumption increases:

$$\\text{Total Domestic Bill} = \\text{Monthly Fixed Service Charge} + \\sum_{i=1}^{k} (U_i \\times R_i)$$

where $U_i$ represents the water units consumed within slab tier $i$, and $R_i$ denotes the approved rate per unit for that slab. For domestic households, base consumption up to $5\\text{ m}^3$ is billed at a subsidized rate of Rs. 60.00 per unit with a base fixed charge of Rs. 300.00. However, if a household's monthly consumption crosses into higher tiers due to unintentional over-usage or undetected plumbing leaks, the marginal rate escalates aggressively to Rs. 160.00 ($21–25\\text{ m}^3$), Rs. 260.00 ($31–40\\text{ m}^3$), Rs. 360.00 ($51–75\\text{ m}^3$), and ultimately reaches Rs. 410.00 per unit for consumption exceeding $75\\text{ m}^3$, accompanied by a quadrupled fixed monthly charge of Rs. 2,000.00.

Because the calculation involves multiple marginal rates and tiered fixed charges, average Sri Lankan citizens lack the mathematical tools or real-time data to estimate their upcoming bill by simply glancing at the spinning dials. Consequently, consumers remain unaware of impending tariff penalties until the physical bill arrives.

---

## 1.2 Justification of the Problem

### 1.2.1 Undetected Household Leakage and Financial Vulnerability
The fundamental vulnerability created by the 30-day manual reading cycle is the complete inability to detect internal plumbing anomalies as they occur. Domestic plumbing networks frequently develop hidden failures:
- **Nocturnal Micro-Leaks:** Defective toilet cistern flapper valves, stuck overhead storage tank float switches, and leaking garden hose bib taps typically lose between $0.15\\text{ L/min}$ and $1.5\\text{ L/min}$ ($9–90\\text{ litres per hour}$).
- **Underground Service Line Ruptures:** Cracks in buried PVC pipes between the boundary meter and the household sump can lose upwards of $5–15\\text{ L/min}$ continuously without showing surface wetness.
- **Catastrophic Ruptures:** Major pipe breaks or dislodged flexible tap connectors can discharge water at full pipe capacity ($>25\\text{ L/min}$).

A silent micro-leak flowing at an unexceptional rate of $0.5\\text{ L/min}$ ($30\\text{ L/hour}$) discharges approximately $21.6\\text{ m}^3$ ($21,600\\text{ litres}$) of treated water across a single 30-day billing period. When superimposed onto an average household's normal baseline consumption of $15\\text{ m}^3$, the total consumption surges from $15\\text{ m}^3$ (normal bill $\\approx \\text{Rs. } 1,540.00$) to $36.6\\text{ m}^3$ (leaking bill $\\approx \\text{Rs. } 6,556.00$), representing a staggering **325% financial escalation**. Under current NWSDB bylaws, the customer is legally obligated to settle the invoice in full regardless of whether the water was purposefully consumed or lost to concealed plumbing faults. This results in severe personal financial distress and contentious billing disputes.

### 1.2.2 Non-Revenue Water and Resource Depletion
From a national environmental and utility perspective, domestic leakage exacerbates Sri Lanka's critical Non-Revenue Water (NRW) crisis. The NWSDB reports average NRW rates exceeding 25% nationwide, rising to over 45% in dense urban centers such as the Colombo Municipal Council area. High NRW wastes millions of cubic metres of chemically treated, purified drinking water, squanders energy used in high-head pumping stations, strains municipal reservoir capacities during dry seasons, and needlessly accelerates capital depreciation of municipal water infrastructure. Providing residential consumers with the tools to immediately identify and halt post-meter leaks directly supports the United Nations Sustainable Development Goal 6 (Clean Water and Sanitation).

### 1.2.3 Economic and Technical Infeasibility of Wholesale Meter Replacement
To address these deficiencies, global water utilities increasingly deploy Advanced Metering Infrastructure (AMI) smart meters equipped with integrated ultrasonic or electromagnetic flow sensors and long-range cellular modems. However, replacing Sri Lanka's 2.8 million mechanical meters with commercial smart meters is economically and logistically unfeasible:
1. **Capital Expenditure:** Commercial residential smart meters cost between USD \\$150 and \\$300 per unit, requiring a national capital investment exceeding USD \\$500 million—a fiscal impossibility given prevailing macroeconomic constraints.
2. **Civil Plumbing Disruption:** Wholesale replacement mandates cutting pressurized municipal distribution lines, replacing fittings, disposing of functional mechanical assets, and coordinating access with millions of property owners.
3. **Asset Stranding:** Millions of mechanical meters in Sri Lanka were installed recently, possess decades of remaining mechanical service life, and meet all metrological accuracy standards.

### 1.2.4 Critique of Locally Available Commercial Digital Meters
While a limited selection of "digital water meters" has entered the local private market, a critical engineering analysis reveals that they merely replace the mechanical roller drum with an electronic liquid crystal display (LCD) driven by an internal magnetic reed switch. These standalone devices:
- Lack all wireless telemetry, cellular communication, and networking interfaces.
- Feature no computational intelligence, edge inference, or automated anomaly detection algorithms.
- Provide zero integration with the NWSDB tariff schedule or automated bill forecasting.
- Still require a human observer to stand over the meter to inspect the LCD.

Consequently, there is an urgent and distinct void in the Sri Lankan market for an **affordable, non-invasive, add-on IoT retrofitting module** that attaches externally to existing, in-situ mechanical meters, autonomously reads the physical roller counter using lightweight Edge Artificial Intelligence (TinyML), detects leaks in real time, computes progressive slab bills, and empowers households through conversational AI decision support.

---

## 1.3 Objectives of the Study

### 1.3.1 Primary Research Objective
The overarching objective of this capstone research is to **design, engineer, empirically validate, and deploy an affordable, non-invasive IoT retrofitting system for domestic mechanical water meters in Sri Lanka**, transforming legacy passive utility infrastructure into an intelligent, connected edge node capable of autonomous optical digit recognition, real-time multi-tier leak surveillance, dynamic NWSDB domestic slab tariff billing estimation, and conversational decision support.

### 1.3.2 Specific Research Objectives
To realize this primary aim, the project is structured around six specific engineering and research objectives:

- **Specific Objective 1 (RO-1: Edge Hardware & Firmware Engineering):**  
  To design, assemble, and optimize a low-cost, battery-powered optical edge node based on the AI-Thinker ESP32-CAM microcontroller and SIM800L 2G GSM cellular module, incorporating high-efficiency power regulation (LM2596 buck converter), voltage divider level shifting, LED flash illumination, a custom light-occluding 3D enclosure shroud, and deep-sleep duty cycling to maximize operational field longevity.

- **Specific Objective 2 (RO-2: TinyML Edge Convolutional Neural Network):**  
  To synthesize an augmented 100,000-sample dataset of mechanical meter dial digits (classes 0–9), architect a compact Convolutional Neural Network (CNN), train the model to exceed 97% recognition accuracy, apply post-training quantization to full INT8 precision, and deploy the resulting lightweight model ($\le 200\\text{ KB}$) directly onto the ESP32-CAM using TensorFlow Lite for Microcontrollers (TFLM).

- **Specific Objective 3 (RO-3: Two-Tier Physics & Machine Learning Leak Detection):**  
  To formulate and implement a two-tier leak detection engine calibrated specifically for 3/4-inch domestic supply lines, combining deterministic domain physics rules (night-flow gating between 01:00–05:00 AM for micro-leaks $\ge 0.15\\text{ L/min}$; pipe burst velocity monitoring $>25\\text{ L/min}$) with an unsupervised multi-dimensional Isolation Forest machine learning model to detect behavioral usage anomalies.

- **Specific Objective 4 (RO-4: Predictive Diurnal Forecaster & Explainable AI):**  
  To engineer a predictive consumption forecaster utilizing a time-decayed diurnal usage curve blended with a 12-hour sliding window of telemetry to project 4-hour forward usage and end-of-month volume, coupled with an Explainable AI (XAI) feature contribution module providing transparent, human-interpretable causal attribution for detected anomalies.

- **Specific Objective 5 (RO-5: Automated NWSDB Slab Billing & Conversational RAG):**  
  To program an exact progressive domestic slab tariff engine mirroring the official 10-tier NWSDB pricing gazette, and architect a Retrieval-Augmented Generation (RAG) conversational assistant powered by Google Gemini with an offline deterministic keyword-fallback engine to deliver contextualized billing, repair guidance, and telemetry analytics to residential users.

- **Specific Objective 6 (RO-6: Web Application & Empirical System Verification):**  
  To build an integrated full-stack web application comprising a Flask REST API backend, SQLite relational database, and an aquatic dark-mode React 18 Single Page Application featuring interactive mechanical drum animations, live gauges, camera snapshot audit inspection, and scenario simulation tools, subsequently subjecting the entire system to comprehensive automated unit, integration, and comparative benchmarks.

### 1.3.3 Research Questions
The study is guided by two fundamental research questions formulated to test the feasibility and efficiency of edge intelligence in municipal utility retrofitting:

- **Research Question 1 (RQ-1 - Feasibility of Microcontroller Edge AI):**  
  *Can a quantized deep learning model run reliably within the constrained static RAM limits of an inexpensive, off-the-shelf ESP32-CAM microcontroller while maintaining an optical character recognition accuracy greater than or equal to 97% on weathered mechanical water meter roller digits?*

- **Research Question 2 (RQ-2 - Edge vs. Cloud Efficiency):**  
  *To what extent does executing optical inference locally on the edge microcontroller and transmitting compact numeric telemetry—as opposed to offloading uncompressed raw camera images to the cloud—improve cellular data consumption, system latency, and battery operational lifespan in resource-constrained IoT deployments?*

### 1.3.4 Scope and Delimitations
- **Target Meter Hardware:** The study focuses specifically on standard domestic mechanical rotary/roller-drum water meters featuring five inline digits (four white integer cubic metre drums and one red fractional drum) as standardized by the NWSDB across Sri Lanka.
- **Hydraulic Specification:** Fluid dynamics thresholds and flow rate calculations are calibrated for standard 3/4-inch ($20\\text{ mm}$) nominal diameter residential service pipes operating under normal municipal pressure ($1.5–3.5\\text{ bar}$), yielding an expected open-flow maximum rate of approximately $25\\text{ L/min}$.
- **Cellular Telemetry:** Data transmission is delimited to the 2G GSM/GPRS cellular network via HTTP POST requests, reflecting the most universally accessible cellular standard across rural, semi-urban, and deep topographical regions of Sri Lanka where 4G LTE or NB-IoT coverage remains incomplete.
- **Tariff Modeling:** Economic calculations are based strictly on the domestic residential tariff schedule published by the NWSDB, excluding commercial, industrial, or institutional slab rates.
"""
print("Chapter 01 module written.")
