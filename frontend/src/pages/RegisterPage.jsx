import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space, Divider, Row, Col } from 'antd';
import { 
  UserOutlined, LockOutlined, UserAddOutlined, 
  ArrowLeftOutlined, SafetyCertificateOutlined,
  CompassOutlined
} from '@ant-design/icons';
import { Waves, Droplets, ShieldCheck } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username.trim(),
          password: values.password.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSuccessMsg(`Account successfully created for ${data.username}! Redirecting to dashboard...`);
        setTimeout(() => {
          onRegisterSuccess(data.username);
        }, 800);
      } else {
        setErrorMsg(data.message || 'Registration failed. Username may already exist.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend server. Ensure API is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030814',
      backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(0, 180, 216, 0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(0, 119, 182, 0.12) 0%, transparent 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: 880, width: '100%' }}>
        <Row gutter={[32, 32]} align="middle" justify="center">
          <Col xs={24} md={18} lg={14}>
            <Card 
              style={{ 
                background: 'rgba(10, 25, 47, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 180, 216, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(0, 180, 216, 0.12)'
              }}
            >
              {/* Card Header with Water Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 18px rgba(0, 180, 216, 0.45)'
                }}>
                  <Waves size={22} color="#FFFFFF" />
                </div>
                <div>
                  <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
                    Create Domestic Account
                  </Title>
                  <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                    Register for isolated water telemetry & NWSDB tariff tracking
                  </Text>
                </div>
              </div>

              {errorMsg && (
                <Alert 
                  title={errorMsg} 
                  type="error" 
                  showIcon 
                  style={{ marginBottom: 18, borderRadius: 10 }} 
                />
              )}

              {successMsg && (
                <Alert 
                  title={successMsg} 
                  type="success" 
                  showIcon 
                  style={{ marginBottom: 18, borderRadius: 10 }} 
                />
              )}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                requiredMark={false}
              >
                <Form.Item
                  label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Username</Text>}
                  name="username"
                  rules={[
                    { required: true, message: 'Please enter a username' },
                    { min: 3, message: 'Username must be at least 3 characters' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#00B4D8' }} />} 
                    placeholder="e.g. alice or household_02" 
                    size="large"
                    style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)' }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Password</Text>}
                      name="password"
                      rules={[
                        { required: true, message: 'Please enter a password' },
                        { min: 4, message: 'Password must be at least 4 characters' }
                      ]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined style={{ color: '#00B4D8' }} />} 
                        placeholder="••••••••" 
                        size="large"
                        style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Confirm Password</Text>}
                      name="confirmPassword"
                      rules={[{ required: true, message: 'Please confirm password' }]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined style={{ color: '#00B4D8' }} />} 
                        placeholder="••••••••" 
                        size="large"
                        style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={<Text strong style={{ color: '#CBD5E1', fontSize: 13 }}>Connection Info (Optional)</Text>}
                  name="connectionInfo"
                  initialValues="3/4 Inch Standard Domestic Line"
                >
                  <Input 
                    prefix={<CompassOutlined style={{ color: '#00B4D8' }} />} 
                    placeholder="3/4 Inch Pipe - Colombo Domestic Grid" 
                    size="large"
                    disabled
                    style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.2)', color: '#94A3B8' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block 
                    size="large"
                    icon={<UserAddOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                      height: 46,
                      fontSize: 15,
                      boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)'
                    }}
                  >
                    Register Account & Access Telemetry
                  </Button>
                </Form.Item>
              </Form>

              <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '18px 0 14px' }} />

              <div style={{ textAlign: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>
                  Already have an account?{' '}
                  <a 
                    onClick={onNavigateLogin} 
                    style={{ color: '#00B4D8', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign In
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

