import React, { useState } from 'react';
import { Space, Card, Typography, Tag, Button } from 'antd';
import {
  BulbOutlined, SafetyCertificateOutlined, LineChartOutlined,
  ThunderboltOutlined, ExperimentOutlined, CheckCircleOutlined,
  WarningOutlined, AlertOutlined, BookOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { Waves, Droplets, Zap, ShieldCheck, Activity } from 'lucide-react';
import AiInsightsCard from '../components/AiInsightsCard';

const { Title, Text } = Typography;

export default function AiAnalyticsView({ onNavigateGuidance }) {
  const [simulateKey, setSimulateKey] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [activeSimulationMode, setActiveSimulationMode] = useState('normal');

  const handleSimulateMode = async (mode) => {
    if (simulating) return;
    setSimulating(true);
    setActiveSimulationMode(mode);
    try {
      await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      // Trigger card refresh
      setSimulateKey(prev => prev + 1);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* ── Top Interactive Hardware Simulation Toolbar ──────────────────── */}
      <Card
        className="aquatic-card"
        style={{ borderRadius: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(0, 180, 216, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ExperimentOutlined style={{ fontSize: 20, color: '#00B4D8' }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                Interactive Model Simulation & Anomaly Trigger
              </Title>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Inject synthetic flow conditions to observe real-time Isolation Forest XAI classification & consumption forecasting
              </Text>
            </div>
          </div>

          <Space size="middle" wrap>
            <Button
              onClick={() => handleSimulateMode('normal')}
              loading={simulating && activeSimulationMode === 'normal'}
              style={{
                background: activeSimulationMode === 'normal' ? 'rgba(16, 185, 129, 0.2)' : '#07162c',
                borderColor: activeSimulationMode === 'normal' ? '#10B981' : 'rgba(0, 180, 216, 0.3)',
                color: activeSimulationMode === 'normal' ? '#34D399' : '#CBD5E1',
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              💧 Normal Flow (0 L/min)
            </Button>

            <Button
              onClick={() => handleSimulateMode('leak')}
              loading={simulating && activeSimulationMode === 'leak'}
              style={{
                background: activeSimulationMode === 'leak' ? 'rgba(245, 158, 11, 0.2)' : '#07162c',
                borderColor: activeSimulationMode === 'leak' ? '#F59E0B' : 'rgba(0, 180, 216, 0.3)',
                color: activeSimulationMode === 'leak' ? '#FBBF24' : '#CBD5E1',
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              ⚠️ Micro-Leak (0.5 L/min)
            </Button>

            <Button
              onClick={() => handleSimulateMode('burst')}
              loading={simulating && activeSimulationMode === 'burst'}
              style={{
                background: activeSimulationMode === 'burst' ? 'rgba(239, 68, 68, 0.2)' : '#07162c',
                borderColor: activeSimulationMode === 'burst' ? '#EF4444' : 'rgba(0, 180, 216, 0.3)',
                color: activeSimulationMode === 'burst' ? '#F87171' : '#CBD5E1',
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              🚨 Pipe Burst (30 L/min)
            </Button>
          </Space>
        </div>
      </Card>

      {/* ── Main AI Diagnostics Component (Chart + XAI Breakdown) ─────────── */}
      <AiInsightsCard onSimulateTrigger={simulateKey} />

      {/* ── Guidance & Detection Algorithms Manual Shortcut ─────────────── */}
      <Card
        className="aquatic-card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(5, 15, 33, 0.8) 100%)',
          border: '1px solid rgba(0, 180, 216, 0.25)',
          borderRadius: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(0, 180, 216, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOutlined style={{ fontSize: 20, color: '#00B4D8' }} />
            </div>
            <div>
              <Text strong style={{ color: '#F1F5F9', fontSize: 14, display: 'block' }}>
                AI Model Architecture & Diurnal Consumption Calibration
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Detailed algorithmic specifications for Tier-1 Night Flow gating and Tier-2 Isolation Forest scoring are in the Operations Manual.
              </Text>
            </div>
          </div>
          {onNavigateGuidance && (
            <Button
              type="primary"
              ghost
              icon={<ArrowRightOutlined />}
              onClick={onNavigateGuidance}
              style={{ borderColor: '#00B4D8', color: '#00B4D8', borderRadius: 8 }}
            >
              Read Algorithm Docs
            </Button>
          )}
        </div>
      </Card>
    </Space>
  );
}
