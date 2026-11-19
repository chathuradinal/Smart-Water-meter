import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, Typography, Input, Button, Tag, Badge, Avatar, 
  Segmented, Tooltip, Popconfirm, Space, Row, Col, Divider, Alert 
} from 'antd';
import { 
  RobotOutlined, SendOutlined, UserOutlined, ClearOutlined, 
  CopyOutlined, CheckOutlined, DatabaseOutlined, ThunderboltOutlined, 
  BranchesOutlined, QuestionCircleOutlined, SafetyCertificateOutlined,
  ReloadOutlined, MessageOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { 
  Waves, Droplets, Sparkles, Bot, User, Copy, Check, Trash2, 
  AlertTriangle, DollarSign, Wrench, TrendingUp, Database, 
  ShieldCheck, Camera, HelpCircle, Activity, CornerDownRight 
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

// Custom Markdown Formatter for RAG answers (styled with AntD & Aquatic tones)
function FormattedMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, lineHeight: 1.65 }}>
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} style={{ height: 6 }} />;
        }

        const isBullet = line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().replace(/^[•\-\*]\s*/, '') : line;

        // Parse **bold text**
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const renderedParts = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: '#FFFFFF', fontWeight: 700 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 6 }}>
              <span style={{ color: '#00B4D8', fontSize: 12, lineHeight: 1.5 }}>💧</span>
              <span style={{ flex: 1, color: '#CBD5E1' }}>{renderedParts}</span>
            </div>
          );
        }

        const isHeader = line.includes('**') && (
          line.includes('⚠️') || line.includes('💰') || line.includes('📊') || 
          line.includes('⚙️') || line.includes('✅') || line.includes('🛠️') || line.includes('💡')
        );

        return (
          <div 
            key={idx} 
            style={{ 
              color: isHeader ? '#38BDF8' : '#CBD5E1', 
              fontWeight: isHeader ? 700 : 400,
              marginTop: isHeader ? 4 : 0
            }}
          >
            {renderedParts}
          </div>
        );
      })}
    </div>
  );
}

export default function RagChat({ currentUser = 'admin', onOpenAuth, externalQuery, onOpenPromptDrawer }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'context' | 'pipeline'
  const defaultWelcome = {
    sender: 'bot',
    text: `Hello ${currentUser}! I am your Smart Water Meter AI Assistant.\n\nI analyze real-time mechanical dial readings from your ESP32-CAM, detect leaks using Isolation Forest, and calculate domestic NWSDB bills.`,
    suggestions: ["🚨 Check Leaks", "💰 Calculate Bill", "🛠️ How to fix leak?", "🔮 4h Forecast"],
    timestamp: "Just now"
  };

  const [messages, setMessages] = useState([defaultWelcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [contextCopied, setContextCopied] = useState(false);
  const chatFeedRef = useRef(null);

  const scrollToBottom = (instant = false) => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: instant ? 'auto' : 'smooth'
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      const timer = setTimeout(() => scrollToBottom(), 60);
      return () => clearTimeout(timer);
    }
  }, [messages, activeTab, loading]);

  // Load chat history for the active user account
  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        const res = await fetch(`/api/chat/history?username=${encodeURIComponent(currentUser || 'admin')}`);
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            setMessages(data.history);
          } else {
            setMessages([
              {
                sender: 'bot',
                text: `Hello ${currentUser || 'User'}! I am your Smart Water Meter AI Assistant.\n\nI analyze real-time mechanical dial readings from your ESP32-CAM, detect leaks using Isolation Forest, and calculate domestic NWSDB bills.`,
                suggestions: ["🚨 Check Leaks", "💰 Calculate Bill", "🛠️ How to fix leak?", "🔮 4h Forecast"],
                timestamp: "Just now"
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };
    loadUserHistory();
  }, [currentUser]);

  const fetchLiveContext = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setContextData(data);
      }
    } catch (err) {
      console.error("Context fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLiveContext();
    const interval = setInterval(fetchLiveContext, 10000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: textToSend,
      timestamp: timeStr 
    }]);

    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          username: currentUser || 'admin'
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply || "No response received.",
        suggestions: data.suggestions || ["🚨 Check Leaks", "💰 Calculate Bill"],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      fetchLiveContext();
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "Error communicating with server.",
        suggestions: ["Try again"],
        timestamp: timeStr
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Support external trigger from the prompt question cards
  useEffect(() => {
    if (externalQuery && externalQuery.text) {
      setActiveTab('chat');
      sendMessage(externalQuery.text);
    }
  }, [externalQuery]);

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const clearChat = async () => {
    try {
      await fetch(`/api/chat/history?username=${encodeURIComponent(currentUser || 'admin')}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error("Error clearing chat history on server:", err);
    }
    setMessages([
      {
        sender: 'bot',
        text: `Chat history cleared for ${currentUser || 'admin'}. How can I assist you with your water meter telemetry or billing today?`,
        suggestions: ["🚨 Check Leaks", "💰 Calculate Bill", "📊 Current Reading"],
        timestamp: "Just now"
      }
    ]);
  };

  const copyContextJson = () => {
    if (!contextData) return;
    navigator.clipboard.writeText(JSON.stringify(contextData, null, 2));
    setContextCopied(true);
    setTimeout(() => setContextCopied(false), 2000);
  };

  return (
    <Card 
      className="aquatic-chat-box"
      style={{
        width: '100%',
        height: 'calc(100vh - 128px)',
        minHeight: 560,
        display: 'flex',
        flexDirection: 'column',
        padding: 0
      }}
      styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 } }}
    >
      {/* ── Top Header Bar ────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 20px',
        background: 'rgba(5, 15, 33, 0.9)',
        borderBottom: '1px solid rgba(0, 180, 216, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left: Bot Status Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(0, 180, 216, 0.45)'
          }}>
            <Bot size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ color: '#FFFFFF', fontSize: 14 }}>
                AquaMeter RAG Intelligence
              </Text>
              <Badge status="processing" color="#10B981" title="Online" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
              <span>User: <strong style={{ color: '#00B4D8' }}>{currentUser}</strong></span>
              <span>•</span>
              <span style={{ color: '#64748B' }}>Grounded in SQLite Telemetry</span>
            </div>
          </div>
        </div>

        {/* Center/Right: View Tabs & Clear Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {onOpenPromptDrawer && (
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={onOpenPromptDrawer}
              style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#38BDF8' }}
            >
              Question Bank & Dial
            </Button>
          )}

          <Segmented
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val);
              if (val === 'context') fetchLiveContext();
            }}
            options={[
              { label: 'Chat', value: 'chat', icon: <MessageOutlined /> },
              { label: 'Live Context', value: 'context', icon: <DatabaseOutlined /> },
              { label: 'RAG Pipeline', value: 'pipeline', icon: <BranchesOutlined /> }
            ]}
            style={{ background: '#050f21', border: '1px solid rgba(0, 180, 216, 0.25)' }}
          />

          <Popconfirm
            title="Clear Chat History"
            description="Are you sure you want to clear your conversation history?"
            onConfirm={clearChat}
            okText="Clear"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Clear chat history">
              <Button 
                type="text" 
                icon={<Trash2 size={15} color="#94A3B8" />} 
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      </div>

      {/* ── Tab 1: Interactive Conversational Stream ────────────────────────── */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable Message Feed */}
          <div ref={chatFeedRef} className="aquatic-chat-feed">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div 
                  key={idx} 
                  className={isUser ? "chat-bubble-user" : "chat-bubble-bot"}
                >
                  {/* Bubble Sub-Header: Author & Timestamp */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: 8,
                    fontSize: 11,
                    opacity: 0.8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isUser ? (
                        <>
                          <User size={13} color="#FFFFFF" />
                          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>You ({currentUser})</span>
                        </>
                      ) : (
                        <>
                          <Bot size={14} color="#00B4D8" />
                          <span style={{ fontWeight: 600, color: '#38BDF8' }}>AquaMeter AI</span>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: isUser ? '#E0F2FE' : '#94A3B8', fontSize: 10 }}>{m.timestamp}</span>
                      {!isUser && (
                        <Tooltip title={copiedIdx === idx ? "Copied!" : "Copy message"}>
                          <button
                            onClick={() => copyMessage(m.text, idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {copiedIdx === idx ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <FormattedMessage text={m.text} />

                  {/* Clickable Follow-up Action Chips inside Bot Messages */}
                  {!isUser && m.suggestions && m.suggestions.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 11, color: '#94A3B8' }}>
                        <CornerDownRight size={13} color="#00B4D8" />
                        <span>Suggested follow-up questions:</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m.suggestions.map((chip, cIdx) => (
                          <div
                            key={cIdx}
                            onClick={() => sendMessage(chip)}
                            className="chat-suggestion-chip"
                          >
                            <span>{chip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Streaming Pulse */}
            {loading && (
              <div className="chat-bubble-bot">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#38BDF8' }}>
                  <Badge status="processing" color="#00B4D8" />
                  <span style={{ fontStyle: 'italic' }}>Retrieving live meter telemetry & reasoning...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Action & Input Bar */}
          <div className="chat-input-toolbar">
            {/* Quick Action Chips Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                <Sparkles size={13} color="#F59E0B" />
                <span style={{ fontWeight: 600, color: '#CBD5E1' }}>Quick Queries:</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <div 
                onClick={() => sendMessage("Is there any leak detected on my pipe?")}
                className="chat-suggestion-chip"
              >
                <AlertTriangle size={12} color="#EF4444" />
                <span>🚨 Check Leaks</span>
              </div>

              <div 
                onClick={() => sendMessage("How is my NWSDB bill calculated?")}
                className="chat-suggestion-chip"
              >
                <DollarSign size={12} color="#F59E0B" />
                <span>💰 Calculate Bill</span>
              </div>

              <div 
                onClick={() => sendMessage("What are the official Sri Lanka domestic tariff slabs?")}
                className="chat-suggestion-chip"
              >
                <TrendingUp size={12} color="#10B981" />
                <span>📊 Domestic Slabs</span>
              </div>

              <div 
                onClick={() => sendMessage("Show me the latest snapshot and recognized digits")}
                className="chat-suggestion-chip"
              >
                <Camera size={12} color="#38BDF8" />
                <span>📸 Latest Dial OCR</span>
              </div>

              <div 
                onClick={() => sendMessage("How to fix a leaking domestic toilet cistern or pipe?")}
                className="chat-suggestion-chip"
              >
                <Wrench size={12} color="#A855F7" />
                <span>🛠️ Leak Repair Guide</span>
              </div>
            </div>

            {/* Input & Send Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              style={{ display: 'flex', gap: 10, marginTop: 4 }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about water meter reading, leak alerts, NWSDB domestic bill..."
                size="large"
                style={{
                  background: '#050f21',
                  borderColor: 'rgba(0, 180, 216, 0.3)',
                  color: '#FFFFFF',
                  borderRadius: 10
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                disabled={loading || !input.trim()}
                loading={loading}
                icon={<SendOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0, 180, 216, 0.35)',
                  minWidth: 100
                }}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab 2: Grounded Live Context Inspector ─────────────────────────── */}
      {activeTab === 'context' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                <DatabaseOutlined style={{ color: '#00B4D8', marginRight: 8 }} />
                Real-Time SQLite Telemetry Injected into RAG
              </Title>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Every AI response is grounded directly in this live IoT hardware payload to prevent hallucination.
              </Text>
            </div>

            <Button
              icon={contextCopied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={copyContextJson}
              style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#38BDF8' }}
            >
              {contextCopied ? 'Copied JSON' : 'Copy Payload'}
            </Button>
          </div>

          {/* Quick Metrics Grid */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>METER READING</Text>
                <Text strong style={{ color: '#38BDF8', fontSize: 16, fontFamily: 'monospace' }}>
                  {Number(contextData?.current_reading_m3 || 37.2468).toFixed(4)} m³
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>FLOW RATE</Text>
                <Text strong style={{ color: '#F1F5F9', fontSize: 16, fontFamily: 'monospace' }}>
                  {Number(contextData?.flow_rate_lpm || 0).toFixed(2)} L/min
                </Text>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>LEAK STATUS</Text>
                <Tag color={contextData?.is_leak_active ? "error" : "success"} style={{ marginTop: 2, fontWeight: 700 }}>
                  {contextData?.is_leak_active ? '⚠️ LEAK ACTIVE' : '✅ NORMAL'}
                </Tag>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>ESTIMATED BILL</Text>
                <Text strong style={{ color: '#FCD34D', fontSize: 16, fontFamily: 'monospace' }}>
                  Rs. {Number(contextData?.estimated_bill_lkr || 300).toFixed(2)}
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Raw JSON Code Block */}
          <div style={{ marginBottom: 16 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Live Telemetry Context Payload (Sent to LLM System Prompt):
            </Text>
            <pre style={{
              background: '#030814',
              border: '1px solid rgba(0, 180, 216, 0.25)',
              borderRadius: 10,
              padding: 14,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#38BDF8',
              maxHeight: 250,
              overflowY: 'auto'
            }}>
              {contextData ? JSON.stringify(contextData, null, 2) : "Loading live context from SQLite database..."}
            </pre>
          </div>

          <Alert
            type="success"
            showIcon
            icon={<SafetyCertificateOutlined style={{ color: '#10B981' }} />}
            title="Zero-Hallucination Grounding"
            description="The AI is strictly constrained by prompt engineering to quote facts from your local SQLite database. Tariff rates match official Sri Lanka NWSDB gazette schedules."
            style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
          />
        </div>
      )}

      {/* ── Tab 3: RAG Architecture & Pipeline ─────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Title level={5} style={{ color: '#FFFFFF', marginBottom: 6 }}>
            <BranchesOutlined style={{ color: '#00B4D8', marginRight: 8 }} />
            RAG Pipeline Execution Architecture
          </Title>
          <Paragraph style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20 }}>
            How user questions are processed through IoT sensors, SQLite telemetry, and LLM inference:
          </Paragraph>

          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {/* Step 1 */}
            <div style={{
              background: '#050f21',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid rgba(0, 180, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0077B6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>1</div>
              <div>
                <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>User Natural Language Query</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Question asked via dashboard chat interface with domestic account identity.</Text>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: '#050f21',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid rgba(0, 180, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050f21', fontWeight: 800 }}>2</div>
              <div>
                <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>SQLite Hardware Telemetry Retrieval</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Queries current mechanical reading, flow rate, active leak anomalies, and NWSDB tariff slabs.</Text>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: '#050f21',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid rgba(0, 180, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>3</div>
              <div>
                <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>Grounding Prompt Construction</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Injects verified telemetry context and strict constraints preventing fake billing rates.</Text>
              </div>
            </div>

            {/* Step 4 */}
            <div style={{
              background: '#050f21',
              padding: '14px 18px',
              borderRadius: 12,
              border: '1px solid rgba(0, 180, 216, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800 }}>4</div>
              <div>
                <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block' }}>Synthesis Engine & Clickable Chips</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Generates markdown response accompanied by contextual follow-up chips.</Text>
              </div>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
}
