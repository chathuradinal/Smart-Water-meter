import React from 'react';
import { Row, Col, Card, Typography, Statistic, Progress, Button, Alert, Tag, Space, Divider } from 'antd';
import { 
  ThunderboltOutlined, ArrowUpOutlined, ArrowDownOutlined,
  HistoryOutlined, CheckCircleOutlined, WarningOutlined,
  DollarOutlined, RocketOutlined
} from '@ant-design/icons';
import { Droplets, Activity, Gauge, ShieldAlert, ShieldCheck, Waves, ArrowRight } from 'lucide-react';
import TelemetryChart from '../components/TelemetryChart';
import SimulationControls from '../components/SimulationControls';

const { Title, Text, Paragraph } = Typography;

export default function DashboardView({ 
  status, 
  readings, 
  onSimulate, 
  onNavigateSnapshots,
  onNavigateGuidance
}) {
  const currentReading = Number(status.current_reading_m3 || 37.2468);
  const flowRate = Number(status.flow_rate_lpm || 0.0);
  const bill = Number(status.estimated_bill_lkr || 300.0);
  const slabRate = Number(status.current_slab_rate_lkr || 60.0);
  const isLeak = Boolean(status.is_leak_active);
  const activeAlert = isLeak && status.active_alerts?.length > 0 ? status.active_alerts[0] : null;

  // Split reading into 5 drums: 4 white + 1 red #8
  const d1 = Math.floor((currentReading / 1000) % 10);
  const d2 = Math.floor((currentReading / 100) % 10);
  const d3 = Math.floor((currentReading / 10) % 10);
  const d4 = Math.floor(currentReading % 10);
  const d5 = Math.floor((currentReading * 10) % 10);

  // Pipe capacity ratio (3/4" pipe max ~25 L/min)
  const pipeMaxFlow = 25.0;
  const flowPercent = Math.min(100, Math.round((flowRate / pipeMaxFlow) * 100));

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Active Leak Alert Banner if Leak Detected */}
      {isLeak && activeAlert && (
        <Alert
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                ⚠️ CRITICAL LEAK SURVEILLANCE ALERT: {activeAlert.message}
              </span>
              <Tag color="#DC2626" style={{ fontWeight: 700, fontSize: 11 }}>
                {activeAlert.severity} SEVERITY
              </Tag>
            </div>
          }
          description={
            <div style={{ marginTop: 4, color: '#FEE2E2', fontSize: 13 }}>
              Continuous flow of <strong>{flowRate.toFixed(2)} L/min</strong> detected on your 3/4" domestic connection. 
              Resting night surveillance model confirms abnormal usage. Please inspect toilet cisterns, float valves, and taps.
            </div>
          }
          type="error"
          showIcon
          style={{
            background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.8) 0%, rgba(185, 28, 28, 0.8) 100%)',
            border: '1px solid #EF4444',
            borderRadius: 14,
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)'
          }}
        />
      )}

      {/* ── Top Metric Cards Grid (Spacious & Balanced) ─────────────────── */}
      <Row gutter={[20, 20]}>
        {/* Card 1: Hero Mechanical Counter Roller Drums */}
        <Col xs={24} md={12} lg={8}>
          <Card 
            className="aquatic-card"
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F1F5F9', fontSize: 14 }}>
                <Droplets size={16} color="#00B4D8" />
                Mechanical Counter Reading
              </span>
            }
            extra={
              <Tag color="#0077B6" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                Class B · 3/4"
              </Tag>
            }
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0 16px' }}>
              {/* Spacious 3D Roller Drums (4 White + 1 Red #8) */}
              <div className="hero-drum-frame">
                <div className="hero-drum-unit hero-drum-white" title="Thousands (m³)">{d1}</div>
                <div className="hero-drum-unit hero-drum-white" title="Hundreds (m³)">{d2}</div>
                <div className="hero-drum-unit hero-drum-white" title="Tens (m³)">{d3}</div>
                <div className="hero-drum-unit hero-drum-white" title="Ones (m³)">{d4}</div>
                <div className="hero-drum-unit hero-drum-red" title="Fast Drum #8: Tenths (0.1 m³)">{d5}</div>
                <span style={{ color: '#00B4D8', fontWeight: 800, fontSize: 20, marginLeft: 6, fontFamily: 'monospace' }}>m³</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 180, 216, 0.15)', paddingTop: 12 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Precision Dial Value:</Text>
              <Text strong style={{ color: '#38BDF8', fontFamily: 'monospace', fontSize: 14 }}>
                {currentReading.toFixed(4)} m³
              </Text>
            </div>
          </Card>
        </Col>

        {/* Card 2: Instantaneous Flow Meter Gauge */}
        <Col xs={24} md={12} lg={8}>
          <Card 
            className="aquatic-card"
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F1F5F9', fontSize: 14 }}>
                <Gauge size={16} color="#34D399" />
                Live Flow Rate (L/min)
              </span>
            }
            extra={
              <Tag color={flowRate > 0 ? (isLeak ? '#DC2626' : '#10B981') : '#475569'} style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                {flowRate > 0 ? `${flowRate.toFixed(2)} L/min` : 'Resting (0 L/min)'}
              </Tag>
            }
            style={{ height: '100%' }}
          >
            <div style={{ margin: '6px 0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <Statistic 
                  value={flowRate} 
                  precision={2} 
                  suffix={<span style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>L/min</span>}
                  styles={{ content: { color: flowRate > 10.0 ? '#EF4444' : (flowRate > 0 ? '#38BDF8' : '#94A3B8'), fontSize: 28 } }}
                />
                <Text style={{ color: '#64748B', fontSize: 11 }}>Max: 25.0 L/min</Text>
              </div>

              {/* Progress bar showing pipe capacity */}
              <Progress 
                percent={flowPercent} 
                strokeColor={{
                  '0%': '#00B4D8',
                  '70%': '#F59E0B',
                  '100%': '#EF4444'
                }}
                railColor="rgba(255, 255, 255, 0.08)"
                showInfo={false}
                size={[undefined, 10]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 180, 216, 0.15)', paddingTop: 12 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Flow Surveillance:</Text>
              <Text strong style={{ color: isLeak ? '#EF4444' : '#10B981', fontSize: 12 }}>
                {isLeak ? '⚠️ Anomalous Night Flow' : '✅ Baseline Normal'}
              </Text>
            </div>
          </Card>
        </Col>

        {/* Card 3: NWSDB Domestic Slab Tariff */}
        <Col xs={24} md={24} lg={8}>
          <Card 
            className="aquatic-card"
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F1F5F9', fontSize: 14 }}>
                <DollarOutlined style={{ color: '#F59E0B' }} />
                NWSDB Estimated Domestic Bill
              </span>
            }
            extra={
              <Tag color="#F59E0B" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                Domestic Slab
              </Tag>
            }
            style={{ height: '100%' }}
          >
            <div style={{ margin: '6px 0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <Statistic 
                  value={bill} 
                  precision={2} 
                  prefix={<span style={{ fontSize: 16, marginRight: 4, color: '#F59E0B' }}>Rs.</span>}
                  styles={{ content: { color: '#FCD34D', fontSize: 28 } }}
                />
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  Rate: <strong>Rs. {slabRate}/unit</strong>
                </Text>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11,
                color: '#FDE68A',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Period Units: <strong>{Number(status.consumed_period_units_m3 || 0).toFixed(2)} m³</strong></span>
                <span>Fixed: <strong>Rs. {status.fixed_charge_lkr || 300}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(0, 180, 216, 0.15)', paddingTop: 12 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Tariff Structure:</Text>
              <Text strong style={{ color: '#FCD34D', fontSize: 12 }}>
                Slab 01-05 (Rs. 60/m³)
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Middle Section: Telemetry Chart & Simulation Toolbar ────────── */}
      <Card 
        className="aquatic-card"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F1F5F9', fontSize: 15 }}>
              <Activity size={18} color="#00B4D8" />
              10-Minute Interval Telemetry Stream
            </span>
            <SimulationControls onSimulate={onSimulate} />
          </div>
        }
      >
        <div style={{ height: 320 }}>
          <TelemetryChart readings={readings} />
        </div>
      </Card>

      {/* ── Bottom Section: Quick Links Strip to Snapshot History & AI ────── */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <div 
            onClick={onNavigateSnapshots}
            style={{
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.12) 0%, rgba(10, 25, 47, 0.85) 100%)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              borderRadius: 16,
              padding: '20px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease'
            }}
            className="aquatic-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(0, 180, 216, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HistoryOutlined style={{ fontSize: 22, color: '#00B4D8' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                  Snapshot History Archive & OCR
                </Title>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Inspect real captured dial images, extracted numbers & confidence
                </Text>
              </div>
            </div>
            <Button 
              type="primary" 
              ghost 
              icon={<ArrowRight size={14} style={{ display: 'inline' }} />}
              style={{ borderColor: '#00B4D8', color: '#00B4D8' }}
            >
              Open History
            </Button>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div 
            onClick={onNavigateGuidance}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 25, 47, 0.85) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: onNavigateGuidance ? 'pointer' : 'default',
              transition: 'all 0.25s ease'
            }}
            className="aquatic-card"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={22} color="#10B981" />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                  Two-Tier Leak Surveillance System
                </Title>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Surveillance Active: Resting Flow (01:00-05:00) + Isolation Forest
                </Text>
              </div>
            </div>
            {onNavigateGuidance ? (
              <Button 
                type="primary" 
                ghost 
                icon={<ArrowRight size={14} style={{ display: 'inline' }} />}
                style={{ borderColor: '#10B981', color: '#10B981' }}
              >
                View Specs
              </Button>
            ) : (
              <Tag color="#10B981" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>
                Active
              </Tag>
            )}
          </div>
        </Col>
      </Row>
    </Space>
  );
}

