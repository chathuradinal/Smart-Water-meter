import React from 'react';
import { Space, Card, Typography, Tag, Button } from 'antd';
import { 
  CameraOutlined, CheckCircleOutlined, ThunderboltOutlined, 
  EyeOutlined, SafetyCertificateOutlined, SettingOutlined,
  CompassOutlined, SlidersOutlined, BookOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { Camera, Focus, Zap, ShieldCheck, Eye, Layers } from 'lucide-react';
import CameraCard from '../components/CameraCard';

const { Title, Text } = Typography;

export default function CameraStudioView({ onSnapshotCaptured, onNavigateGuidance }) {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* ── Top Studio Banner & Quick Calibrations ─────────────────────────── */}
      <Card className="aquatic-card" style={{ borderRadius: 16 }}>
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
              <CameraOutlined style={{ fontSize: 20, color: '#00B4D8' }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, color: '#FFFFFF' }}>
                Dial Vision Studio & Optical Calibration
              </Title>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                OmniVision OV2640 alignment, GPIO 4 flash illumination, and 5-drum mechanical ROI windows
              </Text>
            </div>
          </div>

          <Space size="middle" wrap>
            <Tag color="#0077B6" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, margin: 0 }}>
              📷 OV2640 Grayscale QVGA
            </Tag>
            <Tag color="#00B4D8" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, margin: 0 }}>
              🔍 Optimal Focus: 6.5 cm
            </Tag>
            <Tag color="#10B981" style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6, margin: 0 }}>
              ⚡ 500ms LED Settle
            </Tag>
          </Space>
        </div>
      </Card>

      {/* ── Camera Card: Interactive Viewfinder with Dynamic ROI Overlay ─── */}
      <CameraCard onSnapshotUpdated={onSnapshotCaptured} />

      {/* ── Guidance & Technical Calibration Shortcut ─────────────────── */}
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
                Hardware Calibration & Optical Specs Manual
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Full M12 lens focal specifications, 5-drum bounding box coordinates, and anti-glare pit mounting procedures have been consolidated in the Operations Manual.
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
              Open Guidance Manual
            </Button>
          )}
        </div>
      </Card>
    </Space>
  );
}
