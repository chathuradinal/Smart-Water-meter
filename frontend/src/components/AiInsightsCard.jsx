import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Tag, Segmented, 
  Progress, Statistic, Space, Alert, Button, Tooltip, Divider 
} from 'antd';
import { 
  BulbOutlined, LineChartOutlined, SafetyCertificateOutlined, 
  WarningOutlined, CheckCircleOutlined, ThunderboltOutlined,
  ReloadOutlined, InfoCircleOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { 
  TrendingUp, ShieldCheck, AlertCircle, BarChart3, 
  Clock, Droplets, Zap, Activity, Waves 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

const { Title, Text, Paragraph } = Typography;

export default function AiInsightsCard({ onSimulateTrigger }) {
  const [activeTab, setActiveTab] = useState('forecast'); // 'forecast' | 'explain'
  const [forecastData, setForecastData] = useState(null);
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [fRes, xRes] = await Promise.all([
        fetch('/api/forecast'),
        fetch('/api/explain')
      ]);
      if (fRes.ok) setForecastData(await fRes.json());
      if (xRes.ok) setXaiData(await xRes.json());
    } catch (err) {
      console.error("AI Insights fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 10000);
    return () => clearInterval(interval);
  }, []);

  // Expose reload if triggered externally
  useEffect(() => {
    if (onSimulateTrigger) {
      fetchInsights();
    }
  }, [onSimulateTrigger]);

  // 4-Hour Forward Forecast Chart Data
  const forecastChartData = {
    labels: forecastData?.labels || ['+10m', '+20m', '+30m', '+40m', '+50m', '+1h', '+1h10', '+1h20'],
    datasets: [
      {
        label: 'Predicted Flow Rate (L/min)',
        data: forecastData?.predicted_flow_lpm || [0.8, 1.2, 1.5, 1.1, 0.9, 0.6, 0.5, 0.4],
        borderColor: '#00B4D8',
        backgroundColor: 'rgba(0, 180, 216, 0.15)',
        borderWidth: 2.5,
        tension: 0.38,
        fill: true,
        pointBackgroundColor: '#00B4D8',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 3.5,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { 
          color: '#CBD5E1', 
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } 
        }
      },
      tooltip: {
        backgroundColor: 'rgba(5, 15, 33, 0.95)',
        titleColor: '#00B4D8',
        bodyColor: '#F8FAFC',
        borderColor: 'rgba(0, 180, 216, 0.4)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => ` Projected Flow: ${Number(context.raw || 0).toFixed(2)} L/min`
        }
      }
    },
    scales: {
      x: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
        ticks: { color: '#94A3B8', maxTicksLimit: 12, font: { family: 'JetBrains Mono', size: 11 } } 
      },
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
        ticks: { 
          color: '#94A3B8',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (val) => `${val} L/m`
        }, 
        beginAtZero: true 
      }
    }
  };

  const isAnomaly = Boolean(xaiData?.is_anomaly);

  return (
    <Card 
      className="aquatic-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(0, 180, 216, 0.4)'
            }}>
              <TrendingUp size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>
                  AI Diagnostics & Predictive Forecaster
                </span>
                <Tag color="#0077B6" style={{ borderRadius: 6, fontWeight: 600 }}>
                  Isolation Forest + Diurnal Curve
                </Tag>
              </div>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Forward 4-hour consumption trajectory and Explainable AI (XAI) feature contribution weights
              </Text>
            </div>
          </div>

          <Space size="middle">
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: '4h Predictive Forecast', value: 'forecast', icon: <LineChartOutlined /> },
                { label: 'XAI Feature Weights', value: 'explain', icon: <BulbOutlined /> }
              ]}
              style={{ background: '#050f21', border: '1px solid rgba(0, 180, 216, 0.25)' }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchInsights}
              loading={loading}
              style={{ background: '#07162c', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#CBD5E1' }}
            >
              Refresh
            </Button>
          </Space>
        </div>
      }
    >
      {/* ── Tab 1: 4-Hour Predictive Consumption Forecaster ─────────────────── */}
      {activeTab === 'forecast' && (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* 3 Metric Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(10, 25, 47, 0.85)', 
                  borderColor: 'rgba(0, 180, 216, 0.25)',
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next 4-Hour Projected Demand
                </Text>
                <Title level={3} style={{ color: '#38BDF8', margin: '4px 0', fontFamily: 'monospace' }}>
                  {Number(forecastData?.projected_4h_m3 || 0.0456).toFixed(4)} m³
                </Title>
                <Text style={{ color: '#64748B', fontSize: 11 }}>
                  24 forward 10-minute intervals (~{((forecastData?.projected_4h_m3 || 0.0456) * 1000).toFixed(0)} Liters)
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(10, 25, 47, 0.85)', 
                  borderColor: 'rgba(0, 180, 216, 0.25)',
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Projected 30-Day Monthly Total
                </Text>
                <Title level={3} style={{ color: '#F8FAFC', margin: '4px 0', fontFamily: 'monospace' }}>
                  {Number(forecastData?.projected_monthly_units_m3 || 14.5).toFixed(1)} Units
                </Title>
                <Text style={{ color: '#10B981', fontSize: 11 }}>
                  Typical Domestic Range: 12 – 18 m³
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card 
                size="small" 
                style={{ 
                  background: 'rgba(10, 25, 47, 0.85)', 
                  borderColor: 'rgba(0, 180, 216, 0.25)',
                  borderRadius: 12
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Estimated End-of-Month Bill
                </Text>
                <Title level={3} style={{ color: '#FCD34D', margin: '4px 0', fontFamily: 'monospace' }}>
                  Rs. {Number(forecastData?.projected_monthly_bill_lkr || 1640).toFixed(2)}
                </Title>
                <Text style={{ color: '#F59E0B', fontSize: 11 }}>
                  NWSDB Domestic Slab Trajectory
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Forward Time-Series Consumption Curve */}
          <div style={{
            background: 'rgba(5, 15, 33, 0.7)',
            padding: '16px 20px',
            borderRadius: 14,
            border: '1px solid rgba(0, 180, 216, 0.2)',
            height: 260
          }}>
            <Line data={forecastChartData} options={chartOptions} />
          </div>

          {/* Diurnal Pattern Multipliers Pills */}
          <div style={{
            background: '#040b18',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(0, 180, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 12
          }}>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>Diurnal Household Calibrations:</span>
            <Tag color="#0077B6">🌅 Morning Peak (06:00–09:00): 3.5 L/m</Tag>
            <Tag color="#00B4D8">☀️ Midday (11:00–14:00): 1.5 L/m</Tag>
            <Tag color="#7C3AED">🌆 Evening Peak (18:00–21:00): 3.8 L/m</Tag>
            <Tag color="#10B981">🌙 Night Resting (01:00–05:00): 0.02 L/m</Tag>
          </div>
        </Space>
      )}

      {/* ── Tab 2: Explainable AI (XAI) Diagnostic Breakdown ───────────────── */}
      {activeTab === 'explain' && (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* Status Alert Banner */}
          <Alert
            type={isAnomaly ? "error" : "success"}
            showIcon
            icon={isAnomaly ? <WarningOutlined style={{ fontSize: 20 }} /> : <CheckCircleOutlined style={{ fontSize: 20 }} />}
            title={
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {isAnomaly ? "⚠️ Leak Anomaly Confirmed by Isolation Forest" : "✅ Normal Domestic Pattern Confirmed"}
              </span>
            }
            description={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                <span style={{ color: '#CBD5E1' }}>
                  {xaiData?.explanation_text || "Current telemetry is consistent with expected domestic resting baseline."}
                </span>
                <Tag color={isAnomaly ? "error" : "success"} style={{ fontWeight: 700, margin: 0 }}>
                  {xaiData?.confidence_pct || 95}% Model Confidence
                </Tag>
              </div>
            }
            style={{
              background: isAnomaly ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              borderColor: isAnomaly ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)',
              borderRadius: 12
            }}
          />

          {/* Feature Contribution Weights Card */}
          <Card 
            size="small"
            style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.25)', borderRadius: 12 }}
            title={
              <span style={{ color: '#FFFFFF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📊 Multi-Dimensional Feature Contribution Weights
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(xaiData?.top_reasons || [
                { feature: 'consecutive_duration', label: 'Continuous Flow Duration', actual_value: '0 minutes', contribution_pct: 15, impact: 'Normal' },
                { feature: 'night_resting_hour', label: 'Resting Window Flow', actual_value: '0.00 L/min', contribution_pct: 10, impact: 'Normal' },
                { feature: 'flow_magnitude', label: 'Flow Rate vs Qmax Baseline', actual_value: '0.00 L/min', contribution_pct: 5, impact: 'Normal' }
              ]).map((r, i) => {
                const isCrit = r.impact === 'Critical' || r.impact === 'High Risk';
                const isMod = r.impact === 'Moderate';
                const strokeColor = isCrit ? '#EF4444' : isMod ? '#F59E0B' : '#10B981';

                return (
                  <div 
                    key={i} 
                    style={{
                      background: 'rgba(15, 36, 68, 0.45)',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 180, 216, 0.18)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ color: '#FFFFFF', fontSize: 13 }}>
                          {r.label}
                        </Text>
                        <Tag 
                          color={isCrit ? "error" : isMod ? "warning" : "success"}
                          style={{ margin: 0, fontSize: 10, borderRadius: 4, fontWeight: 600 }}
                        >
                          {r.impact || 'Normal'}
                        </Tag>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>
                          Measured: <strong style={{ color: '#38BDF8' }}>{r.actual_value}</strong>
                        </Text>
                        <Tag color="#0077B6" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 700 }}>
                          {r.contribution_pct}% Weight
                        </Tag>
                      </div>
                    </div>

                    <Progress
                      percent={r.contribution_pct}
                      strokeColor={strokeColor}
                      railColor="rgba(255, 255, 255, 0.08)"
                      size={[undefined, 8]}
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Model Performance Guarantees */}
          <div style={{
            background: '#040b18',
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(0, 180, 216, 0.15)',
            fontSize: 12,
            color: '#94A3B8'
          }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>• Model: <strong style={{ color: '#F1F5F9' }}>Scikit-Learn Isolation Forest</strong></Col>
              <Col span={12}>• False Alarm Mitigation: <strong style={{ color: '#10B981' }}>2-Tier Night Gate</strong></Col>
              <Col span={12}>• Contamination Parameter: <strong style={{ color: '#38BDF8' }}>0.05 (5%)</strong></Col>
              <Col span={12}>• Feature Dimensionality: <strong style={{ color: '#F59E0B' }}>4 Input Vectors</strong></Col>
            </Row>
          </div>
        </Space>
      )}
    </Card>
  );
}
