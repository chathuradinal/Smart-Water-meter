import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space, Divider, Row, Col, Tag } from 'antd';
import { 
  UserOutlined, LockOutlined, LoginOutlined, 
  CheckCircleOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Droplets, Waves, ShieldCheck, Gauge, ArrowRight } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage({ onLoginSuccess, onNavigateRegister }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username.trim(),
          password: values.password.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onLoginSuccess(data.username);
      } else {
        setErrorMsg(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server. Ensure API is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (user, pass) => {
    form.setFieldsValue({ username: user, password: pass });
    handleFinish({ username: user, password: pass });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030814',
      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(0, 180, 216, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 119, 182, 0.12) 0%, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 1040, width: '100%' }}>
        <Row gutter={[32, 32]} align="middle">
          {/* Left Column: Branding & Features */}
          <Col xs={24} lg={13}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 24px rgba(0, 180, 216, 0.45)'
                }}>
                  <Waves size={26} color="#FFFFFF" />
                </div>
                <div>
                  <Title level={3} style={{ margin: 0, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                    AquaMeter <span style={{ color: '#00B4D8' }}>AI</span>
                  </Title>
                  <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                    IoT Smart Water Meter Retrofitting System
                  </Text>
                </div>
              </div>

              <div>
                <Title level={2} style={{ color: '#FFFFFF', marginTop: 12, marginBottom: 8, fontSize: '32px', lineHeight: 1.25 }}>
                  Enterprise Water Telemetry <br />
                  <span style={{ color: '#38BDF8' }}>& Edge AI Leak Surveillance</span>
                </Title>
                <Paragraph style={{ color: '#94A3B8', fontSize: 15, maxWidth: 500 }}>
                  Intelligent mechanical meter digitization using ESP32-CAM TinyML OCR, continuous resting night flow surveillance, and Sri Lanka NWSDB domestic slab billing.
                </Paragraph>
              </div>

              {/* Feature Cards Grid */}
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" style={{ background: 'rgba(10, 25, 47, 0.65)', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                    <Space orientation="vertical" size={2}>
                      <Text strong style={{ color: '#38BDF8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <SafetyCertificateOutlined /> TinyML CNN OCR
                      </Text>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                        99.91% test accuracy on 5 mechanical drums (4 white + 1 red #8).
                      </Text>
                    </Space>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card size="small" style={{ background: 'rgba(10, 25, 47, 0.65)', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                    <Space orientation="vertical" size={2}>
                      <Text strong style={{ color: '#34D399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={14} /> Two-Tier Leak AI
                      </Text>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                        01:00-05:00 night resting flow + Isolation Forest XAI.
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </Col>

          {/* Right Column: Sign In Card */}
          <Col xs={24} lg={11}>
            <Card 
              style={{ 
                background: 'rgba(10, 25, 47, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 180, 216, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(0, 180, 216, 0.12)'
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                  Account Sign In
                </Title>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Access your domestic water consumption and telemetry
                </Text>
              </div>

              {errorMsg && (
                <Alert 
                  title={errorMsg} 
                  type="error" 
                  showIcon 
                  style={{ marginBottom: 18, borderRadius: 10 }} 
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ username: '', password: '' }}
                requiredMark={false}
              >
                <Form.Item
                  label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Username</Text>}
                  name="username"
                  rules={[{ required: true, message: 'Please enter your username' }]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#00B4D8' }} />} 
                    placeholder="e.g. admin or user1" 
                    size="large"
                    style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)' }}
                  />
                </Form.Item>

                <Form.Item
                  label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Password</Text>}
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: '#00B4D8' }} />} 
                    placeholder="••••••••" 
                    size="large"
                    style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block 
                    size="large"
                    icon={<LoginOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                      height: 46,
                      fontSize: 15,
                      boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)'
                    }}
                  >
                    Sign In to AquaMeter OS
                  </Button>
                </Form.Item>
              </Form>

              <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '18px 0 14px' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>1-Click Quick Demo Accounts</Text>
              </Divider>

              {/* Demo Buttons */}
              <Row gutter={10}>
                <Col span={12}>
                  <Button
                    block
                    onClick={() => handleQuickDemo('admin', 'admin123')}
                    style={{ background: '#08172e', borderColor: 'rgba(0, 180, 216, 0.25)', color: '#38BDF8', fontSize: 12 }}
                  >
                    Demo: <strong>admin</strong>
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    onClick={() => handleQuickDemo('user1', 'user123')}
                    style={{ background: '#08172e', borderColor: 'rgba(0, 180, 216, 0.25)', color: '#38BDF8', fontSize: 12 }}
                  >
                    Demo: <strong>user1</strong>
                  </Button>
                </Col>
              </Row>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Don't have an account?{' '}
                  <a 
                    onClick={onNavigateRegister} 
                    style={{ color: '#00B4D8', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Account <ArrowRight size={12} style={{ display: 'inline' }} />
                  </a>
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

