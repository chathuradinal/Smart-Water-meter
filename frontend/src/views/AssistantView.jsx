import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Space, Tag, Button, Badge, Drawer, Tooltip } from 'antd';
import { 
  RobotOutlined, ThunderboltOutlined, DatabaseOutlined, 
  QuestionCircleOutlined, AlertOutlined, DollarOutlined, 
  CameraOutlined, ArrowRightOutlined, SafetyCertificateOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Waves, Droplets, Sparkles, ShieldCheck, AlertTriangle, DollarSign, Camera } from 'lucide-react';
import RagChat from '../components/RagChat';

const { Title, Text, Paragraph } = Typography;

export default function AssistantView({ currentUser, onOpenAuth }) {
  const [externalQuery, setExternalQuery] = useState(null);
  const [latestSnapshot, setLatestSnapshot] = useState(null);
  const [status, setStatus] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchQuickInfo = async () => {
    try {
      const [snapRes, statRes] = await Promise.all([
        fetch('/api/snapshots?limit=1'),
        fetch('/api/status')
      ]);
      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (snapData && snapData.length > 0) {
          setLatestSnapshot(snapData[0]);
        }
      }
      if (statRes.ok) {
        const statData = await statRes.json();
        setStatus(statData);
      }
    } catch (err) {
      console.error("Error fetching companion data:", err);
    }
  };

  useEffect(() => {
    fetchQuickInfo();
    const interval = setInterval(fetchQuickInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAsk = (queryText) => {
    setExternalQuery({ text: queryText, ts: Date.now() });
    setDrawerOpen(false);
  };

  const questionCategories = [
    {
      category: "🚨 Leak & Anomaly Diagnostics",
      color: "#EF4444",
      questions: [
        "Is there any leak detected on my pipe right now?",
        "What is the continuous flow threshold for leak alarm?",
        "How to fix a leaking domestic toilet cistern or pipe?"
      ]
    },
    {
      category: "💰 Sri Lanka NWSDB Tariffs & Bills",
      color: "#F59E0B",
      questions: [
        "How is my current NWSDB domestic bill calculated?",
        "What are the official Sri Lanka domestic tariff slabs?",
        "How much will I be charged if I consume 15 m³?"
      ]
    },
    {
      category: "📷 ESP32-CAM & Optical Dial OCR",
      color: "#00B4D8",
      questions: [
        "Show me the latest snapshot and recognized digits",
        "What is the role of the red fastest drum #8?",
        "What is the optical focal distance of the OV2640 lens?"
      ]
    }
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Top Bar: Quick Question Pills & Drawer Trigger ───────────────── */}
      <div style={{
        background: 'rgba(5, 15, 33, 0.75)',
        border: '1px solid rgba(0, 180, 216, 0.2)',
        borderRadius: 14,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Quick Clickable Suggestions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', padding: '2px 0' }}>
          <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Sparkles size={14} color="#F59E0B" />
            Suggested Prompts:
          </span>

          <div
            onClick={() => handleAsk("Is there any leak detected on my pipe right now?")}
            className="chat-suggestion-chip"
            style={{ flexShrink: 0 }}
          >
            <span>🚨 Check Leaks</span>
          </div>

          <div
            onClick={() => handleAsk("How is my current NWSDB domestic bill calculated?")}
            className="chat-suggestion-chip"
            style={{ flexShrink: 0 }}
          >
            <span>💰 Calculate Bill</span>
          </div>

          <div
            onClick={() => handleAsk("Show me the latest snapshot and recognized digits")}
            className="chat-suggestion-chip"
            style={{ flexShrink: 0 }}
          >
            <span>📸 Latest Dial Capture</span>
          </div>

          <div
            onClick={() => handleAsk("What are the official Sri Lanka domestic tariff slabs?")}
            className="chat-suggestion-chip"
            style={{ flexShrink: 0 }}
          >
            <span>📊 NWSDB Slabs</span>
          </div>
        </div>

        {/* Drawer Trigger Button */}
        <Button
          icon={<QuestionCircleOutlined />}
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'rgba(0, 180, 216, 0.1)',
            borderColor: 'rgba(0, 180, 216, 0.35)',
            color: '#38BDF8',
            fontWeight: 600,
            borderRadius: 8,
            fontSize: 12,
            flexShrink: 0
          }}
        >
          Question Library & Dial Snapshot ({latestSnapshot ? 'Ready' : '...'})
        </Button>
      </div>

      {/* ── Full-Size Conversational RAG Chat Stream ──────────────────────── */}
      <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <RagChat 
          currentUser={currentUser} 
          onOpenAuth={onOpenAuth} 
          externalQuery={externalQuery}
          onOpenPromptDrawer={() => setDrawerOpen(true)}
        />
      </div>

      {/* ── Slide-Out Drawer: Question Bank & Camera Snapshot Reference ────── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QuestionCircleOutlined style={{ color: '#00B4D8', fontSize: 16 }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>
              Question Library & Dial Reference
            </span>
          </div>
        }
        placement="right"
        width={420}
        size={420}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        style={{
          background: 'linear-gradient(180deg, #050f21 0%, #030814 100%)',
          borderLeft: '1px solid rgba(0, 180, 216, 0.25)'
        }}
        styles={{ body: { padding: '18px 20px', overflowY: 'auto' } }}
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {/* Card 1: Live Hardware Context Preview */}
          <Card 
            className="aquatic-card"
            title={
              <span style={{ color: '#F1F5F9', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CameraOutlined style={{ color: '#00B4D8' }} />
                Latest Dial Capture Reference
              </span>
            }
          >
            {latestSnapshot ? (
              <div>
                <div style={{
                  background: '#000000',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 180, 216, 0.25)',
                  height: 130,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <img 
                    src={latestSnapshot.image_url} 
                    alt="Latest Dial" 
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Mechanical Reading</Text>
                    <Text strong style={{ color: '#38BDF8', fontSize: 15, fontFamily: 'monospace' }}>
                      {Number(latestSnapshot.reading).toFixed(4)} m³
                    </Text>
                  </div>

                  <div>
                    <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Flow State</Text>
                    <Tag color={latestSnapshot.is_leak ? "error" : "success"} style={{ margin: 0, fontWeight: 700 }}>
                      {latestSnapshot.is_leak ? `LEAK: ${latestSnapshot.leak_severity}` : 'NORMAL FLOW'}
                    </Tag>
                  </div>
                </div>

                <Button
                  type="dashed"
                  block
                  icon={<Sparkles size={14} style={{ display: 'inline', marginRight: 4, color: '#00B4D8' }} />}
                  onClick={() => handleAsk("Explain the latest camera capture, drum digits, and leak status")}
                  style={{
                    background: 'rgba(0, 180, 216, 0.08)',
                    borderColor: 'rgba(0, 180, 216, 0.3)',
                    color: '#38BDF8',
                    fontSize: 12,
                    borderRadius: 8
                  }}
                >
                  Ask AI about this snapshot →
                </Button>
              </div>
            ) : (
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Loading optical dial reference...</Text>
            )}
          </Card>

          {/* Card 2: Interactive Clickable Question Bank */}
          <Card 
            className="aquatic-card"
            title={
              <span style={{ color: '#F1F5F9', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <QuestionCircleOutlined style={{ color: '#00B4D8' }} />
                Clickable Question Bank
              </span>
            }
          >
            <Paragraph style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
              Click any question below to immediately ask the assistant:
            </Paragraph>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {questionCategories.map((group, gIdx) => (
                <div key={gIdx}>
                  <Text strong style={{ color: group.color, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 6 }}>
                    {group.category}
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        onClick={() => handleAsk(q)}
                        style={{
                          background: '#050f21',
                          border: '1px solid rgba(0, 180, 216, 0.18)',
                          borderRadius: 8,
                          padding: '9px 12px',
                          color: '#E2E8F0',
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#00B4D8';
                          e.currentTarget.style.background = 'rgba(0, 180, 216, 0.12)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.18)';
                          e.currentTarget.style.background = '#050f21';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <span style={{ lineHeight: 1.4 }}>{q}</span>
                        <ArrowRightOutlined style={{ color: '#00B4D8', fontSize: 11, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 3: Grounding & Zero Hallucination Guarantee */}
          <Card 
            className="aquatic-card"
            title={
              <span style={{ color: '#F1F5F9', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#10B981' }} />
                Fact Grounding Guarantee
              </span>
            }
          >
            <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
              <div>• <strong>Real Telemetry:</strong> Every answer references the live SQLite meter reading.</div>
              <div style={{ marginTop: 4 }}>• <strong>Official Tariffs:</strong> Strictly enforces Sri Lanka National Water Supply & Drainage Board domestic slab math.</div>
              <div style={{ marginTop: 4 }}>• <strong>No Hallucinations:</strong> The model cannot invent arbitrary meter readings or tariffs.</div>
            </div>
          </Card>
        </Space>
      </Drawer>
    </div>
  );
}
