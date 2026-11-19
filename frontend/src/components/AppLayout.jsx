import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Badge, Tag, Typography, Space, Tooltip } from 'antd';
import { 
  DashboardOutlined, CameraOutlined, HistoryOutlined, 
  RobotOutlined, BulbOutlined, LogoutOutlined, UserOutlined,
  ThunderboltOutlined, CheckCircleOutlined, WarningOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, ArrowRightOutlined,
  BookOutlined
} from '@ant-design/icons';
import { Waves, Droplets, Camera, ShieldCheck, Gauge } from 'lucide-react';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function AppLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  isLeakActive,
  snapshotCount = 0,
  lastUpdated,
  onQuickCapture
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 992);
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 992);
  const [capturing, setCapturing] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    {
      key: 'overview',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Live Dashboard</span>
          {isLeakActive ? (
            <Badge status="error" count="LEAK" style={{ backgroundColor: '#EF4444', fontSize: 10, marginLeft: 8 }} />
          ) : (
            <Badge status="success" style={{ marginLeft: 8 }} />
          )}
        </span>
      )
    },
    {
      key: 'snapshots',
      icon: <HistoryOutlined style={{ fontSize: 16 }} />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Snapshot History</span>
          {snapshotCount > 0 && (
            <Tag color="#0077B6" style={{ margin: 0, fontSize: 10, borderRadius: 6, lineHeight: '18px' }}>
              {snapshotCount}
            </Tag>
          )}
        </span>
      )
    },
    {
      key: 'camera',
      icon: <CameraOutlined style={{ fontSize: 16 }} />,
      label: 'Dial Vision Studio'
    },
    {
      key: 'ai_insights',
      icon: <BulbOutlined style={{ fontSize: 16 }} />,
      label: 'AI Diagnostics (XAI)'
    },
    {
      key: 'chat',
      icon: <RobotOutlined style={{ fontSize: 16 }} />,
      label: 'Grounded RAG Assistant'
    },
    {
      key: 'guidance',
      icon: <BookOutlined style={{ fontSize: 16 }} />,
      label: 'System Guidance'
    }
  ];

  const handleCaptureClick = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      if (onQuickCapture) {
        await onQuickCapture();
      }
    } finally {
      setCapturing(false);
    }
  };

  const sectionTitles = {
    overview: { title: "Live Telemetry & Roller Drums", sub: "Mechanical meter counter, flow gauge, and NWSDB tariff estimation" },
    snapshots: { title: "Captured Snapshot History & Optical OCR", sub: "Archived dial frames, recognized drum digits, and audit log" },
    camera: { title: "Camera Vision & Optical Calibration", sub: "OmniVision OV2640 alignment, LED flash, and ROI bounding box overlays" },
    ai_insights: { title: "Two-Tier Leak Diagnostics & Forecaster", sub: "Isolation Forest Explainable AI (XAI) and 4-hour forward consumption" },
    chat: { title: "Conversational RAG AI Assistant", sub: "AI Grounded in live telemetry and official Sri Lanka NWSDB domestic tariffs" },
    guidance: { title: "System & Hardware Operations Manual", sub: "Hardware calibration, optical ROIs, AI algorithms, and NWSDB tariff schedules" }
  };

  const currentMeta = sectionTitles[activeTab] || sectionTitles.overview;

  return (
    <Layout style={{ minHeight: '100vh', background: '#040a17' }}>
      {/* ── Collapsible Aquatic Sidebar (Responsive) ────────────────────────── */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        collapsedWidth={isMobile ? 0 : 80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: isMobile ? (collapsed ? -260 : 0) : 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #050f21 0%, #030814 100%)',
          borderRight: '1px solid rgba(0, 180, 216, 0.2)',
          zIndex: isMobile ? 1000 : 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.28s ease',
          boxShadow: isMobile && !collapsed ? '0 0 50px rgba(0, 0, 0, 0.9)' : 'none'
        }}
      >
        <div>
          {/* Logo & App Branding */}
          <div style={{
            padding: collapsed ? '18px 14px' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(0, 180, 216, 0.15)',
            marginBottom: 12
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px rgba(0, 180, 216, 0.4)'
            }}>
              <Waves size={20} color="#FFFFFF" />
            </div>

            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <Title level={5} style={{ margin: 0, color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  AquaMeter <span style={{ color: '#00B4D8' }}>AI</span>
                </Title>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>
                  Smart Water OS · 3/4"
                </Text>
              </div>
            )}
          </div>

          {/* Real-time Hardware Pill */}
          {!collapsed && (
            <div style={{
              margin: '0 14px 14px',
              padding: '8px 12px',
              background: 'rgba(0, 180, 216, 0.08)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11
            }}>
              <span style={{ color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Badge status="processing" color="#10B981" /> ESP32-CAM
              </span>
              <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>Port 5001</span>
            </div>
          )}

          {/* Navigation Menu */}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => {
              setActiveTab(key);
              if (isMobile) setCollapsed(true);
            }}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        {/* Sidebar Footer: User Card & Sign Out */}
        <div style={{
          padding: '14px',
          borderTop: '1px solid rgba(0, 180, 216, 0.15)',
          background: 'rgba(3, 8, 20, 0.6)'
        }}>
          {!collapsed && (
            <div style={{
              marginBottom: 10,
              padding: '6px 10px',
              background: 'rgba(15, 36, 68, 0.5)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#94A3B8'
            }}>
              <span>Pipe: <strong style={{ color: '#F1F5F9' }}>3/4" Domestic</strong></span>
              <span style={{ color: '#F59E0B' }}>Qmax: 25 L/m</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <Avatar 
                style={{ 
                  backgroundColor: '#00B4D8',
                  boxShadow: '0 0 10px rgba(0, 180, 216, 0.4)',
                  fontWeight: 700
                }}
              >
                {currentUser ? currentUser.charAt(0).toUpperCase() : 'A'}
              </Avatar>
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <Text strong style={{ color: '#FFFFFF', fontSize: 13, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {currentUser || 'admin'}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>Domestic Account</Text>
                </div>
              )}
            </div>

            <Tooltip title="Sign Out / Switch Account">
              <Button 
                type="text" 
                icon={<LogoutOutlined style={{ color: '#94A3B8' }} />}
                onClick={onLogout}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          </div>
        </div>
      </Sider>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobile && !collapsed && (
        <div 
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* ── Main Layout Body ──────────────────────────────────────────────── */}
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 250), 
        transition: 'all 0.28s ease', 
        minHeight: '100vh', 
        background: 'transparent' 
      }}>
        {/* Top Header Bar */}
        <Header style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'rgba(5, 15, 33, 0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0, 180, 216, 0.2)',
          padding: isMobile ? '10px 14px' : '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: '#38BDF8', padding: 4 }}
            />
            <div>
              <Title level={4} style={{ margin: 0, color: '#FFFFFF', fontSize: isMobile ? 15 : 18, lineHeight: 1.2 }}>
                {currentMeta.title}
              </Title>
              {!isMobile && (
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  {currentMeta.sub}
                </Text>
              )}
            </div>
          </div>

          <Space size={isMobile ? "small" : "middle"}>
            {/* Quick Capture Button with Camera Flash */}
            <Button 
              type="primary"
              icon={<Camera size={14} style={{ display: 'inline', marginRight: 4 }} />}
              onClick={handleCaptureClick}
              loading={capturing}
              style={{
                background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                borderColor: 'rgba(0, 180, 216, 0.4)',
                boxShadow: '0 4px 14px rgba(0, 180, 216, 0.35)',
                fontWeight: 600,
                fontSize: isMobile ? 12 : 13
              }}
            >
              {isMobile ? "Capture" : "Capture Snapshot Now"}
            </Button>

            {!isMobile && (
              <div style={{
                background: 'rgba(10, 25, 47, 0.65)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(0, 180, 216, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12
              }}>
                <Badge status="processing" color="#10B981" />
                <Text style={{ color: '#E2E8F0', fontWeight: 600 }}>API Connected</Text>
                <Text style={{ color: '#64748B', fontFamily: 'monospace' }}>{time}</Text>
              </div>
            )}
          </Space>
        </Header>

        {/* View Content Area */}
        <Content style={{ padding: isMobile ? '16px 12px' : '24px 28px', minHeight: 'calc(100vh - 74px)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

