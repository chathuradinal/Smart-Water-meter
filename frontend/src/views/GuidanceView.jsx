import React, { useState } from 'react';
import { Card, Typography, Row, Col, Space, Tag, Tabs, Table, Divider, Alert, Button } from 'antd';
import {
  BookOutlined, CameraOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, DollarOutlined, ToolOutlined,
  CheckCircleOutlined, CompassOutlined, EyeOutlined,
  DashboardOutlined, InfoCircleOutlined, ControlOutlined,
  ApiOutlined, WifiOutlined
} from '@ant-design/icons';
import { Camera, Focus, Zap, ShieldCheck, Droplets, Wrench, Layers, Activity, Cpu, Radio } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export default function GuidanceView() {
  const [activeKey, setActiveKey] = useState('camera');

  const tariffData = [
    { key: '1', slab: '00 – 05 Units (m³)', rate: 'Rs. 60.00 / unit', fixed: 'Rs. 300.00', desc: 'Subsidized Lifeline Tier' },
    { key: '2', slab: '06 – 10 Units (m³)', rate: 'Rs. 80.00 / unit', fixed: 'Rs. 300.00', desc: 'Basic Domestic Allowance' },
    { key: '3', slab: '11 – 15 Units (m³)', rate: 'Rs. 100.00 / unit', fixed: 'Rs. 340.00', desc: 'Typical Domestic Consumption' },
    { key: '4', slab: '16 – 20 Units (m³)', rate: 'Rs. 110.00 / unit', fixed: 'Rs. 400.00', desc: 'Moderate Household Usage' },
    { key: '5', slab: '21 – 25 Units (m³)', rate: 'Rs. 130.00 / unit', fixed: 'Rs. 500.00', desc: 'Higher Demand Tier' },
    { key: '6', slab: '26 – 30 Units (m³)', rate: 'Rs. 160.00 / unit', fixed: 'Rs. 600.00', desc: 'Upper Tier Usage' },
    { key: '7', slab: '31 – 40 Units (m³)', rate: 'Rs. 180.00 / unit', fixed: 'Rs. 1,200.00', desc: 'High Volume Domestic' },
    { key: '8', slab: '41 – 50 Units (m³)', rate: 'Rs. 210.00 / unit', fixed: 'Rs. 2,400.00', desc: 'Intensive Water Usage' },
    { key: '9', slab: 'Above 50 Units (m³)', rate: 'Rs. 240.00 / unit', fixed: 'Rs. 3,500.00', desc: 'Maximum Conservation Surcharge' },
  ];

  const tariffColumns = [
    { title: 'Monthly Consumption Slab', dataIndex: 'slab', key: 'slab', render: (t) => <strong style={{ color: '#F1F5F9' }}>{t}</strong> },
    { title: 'Unit Rate (LKR / m³)', dataIndex: 'rate', key: 'rate', render: (t) => <Tag color="#0077B6" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t}</Tag> },
    { title: 'Monthly Fixed Charge', dataIndex: 'fixed', key: 'fixed', render: (t) => <span style={{ color: '#FCD34D', fontFamily: 'monospace' }}>{t}</span> },
    { title: 'Tariff Classification', dataIndex: 'desc', key: 'desc', render: (t) => <span style={{ color: '#94A3B8' }}>{t}</span> },
  ];

  const tabItems = [
    {
      key: 'camera',
      label: (
        <span>
          <CameraOutlined style={{ marginRight: 6 }} />
          Camera & Optical Lens
        </span>
      ),
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>📷 OV2640 Lens & Focus Calibration</span>}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  The OmniVision OV2640 image sensor features an adjustable M12 threaded lens calibrated for a working distance of
                  <strong style={{ color: '#38BDF8' }}> 5 – 8 cm</strong> from the physical glass face of the 3/4" water meter.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>FOCAL DISTANCE</span>
                    <span style={{ color: '#F1F5F9', fontWeight: 600 }}>6.5 cm perpendicular to dial glass</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>EXPOSURE STABILIZATION</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>500 ms LED flash fire before shutter</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>PIXEL FORMAT</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>QVGA 320×240 Grayscale (Y8 8-bit)</span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>🛡️ Meter Pit Installation & Anti-Glare Tilt</span>}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  Guidelines for mounting inside damp outdoor meter pits and underground utility chambers:
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>ANTI-GLARE OFFSET</span>
                    <span style={{ color: '#38BDF8', fontWeight: 600 }}>5° angle tilt prevents specular reflection from the flash</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>ENCLOSURE SPECIFICATION</span>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>IP65 Weatherproof ABS housing with silica gel pack</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 10 }}>CELLULAR UPLINK</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 600 }}>SIM800L 2G GSM cellular module transmitting telemetry</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Space>
      )
    },
    {
      key: 'iot_hardware',
      label: (
        <span>
          <ApiOutlined style={{ marginRight: 6 }} />
          IoT Hardware & Assembly
        </span>
      ),
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* Section 1: Physical Items & Bill of Materials */}
          <Card
            className="aquatic-card"
            title={<span style={{ color: '#F1F5F9' }}>📦 Physical Components Bill of Materials (BOM)</span>}
          >
            <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
              Required hardware items to build and retrofit the physical optical edge node onto a standard 3/4" mechanical water meter:
            </Paragraph>
            <Table
              dataSource={[
                { key: '1', item: 'AI-Thinker ESP32-CAM', spec: '240MHz Dual-Core, 4MB PSRAM, OV2640 2MP lens', role: 'Camera capture & edge processing' },
                { key: '2', item: 'FTDI USB-to-TTL Adapter', spec: 'FT232RL or CP2102 (5V logic selectable)', role: 'Programming & serial monitor over USB' },
                { key: '3', item: 'Power Supply', spec: '5V 2A USB Adapter (Indoor) or 2× 18650 Li-ion Cells (Field Pit)', role: 'Handles 1.5A peak current when Flash LED fires' },
                { key: '4', item: 'LM2596 DC-DC Buck Converter', spec: 'Step-down regulator tuned to 4.3V - 5.0V', role: 'Stable power regulation from battery pack' },
                { key: '5', item: 'SIM800L Cellular Modem', spec: '2G GSM/GPRS module (Optional for outdoor pits)', role: 'Cellular telemetry upload without Wi-Fi' },
                { key: '6', item: 'Filter Capacitor', spec: '1000 µF Electrolytic (16V or higher)', role: 'Buffers 2A transmission bursts on cellular rail' },
                { key: '7', item: 'Resistors (Level Shifter)', spec: '1× 1 kΩ and 1× 2.2 kΩ (1/4W)', role: 'Protects 2.8V SIM800L RX from 3.3V ESP32 TX' },
                { key: '8', item: 'Mechanical Shroud Spacer', spec: '50mm PVC Coupler or 3D Printed Cylinder (6.5 cm)', role: 'Ensures fixed focus and blocks daylight glare' },
              ]}
              columns={[
                { title: 'Hardware Item', dataIndex: 'item', key: 'item', render: (t) => <strong style={{ color: '#38BDF8' }}>{t}</strong> },
                { title: 'Specification', dataIndex: 'spec', key: 'spec', render: (t) => <span style={{ color: '#F1F5F9' }}>{t}</span> },
                { title: 'Functional Role', dataIndex: 'role', key: 'role', render: (t) => <span style={{ color: '#94A3B8' }}>{t}</span> },
              ]}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
          </Card>

          {/* Section 2: Flashing Wiring & Optical Focus Hack */}
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>⚡ FTDI Programmer Flashing Pinout</span>}
                style={{ height: '100%' }}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  Connect the FTDI programmer to the ESP32-CAM to flash firmware via Arduino IDE:
                </Paragraph>
                <div style={{ background: '#050f21', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.2)', fontFamily: 'monospace', fontSize: 12, color: '#38BDF8', lineHeight: 1.8 }}>
                  <div>FTDI VCC (5V) ──────► ESP32-CAM 5V</div>
                  <div>FTDI GND ─────────► ESP32-CAM GND</div>
                  <div>FTDI TXD ─────────► ESP32-CAM U0R (GPIO 3)</div>
                  <div>FTDI RXD ─────────► ESP32-CAM U0T (GPIO 1)</div>
                  <div style={{ color: '#F59E0B', fontWeight: 'bold' }}>GPIO 0 ──────► GND (BRIDGE TO FLASH, REMOVE TO RUN)</div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
                  • Press the ESP32-CAM <strong>RST</strong> button before uploading.<br />
                  • After upload finishes, disconnect GPIO 0 from GND and press RST to start.
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>🔍 Physical Lens Focus Hack</span>}
                style={{ height: '100%' }}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  Factory OV2640 lenses are glued for infinite distance (~1m). You must recalibrate it for 6.5 cm macro focus:
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#F59E0B', fontWeight: 600, display: 'block' }}>1. BREAK GLUE SEAL</span>
                    <span style={{ color: '#CBD5E1' }}>Use needle-nose pliers to gently turn the brass lens ring counter-clockwise until the tiny glue drop cracks.</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#38BDF8', fontWeight: 600, display: 'block' }}>2. ROTATE 2.5 TURNS</span>
                    <span style={{ color: '#CBD5E1' }}>Rotate the lens counter-clockwise by 2 to 3 full revolutions to bring the focal plane to 6.5 cm.</span>
                  </div>
                  <div style={{ background: '#050f21', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
                    <span style={{ color: '#10B981', fontWeight: 600, display: 'block' }}>3. LOCK WITH TAPE/GLUE</span>
                    <span style={{ color: '#CBD5E1' }}>Check sharpness on the live dashboard, then apply a tiny dot of tape or glue to permanently fix the focus.</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Section 3: Ready Firmware Options */}
          <Card
            className="aquatic-card"
            title={<span style={{ color: '#F1F5F9' }}>💻 Ready Firmware Source Files in Codebase</span>}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ background: '#050f21', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#38BDF8', fontSize: 14 }}>Option A: Wi-Fi Live Uploader</strong>
                    <Tag color="#0077B6">Recommended for Testing</Tag>
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 12, display: 'block', marginBottom: 10 }}>
                    File: <code style={{ color: '#F1F5F9' }}>iot/firmware/esp32_cam_wifi.ino</code>
                  </Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                    Connects to Wi-Fi (<code style={{ color: '#F1F5F9' }}>SLT-4G_1EEBBD</code>), hosts a live MJPEG stream on port 81 (<code style={{ color: '#38BDF8' }}>:81/stream</code>), single capture on port 80 (<code style={{ color: '#38BDF8' }}>/capture</code>), and auto-uploads frames directly to the backend at port 5001 (<code style={{ color: '#38BDF8' }}>/api/camera/upload</code>).
                  </Text>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ background: '#050f21', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#10B981', fontSize: 14 }}>Option B: Edge TinyML + SIM800L</strong>
                    <Tag color="#10B981">Field Pit Production</Tag>
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 12, display: 'block', marginBottom: 10 }}>
                    File: <code style={{ color: '#F1F5F9' }}>iot/firmware/water_meter_firmware.ino</code>
                  </Text>
                  <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                    Runs INT8 quantized neural network on ESP32 PSRAM, extracts the 5 drum numbers on-device, transmits telemetry via 2G GSM SIM800L, and sleeps for 10 min / 6 hours.
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Space>
      )
    },
    {
      key: 'drums',
      label: (
        <span>
          <Layers size={14} style={{ display: 'inline', marginRight: 6 }} />
          5-Drum ROIs & OCR
        </span>
      ),
      children: (
        <Card className="aquatic-card">
          <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
            The physical mechanical register contains 5 roller drums. Each drum window is extracted as a 28×28 grayscale pixel Region of Interest (ROI) and evaluated by an on-device INT8-quantized TinyML CNN (`model.h`, 113.7 KB):
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ background: '#050f21', textAlign: 'center', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11 }}>DRUMS 1–4</Text>
                <Title level={4} style={{ color: '#FFFFFF', margin: '4px 0' }}>White Drums</Title>
                <Text style={{ color: '#38BDF8', fontSize: 12 }}>Whole Cubic Meters (m³)</Text>
                <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>ROIs at x=40, 72, 104, 136</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ background: 'rgba(220, 38, 38, 0.15)', textAlign: 'center', borderColor: 'rgba(220, 38, 38, 0.4)' }}>
                <Text style={{ color: '#FCA5A5', fontSize: 11 }}>DRUM 5</Text>
                <Title level={4} style={{ color: '#EF4444', margin: '4px 0' }}>Red Speed Drum #8</Title>
                <Text style={{ color: '#FEE2E2', fontSize: 12 }}>Tenths of m³ (0.1 m³ = 100 L)</Text>
                <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Text style={{ color: '#FCA5A5', fontSize: 11 }}>Fastest rotating drum (x=168)</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ background: '#050f21', textAlign: 'center', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11 }}>RESOLUTION</Text>
                <Title level={4} style={{ color: '#10B981', margin: '4px 0' }}>0.15 L/min</Title>
                <Text style={{ color: '#34D399', fontSize: 12 }}>Micro-Leak Sensitivity</Text>
                <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>Catches toilet flapper drips</Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ background: '#050f21', textAlign: 'center', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11 }}>TINYML CNN</Text>
                <Title level={4} style={{ color: '#00B4D8', margin: '4px 0' }}>99.91%</Title>
                <Text style={{ color: '#38BDF8', fontSize: 12 }}>Validation Accuracy</Text>
                <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                <Text style={{ color: '#94A3B8', fontSize: 11 }}>~45 ms on ESP32 PSRAM</Text>
              </Card>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'algorithms',
      label: (
        <span>
          <SafetyCertificateOutlined style={{ marginRight: 6 }} />
          AI Leak Algorithms
        </span>
      ),
      children: (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>🧠 Tier 1: Night Resting Flow Gate</span>}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  Monitors continuous flow during low-usage domestic hours (01:00 to 05:00 hrs).
                  In a domestic household, the resting baseline should be strictly 0.00 L/min when occupants are asleep.
                </Paragraph>
                <div style={{ background: '#050f21', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)', fontSize: 12, color: '#CBD5E1' }}>
                  <div>• <strong>Threshold:</strong> Flow &gt; 0.15 L/min for &gt; 30 consecutive minutes triggers an alert.</div>
                  <div style={{ marginTop: 6 }}>• <strong>Target Anomalies:</strong> Toilet cistern leaks, worn tap washers, irrigation drippers.</div>
                  <div style={{ marginTop: 6 }}>• <strong>Advantage:</strong> Zero false alarms from daytime dishwashing or showers.</div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                className="aquatic-card"
                title={<span style={{ color: '#F1F5F9' }}>🌲 Tier 2: Unsupervised Isolation Forest</span>}
              >
                <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
                  Evaluates multi-dimensional telemetry vectors without requiring labeled leak training data:
                </Paragraph>
                <div style={{ background: '#050f21', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.15)', fontSize: 12, color: '#CBD5E1' }}>
                  <div>• <strong>Feature 1:</strong> Instantaneous Flow Rate ($L/\text{min}$).</div>
                  <div>• <strong>Feature 1:</strong> Instantaneous Flow Rate (L/min).</div>
                  <div style={{ marginTop: 4 }}>• <strong>Feature 2:</strong> Consecutive Non-Zero Flow Duration.</div>
                  <div style={{ marginTop: 4 }}>• <strong>Feature 3:</strong> Diurnal Hour-of-Day Multiplier.</div>
                  <div style={{ marginTop: 4 }}>• <strong>Feature 4:</strong> Delta Volume increment between frames.</div>
                  <div style={{ marginTop: 4 }}>• <strong>Contamination Parameter:</strong> Calibrated to 0.05 (5% anomaly threshold).</div>
                </div>
              </Card>
            </Col>
          </Row>
        </Space>
      )
    },
    {
      key: 'tariffs',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 6 }} />
          Sri Lanka NWSDB Tariffs
        </span>
      ),
      children: (
        <Card className="aquatic-card">
          <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
            Official Gazette Domestic Tariff Structure of the Sri Lanka National Water Supply & Drainage Board (NWSDB).
            Billing utilizes a progressive block rate where each slab has an escalating price per unit:
          </Paragraph>
          <Table
            dataSource={tariffData}
            columns={tariffColumns}
            pagination={false}
            scroll={{ x: 600 }}
            size="small"
          />
        </Card>
      )
    },
    {
      key: 'troubleshooting',
      label: (
        <span>
          <ToolOutlined style={{ marginRight: 6 }} />
          Leak Repair Checklist
        </span>
      ),
      children: (
        <Card className="aquatic-card">
          <Paragraph style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>
            When an anomaly alert is flagged by AquaMeter AI, follow this practical 4-step domestic diagnostic checklist:
          </Paragraph>

          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ background: '#050f21', padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
              <Text strong style={{ color: '#EF4444', fontSize: 14, display: 'block', marginBottom: 4 }}>
                1. Inspect Toilet Cisterns (Accounts for 70% of silent domestic leaks)
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                Place 4–5 drops of food dye into the cistern tank without flushing. If colored water appears in the toilet bowl within 15 minutes, the rubber flapper valve is deteriorated and must be replaced.
              </Text>
            </div>

            <div style={{ background: '#050f21', padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
              <Text strong style={{ color: '#F59E0B', fontSize: 14, display: 'block', marginBottom: 4 }}>
                2. Check Overhead Tank Float Valve & Overflow Line
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                Climb up to the roof tank or inspect the overflow spout. If water is trickling out of the overflow drain onto the roof or ground, the mechanical brass/plastic float ball valve has failed and cannot seal under pressure.
              </Text>
            </div>

            <div style={{ background: '#050f21', padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
              <Text strong style={{ color: '#38BDF8', fontSize: 14, display: 'block', marginBottom: 4 }}>
                3. Inspect Garden Bib Taps & Outdoor Hoses
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                Check all outdoor garden taps, pressure washer quick-connects, and hose bibs. Replace cracked rubber washers on dripping taps.
              </Text>
            </div>

            <div style={{ background: '#050f21', padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(0, 180, 216, 0.15)' }}>
              <Text strong style={{ color: '#10B981', fontSize: 14, display: 'block', marginBottom: 4 }}>
                4. Test Main Stopcock for Underground Pipe Rupture
              </Text>
              <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                Shut off the main stopcock valve where water enters the house. If the red speed drum #8 on the meter continues to rotate, the leak is located on the underground supply pipe between the meter and the house stopcock.
              </Text>
            </div>
          </Space>
        </Card>
      )
    }
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* ── Guidance Banner ───────────────────────────────────────────────── */}
      <Card className="aquatic-card" style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 180, 216, 0.4)'
            }}>
              <BookOutlined style={{ fontSize: 22, color: '#FFFFFF' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#FFFFFF', fontSize: 18 }}>
                Technical Guidance & Operations Manual
              </Title>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Hardware calibration, 5-drum TinyML OCR, Two-Tier Leak AI, and official Sri Lanka NWSDB domestic tariffs
              </Text>
            </div>
          </div>

          <Tag color="#0077B6" style={{ padding: '4px 12px', fontSize: 12, borderRadius: 8, margin: 0 }}>
            v2.4 Technical Specification
          </Tag>
        </div>
      </Card>

      {/* ── Categorized Guidance Tabs ──────────────────────────────────────── */}
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={tabItems}
        size="large"
        tabBarStyle={{ marginBottom: 20 }}
      />
    </Space>
  );
}
