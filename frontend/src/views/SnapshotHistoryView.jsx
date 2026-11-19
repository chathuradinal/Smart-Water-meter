import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Row, Col, Typography, Button, Tag, Space, 
  Segmented, Modal, Badge, Tooltip, Alert, Statistic, Divider 
} from 'antd';
import { 
  CameraOutlined, EyeOutlined, HistoryOutlined, 
  CheckCircleOutlined, WarningOutlined, ReloadOutlined, 
  AppstoreOutlined, TableOutlined, ExpandOutlined,
  ThunderboltOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { Droplets, Clock, Activity, Gauge, ShieldCheck, Zap } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export default function SnapshotHistoryView({ onSnapshotCaptured }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'table'
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'normal' | 'leaks'
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [showRoisInModal, setShowRoisInModal] = useState(true);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snapshots?limit=50');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Error fetching snapshots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const res = await fetch('/api/snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'normal' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.snapshot) {
          setSnapshots(prev => [data.snapshot, ...prev]);
          if (onSnapshotCaptured) {
            onSnapshotCaptured(data.snapshot);
          }
        }
      }
    } catch (err) {
      console.error("Capture error:", err);
    } finally {
      setCapturing(false);
    }
  };

  const filteredSnapshots = snapshots.filter(s => {
    if (filterMode === 'leaks') return s.is_leak === 1;
    if (filterMode === 'normal') return s.is_leak === 0;
    return true;
  });

  const columns = [
    {
      title: '# ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => <Tag color="#0077B6" style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{id}</Tag>
    },
    {
      title: 'Dial Image',
      key: 'image',
      width: 110,
      render: (_, record) => (
        <div 
          onClick={() => setSelectedSnapshot(record)}
          style={{
            cursor: 'pointer',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(0, 180, 216, 0.3)',
            height: 40,
            width: 90,
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={record.image_url} 
            alt="Dial" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
      )
    },
    {
      title: 'Capture Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => (
        <span style={{ color: '#CBD5E1', fontFamily: 'monospace', fontSize: 12 }}>
          {t || 'Recent'}
        </span>
      )
    },
    {
      title: '5 Drums Extracted',
      key: 'drums',
      render: (_, record) => {
        const digits = record.digits || [];
        return (
          <div style={{ display: 'inline-flex', gap: 4, background: '#050f21', padding: '3px 6px', borderRadius: 8, border: '1px solid rgba(0, 180, 216, 0.2)' }}>
            {digits.map((d, idx) => (
              <span 
                key={idx}
                style={{
                  width: 22,
                  height: 28,
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: 'monospace',
                  background: d.color === 'red' ? '#DC2626' : '#F8FAFC',
                  color: d.color === 'red' ? '#FFFFFF' : '#0F172A',
                  boxShadow: d.color === 'red' ? '0 0 6px rgba(220, 38, 38, 0.5)' : 'none'
                }}
              >
                {d.digit}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      title: 'Reading',
      dataIndex: 'reading',
      key: 'reading',
      render: (val) => (
        <strong style={{ color: '#38BDF8', fontFamily: 'monospace', fontSize: 14 }}>
          {Number(val).toFixed(4)} m³
        </strong>
      )
    },
    {
      title: 'Flow Rate',
      dataIndex: 'flow_rate_lpm',
      key: 'flow_rate_lpm',
      render: (val) => (
        <span style={{ color: Number(val) > 0 ? '#F1F5F9' : '#64748B', fontFamily: 'monospace' }}>
          {Number(val || 0).toFixed(2)} L/min
        </span>
      )
    },
    {
      title: 'Volume Delta',
      dataIndex: 'delta_volume_liters',
      key: 'delta_volume_liters',
      render: (val) => (
        <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
          +{Number(val || 0).toFixed(1)} L
        </span>
      )
    },
    {
      title: 'Leak Status',
      key: 'is_leak',
      render: (_, record) => (
        record.is_leak ? (
          <Tag color="error" icon={<WarningOutlined />} style={{ fontWeight: 700, borderRadius: 6 }}>
            LEAK: {record.leak_severity}
          </Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 600, borderRadius: 6 }}>
            NORMAL
          </Tag>
        )
      )
    },
    {
      title: 'OCR Conf',
      dataIndex: 'confidence_avg',
      key: 'confidence_avg',
      render: (val) => (
        <Tag color="cyan" style={{ fontFamily: 'monospace', borderRadius: 6 }}>
          {Math.round((val || 0.995) * 100)}%
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => setSelectedSnapshot(record)}
          style={{ color: '#00B4D8' }}
        >
          Inspect
        </Button>
      )
    }
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* ── Top Toolbar: Filters, View Mode, Quick Capture ─────────────────── */}
      <Card className="aquatic-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Space size="middle" wrap>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(0, 180, 216, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HistoryOutlined style={{ fontSize: 20, color: '#00B4D8' }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                  Snapshot History Archive ({snapshots.length} frames)
                </Title>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  Optical camera frames, recognized drum digits, and flow telemetry
                </Text>
              </div>
            </div>

            {/* Filter Tabs */}
            <Segmented
              value={filterMode}
              onChange={setFilterMode}
              options={[
                { label: 'All Frames', value: 'all' },
                { label: 'Normal Flow', value: 'normal' },
                { label: 'Leak Alerts', value: 'leaks' }
              ]}
              style={{ background: '#050f21', border: '1px solid rgba(0, 180, 216, 0.2)' }}
            />
          </Space>

          <Space size="middle">
            {/* View Mode Toggle */}
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: 'Gallery', value: 'gallery', icon: <AppstoreOutlined /> },
                { label: 'Table', value: 'table', icon: <TableOutlined /> }
              ]}
              style={{ background: '#050f21', border: '1px solid rgba(0, 180, 216, 0.2)' }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSnapshots}
              loading={loading}
              style={{ background: '#07162c', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#CBD5E1' }}
            >
              Refresh
            </Button>

            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={handleCapture}
              loading={capturing}
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                boxShadow: '0 4px 16px rgba(0, 180, 216, 0.4)'
              }}
            >
              Capture Snapshot Now
            </Button>
          </Space>
        </div>
      </Card>

      {/* ── Mode 1: Card Gallery View ─────────────────────────────────────── */}
      {viewMode === 'gallery' ? (
        <Row gutter={[20, 20]}>
          {filteredSnapshots.map((snap) => {
            const digits = snap.digits || [];
            const isLeak = snap.is_leak === 1;

            return (
              <Col xs={24} sm={12} lg={8} key={snap.id}>
                <Card
                  className="aquatic-card"
                  hoverable
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  {/* Card Top: ID and Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Tag color="#0077B6" style={{ fontWeight: 700, margin: 0 }}>
                      Frame #{snap.id}
                    </Tag>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                      {snap.created_at || 'Recent'}
                    </Text>
                  </div>

                  {/* Real Captured Image Frame */}
                  <div 
                    onClick={() => setSelectedSnapshot(snap)}
                    style={{
                      height: 140,
                      background: '#000000',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid rgba(0, 180, 216, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginBottom: 14,
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={snap.image_url} 
                      alt="Dial Frame" 
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      color: '#38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <ExpandOutlined /> Inspect ROIs
                    </div>
                  </div>

                  {/* Mechanical Roller Drums Display */}
                  <div style={{
                    background: '#040b18',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(0, 180, 216, 0.18)',
                    marginBottom: 14
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#64748B', fontSize: 11, fontWeight: 700 }}>5 DRUMS RECOGNIZED</Text>
                      <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>
                        {Math.round((snap.confidence_avg || 0.995) * 100)}% Conf
                      </Tag>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '6px 0' }}>
                      {digits.map((d, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            width: 32,
                            height: 42,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 18,
                            fontFamily: 'JetBrains Mono, monospace',
                            background: d.color === 'red' ? '#DC2626' : '#F8FAFC',
                            color: d.color === 'red' ? '#FFFFFF' : '#0F172A',
                            boxShadow: d.color === 'red' ? '0 0 10px rgba(220, 38, 38, 0.6)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {d.digit}
                        </div>
                      ))}
                      <span style={{ alignSelf: 'center', color: '#00B4D8', fontWeight: 800, fontSize: 14, fontFamily: 'monospace' }}>m³</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>Reading:</Text>
                      <Text strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>
                        {Number(snap.reading).toFixed(4)} m³
                      </Text>
                    </div>
                  </div>

                  {/* Flow & Telemetry Stats */}
                  <Row gutter={8} style={{ marginBottom: 12 }}>
                    <Col span={12}>
                      <div style={{ background: 'rgba(15, 36, 68, 0.4)', padding: '6px 10px', borderRadius: 8 }}>
                        <Text style={{ color: '#64748B', fontSize: 10, display: 'block' }}>Flow Rate</Text>
                        <Text strong style={{ color: '#F1F5F9', fontSize: 13, fontFamily: 'monospace' }}>
                          {Number(snap.flow_rate_lpm || 0).toFixed(2)} L/m
                        </Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ background: 'rgba(15, 36, 68, 0.4)', padding: '6px 10px', borderRadius: 8 }}>
                        <Text style={{ color: '#64748B', fontSize: 10, display: 'block' }}>Consumption</Text>
                        <Text strong style={{ color: '#F1F5F9', fontSize: 13, fontFamily: 'monospace' }}>
                          +{Number(snap.delta_volume_liters || 0).toFixed(1)} L
                        </Text>
                      </div>
                    </Col>
                  </Row>

                  {/* Status Tag & Inspect Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isLeak ? (
                      <Tag color="error" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                        ⚠️ LEAK: {snap.leak_severity}
                      </Tag>
                    ) : (
                      <Tag color="success" style={{ fontWeight: 600, borderRadius: 6, margin: 0 }}>
                        ✅ NORMAL
                      </Tag>
                    )}

                    <Button 
                      type="link" 
                      onClick={() => setSelectedSnapshot(snap)}
                      style={{ color: '#00B4D8', padding: 0, fontWeight: 600 }}
                    >
                      Inspect Details →
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* ── Mode 2: Enterprise Data Table View ────────────────────────────── */
        <Card className="aquatic-card">
          <Table 
            columns={columns} 
            dataSource={filteredSnapshots} 
            rowKey="id" 
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 800 }}
            loading={loading}
          />
        </Card>
      )}

      {/* ── High-Resolution ROI & Telemetry Inspection Modal ──────────────── */}
      {selectedSnapshot && (
        <Modal
          open={Boolean(selectedSnapshot)}
          onCancel={() => setSelectedSnapshot(null)}
          footer={null}
          width={760}
          style={{ maxWidth: '95vw', top: 20 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CameraOutlined style={{ color: '#00B4D8', fontSize: 18 }} />
              <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                Dial Snapshot #{selectedSnapshot.id} Optical Inspection
              </span>
              <Tag color="#0077B6">QVGA 320×240</Tag>
            </div>
          }
        >
          <div style={{ padding: '10px 0' }}>
            {/* Full-Frame Dial Display with Interactive ROI Boxes */}
            <div style={{
              background: '#000000',
              borderRadius: 14,
              padding: 12,
              border: '1px solid rgba(0, 180, 216, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 20
            }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={selectedSnapshot.image_url} 
                  alt="Captured Dial Frame" 
                  style={{ maxHeight: 220, width: 'auto', borderRadius: 8 }}
                />

                {/* ROI Bounding Box Overlays */}
                {showRoisInModal && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      padding: 4,
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: 6,
                      border: '1px dashed rgba(0, 180, 216, 0.8)'
                    }}>
                      <div style={{ width: 32, height: 44, border: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 11 }}>1</div>
                      <div style={{ width: 32, height: 44, border: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 11 }}>2</div>
                      <div style={{ width: 32, height: 44, border: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 11 }}>3</div>
                      <div style={{ width: 32, height: 44, border: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 11 }}>4</div>
                      <div style={{ width: 32, height: 44, border: '2px solid #EF4444', background: 'rgba(239,68,68,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FEE2E2', fontWeight: 800, fontSize: 11 }}>#8</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                size="small"
                onClick={() => setShowRoisInModal(!showRoisInModal)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(5, 15, 33, 0.85)', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#38BDF8' }}
              >
                {showRoisInModal ? 'Hide ROIs' : 'Show ROIs'}
              </Button>
            </div>

            {/* Individual Drum Digit Breakdown */}
            <Title level={5} style={{ color: '#F1F5F9', marginBottom: 12, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TinyML Softmax Classified Drum Digits
            </Title>
            <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
              {(selectedSnapshot.digits || []).map((drum, idx) => (
                <Col span={4} style={{ flex: '0 0 20%', maxWidth: '20%' }} key={idx}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center', 
                      background: drum.color === 'red' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(15, 36, 68, 0.4)',
                      borderColor: drum.color === 'red' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(0, 180, 216, 0.2)'
                    }}
                  >
                    <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block' }}>Drum #{drum.drum}</Text>
                    <div style={{
                      margin: '6px auto',
                      width: 32,
                      height: 40,
                      borderRadius: 6,
                      background: drum.color === 'red' ? '#DC2626' : '#F8FAFC',
                      color: drum.color === 'red' ? '#FFFFFF' : '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 18,
                      fontFamily: 'monospace'
                    }}>
                      {drum.digit}
                    </div>
                    <Text style={{ color: '#38BDF8', fontSize: 10, display: 'block' }}>{drum.role}</Text>
                    <Tag color="cyan" style={{ margin: '4px 0 0', fontSize: 10 }}>
                      {Math.round((drum.conf || 0.99) * 100)}%
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Telemetry At Capture Instant */}
            <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
              <Col span={6}>
                <Card size="small" style={{ background: '#050f21', textAlign: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>Meter Reading</Text>
                  <Title level={4} style={{ color: '#38BDF8', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    {Number(selectedSnapshot.reading).toFixed(4)} m³
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#050f21', textAlign: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>Flow Rate</Text>
                  <Title level={4} style={{ color: '#FFFFFF', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    {Number(selectedSnapshot.flow_rate_lpm || 0).toFixed(2)} L/m
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#050f21', textAlign: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>Delta Volume</Text>
                  <Title level={4} style={{ color: '#FFFFFF', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    +{Number(selectedSnapshot.delta_volume_liters || 0).toFixed(1)} L
                  </Title>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#050f21', textAlign: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>NWSDB Bill</Text>
                  <Title level={4} style={{ color: '#FCD34D', margin: '4px 0 0', fontFamily: 'monospace' }}>
                    Rs. {Number(selectedSnapshot.estimated_bill_lkr || 300).toFixed(0)}
                  </Title>
                </Card>
              </Col>
            </Row>

            {/* Hardware & Illumination Meta */}
            <div style={{
              background: '#040b18',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(0, 180, 216, 0.15)',
              fontSize: 12,
              color: '#94A3B8'
            }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>• Sensor: <strong style={{ color: '#F1F5F9' }}>OmniVision OV2640 (Grayscale QVGA)</strong></Col>
                <Col span={12}>• Flash LED: <strong style={{ color: '#F59E0B' }}>GPIO 4 (Fired 500ms)</strong></Col>
                <Col span={12}>• CNN Inference: <strong style={{ color: '#10B981' }}>{selectedSnapshot.inference_time_ms || 45} ms</strong></Col>
                <Col span={12}>• Leak Assessment: <strong style={{ color: selectedSnapshot.is_leak ? '#EF4444' : '#10B981' }}>{selectedSnapshot.leak_message || 'Normal zero resting flow'}</strong></Col>
              </Row>
            </div>
          </div>
        </Modal>
      )}
    </Space>
  );
}

