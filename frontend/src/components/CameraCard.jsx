import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Row, Col, Typography, Tag, Button, 
  Switch, Tooltip, Badge, Space, Alert, Divider, Modal,
  Segmented, Input, message 
} from 'antd';
import { 
  CameraOutlined, EyeOutlined, ReloadOutlined, 
  ThunderboltOutlined, CheckCircleOutlined, ExpandOutlined,
  SettingOutlined, SafetyCertificateOutlined, InfoCircleOutlined,
  UploadOutlined, VideoCameraOutlined, WifiOutlined, CheckOutlined,
  EditOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { 
  Camera, Focus, Zap, Eye, RefreshCw, ZoomIn, 
  ShieldCheck, Video, UploadCloud, Radio, Play, Square, 
  Crosshair, Check, Sparkles 
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export default function CameraCard({ onSnapshotUpdated }) {
  // Mode: 'webcam' (Live Device Camera) | 'upload' (Photo Upload) | 'esp32' (Wi-Fi ESP32 Stream) | 'mock' (Simulated Lens)
  const [inputMode, setInputMode] = useState('webcam');

  const [cameraInfo, setCameraInfo] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState('/api/snapshot');
  const [showRois, setShowRois] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(new Date().toLocaleTimeString());

  // WebCam Live Stream states
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ESP32 Remote Stream states
  const [esp32Url, setEsp32Url] = useState('192.168.1.197');
  const [esp32LiveStream, setEsp32LiveStream] = useState(false);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [autoPollEsp32, setAutoPollEsp32] = useState(true);

  const parseEsp32Target = (raw) => {
    if (!raw) return { ip: '', captureUrl: '', streamUrl: '' };
    const cleaned = raw.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    return {
      ip: cleaned,
      captureUrl: `http://${cleaned}/capture`,
      streamUrl: `http://${cleaned}:81/stream`
    };
  };

  // Ingestion results state
  const [lastRecognized, setLastRecognized] = useState(null);
  const [manualAdjustOpen, setManualAdjustOpen] = useState(false);
  const [manualReadingVal, setManualReadingVal] = useState('');

  const fetchCameraInfo = async () => {
    try {
      const res = await fetch('/api/camera');
      if (res.ok) {
        const data = await res.json();
        setCameraInfo(data);
      }
    } catch (err) {
      console.error("Camera info fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCameraInfo();
  }, []);

  // Clean up media stream on unmount or mode switch
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  // Handle webcam start / stop
  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on phones if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsStreaming(true);
      } else {
        setCameraError("Camera access is not supported by your browser environment.");
      }
    } catch (err) {
      console.error("Webcam access error:", err);
      setCameraError(`Could not access device camera: ${err.message || 'Permission denied'}. Please allow camera permissions.`);
      setIsStreaming(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const toggleWebcam = () => {
    if (isStreaming) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const refreshSnapshot = () => {
    setRefreshing(true);
    const newUrl = `/api/snapshot?t=${Date.now()}`;
    setSnapshotUrl(newUrl);
    setLastCaptureTime(new Date().toLocaleTimeString());
    setTimeout(() => setRefreshing(false), 400);
  };

  // 1. Capture frame directly from Live WebCam
  const handleCaptureWebcamFrame = async () => {
    if (!videoRef.current || capturing) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Jpg = canvas.toDataURL('image/jpeg', 0.88);

      const res = await fetch('/api/camera/process-real-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64Jpg,
          device_id: 'ESP32_METER_01'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastRecognized(data.snapshot);
        setManualReadingVal(String(data.snapshot.reading));
        refreshSnapshot();
        if (onSnapshotUpdated) onSnapshotUpdated();
        message.success(`Live frame captured! Recognized: ${data.snapshot.reading} m³`);
      } else {
        message.error("Failed to process captured camera frame.");
      }
    } catch (err) {
      console.error("Live capture error:", err);
      message.error("Error communicating with capture endpoint.");
    } finally {
      setCapturing(false);
    }
  };

  // 2. Upload Real Photo from disk / mobile camera file
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCapturing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('device_id', 'ESP32_METER_01');

      const res = await fetch('/api/camera/process-real-frame', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setLastRecognized(data.snapshot);
        setManualReadingVal(String(data.snapshot.reading));
        refreshSnapshot();
        if (onSnapshotUpdated) onSnapshotUpdated();
        message.success(`Photo processed! Recognized: ${data.snapshot.reading} m³`);
      } else {
        message.error("Failed to process uploaded meter image.");
      }
    } catch (err) {
      console.error("File upload error:", err);
      message.error("Error uploading image file.");
    } finally {
      setCapturing(false);
      // Reset input
      event.target.value = '';
    }
  };

  // 3. Fetch Frame from ESP32 IP
  const handleFetchRemoteEsp32 = async () => {
    if (!esp32Url || fetchingRemote) return;
    setFetchingRemote(true);
    try {
      const endpoints = parseEsp32Target(esp32Url);
      const targetUrl = endpoints.captureUrl;
      const res = await fetch('/api/camera/fetch-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, device_id: 'ESP32_METER_01' })
      });

      if (res.ok) {
        const data = await res.json();
        setLastRecognized(data.snapshot);
        setManualReadingVal(String(data.snapshot.reading));
        refreshSnapshot();
        if (onSnapshotUpdated) onSnapshotUpdated();
        message.success(`Frame ingested from ESP32: ${data.snapshot.reading} m³`);
      } else {
        message.warning(`Could not reach ESP32 at ${targetUrl}. Verify ESP32 IP.`);
      }
    } catch (err) {
      console.error("ESP32 fetch error:", err);
      message.error("Network error communicating with ESP32 IP.");
    } finally {
      setFetchingRemote(false);
    }
  };

  // Auto-sync effect: when ESP32 posts frames in background, automatically update view
  useEffect(() => {
    if (!autoPollEsp32) return;
    const timer = setInterval(() => {
      refreshSnapshot();
      if (onSnapshotUpdated) onSnapshotUpdated();
    }, 6000);
    return () => clearInterval(timer);
  }, [autoPollEsp32, onSnapshotUpdated]);

  // 4. Simulated Lens Trigger (Fallback)
  const handleTriggerSimulatedCapture = async () => {
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
        setLastRecognized(data.snapshot);
        setManualReadingVal(String(data.snapshot.reading));
        refreshSnapshot();
        if (onSnapshotUpdated) onSnapshotUpdated();
        message.success(`Simulated dial capture recorded: ${data.snapshot.reading} m³`);
      }
    } catch (err) {
      console.error("Simulated capture error:", err);
    } finally {
      setCapturing(false);
    }
  };

  // Submit manual reading confirmation / correction
  const handleSaveManualReading = async () => {
    if (!manualReadingVal || isNaN(parseFloat(manualReadingVal))) {
      message.error("Please enter a valid numeric water meter reading.");
      return;
    }
    try {
      const res = await fetch('/api/snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading: parseFloat(manualReadingVal),
          mode: 'custom'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastRecognized(data.snapshot);
        refreshSnapshot();
        if (onSnapshotUpdated) onSnapshotUpdated();
        setManualAdjustOpen(false);
        message.success(`Confirmed meter reading saved: ${manualReadingVal} m³`);
      }
    } catch (err) {
      message.error("Failed to save adjusted reading.");
    }
  };

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
              <Camera size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 16 }}>
                  Live Camera Studio & Optical Ingestion
                </span>
                <Tag color={isStreaming ? "#10B981" : "#0077B6"} style={{ borderRadius: 6, fontWeight: 600 }}>
                  {isStreaming ? "LIVE WEBCAM ON" : "READY"}
                </Tag>
              </div>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Input real water meter frames via WebCam, image upload, or physical ESP32-CAM (not mocked data)
              </Text>
            </div>
          </div>

          {/* Input Source Selector */}
          <Segmented
            value={inputMode}
            onChange={(val) => {
              setInputMode(val);
              if (val !== 'webcam' && isStreaming) {
                stopWebcam();
              }
            }}
            options={[
              { label: '💻 WebCam / Phone', value: 'webcam', icon: <VideoCameraOutlined /> },
              { label: '📁 Upload Real Photo', value: 'upload', icon: <UploadOutlined /> },
              { label: '📡 ESP32-CAM Wi-Fi', value: 'esp32', icon: <WifiOutlined /> },
              { label: '🧪 Simulated Sensor', value: 'mock', icon: <ThunderboltOutlined /> }
            ]}
            style={{
              background: '#040b18',
              border: '1px solid rgba(0, 180, 216, 0.25)',
              padding: 3
            }}
          />
        </div>
      }
    >
      {/* ── Active Input Source Toolbar ────────────────────────────────────── */}
      <div style={{
        background: 'rgba(5, 15, 33, 0.75)',
        border: '1px solid rgba(0, 180, 216, 0.2)',
        borderRadius: 12,
        padding: '10px 16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Mode 1: WebCam Controls */}
        {inputMode === 'webcam' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
            <Space size="middle" wrap>
              <Button
                type={isStreaming ? "default" : "primary"}
                icon={isStreaming ? <Square size={14} style={{ display: 'inline', marginRight: 4 }} /> : <Play size={14} style={{ display: 'inline', marginRight: 4 }} />}
                onClick={toggleWebcam}
                style={{
                  background: isStreaming ? '#07162c' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderColor: isStreaming ? 'rgba(239, 68, 68, 0.4)' : '#10B981',
                  color: isStreaming ? '#EF4444' : '#FFFFFF',
                  fontWeight: 600,
                  borderRadius: 8
                }}
              >
                {isStreaming ? "Stop Live Camera" : "Start Live Camera"}
              </Button>

              {isStreaming && (
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  onClick={handleCaptureWebcamFrame}
                  loading={capturing}
                  style={{
                    background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                    fontWeight: 700,
                    borderRadius: 8,
                    boxShadow: '0 0 16px rgba(0, 180, 216, 0.4)'
                  }}
                >
                  📸 Capture & Recognize Live Dial
                </Button>
              )}

              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                {isStreaming ? "Point your camera at the water meter counter rollers" : "Turn on camera to capture live video from your webcam or phone"}
              </Text>
            </Space>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>ROI Overlay:</Text>
              <Switch size="small" checked={showRois} onChange={setShowRois} />
            </div>
          </div>
        )}

        {/* Mode 2: Photo Upload Controls */}
        {inputMode === 'upload' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: '0 4px 14px rgba(0, 180, 216, 0.35)'
                }}
              >
                <UploadCloud size={16} />
                <span>Select Meter Photo from Computer / Phone</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                Supports real JPG, PNG, and camera photos.
              </Text>
            </div>

            {capturing && <Tag color="processing">Processing Real Image...</Tag>}
          </div>
        )}

        {/* Mode 3: ESP32-CAM Wi-Fi Controls */}
        {inputMode === 'esp32' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Input
                value={esp32Url}
                onChange={(e) => setEsp32Url(e.target.value)}
                placeholder="ESP32 IP e.g. 192.168.0.75"
                prefix={<Radio size={14} color="#00B4D8" style={{ marginRight: 4 }} />}
                style={{ width: 210, background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#F1F5F9' }}
              />
              <Button
                type={esp32LiveStream ? "default" : "primary"}
                onClick={() => setEsp32LiveStream(!esp32LiveStream)}
                style={{
                  background: esp32LiveStream ? '#07162c' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  borderColor: esp32LiveStream ? 'rgba(239, 68, 68, 0.4)' : '#10B981',
                  color: esp32LiveStream ? '#EF4444' : '#FFFFFF',
                  fontWeight: 600,
                  borderRadius: 8
                }}
              >
                {esp32LiveStream ? "Stop Live Stream" : "▶ Start Live Stream (Port 81)"}
              </Button>
              <Button
                type="primary"
                onClick={handleFetchRemoteEsp32}
                loading={fetchingRemote}
                style={{ background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', borderColor: '#00B4D8', fontWeight: 600, borderRadius: 8 }}
              >
                📸 Capture & OCR (Port 80)
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Auto-Sync Telemetry:</Text>
                <Switch size="small" checked={autoPollEsp32} onChange={setAutoPollEsp32} />
              </div>
              <Tag color="#00B4D8">ESP32 Node</Tag>
            </div>
          </div>
        )}

        {/* Mode 4: Simulated Sensor Controls */}
        {inputMode === 'mock' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <Space size="middle">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleTriggerSimulatedCapture}
                loading={capturing}
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderColor: '#F59E0B', fontWeight: 600 }}
              >
                Fire Simulated Lens & Settle
              </Button>
              <Button icon={<ReloadOutlined />} onClick={refreshSnapshot} loading={refreshing}>
                Refresh View
              </Button>
            </Space>
            <Tag color="#F59E0B">Simulated Environment</Tag>
          </div>
        )}
      </div>

      {/* Error alert if camera permission denied */}
      {cameraError && (
        <Alert
          type="warning"
          showIcon
          title="Camera Access Notice"
          description={cameraError}
          closable
          onClose={() => setCameraError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Hidden canvas used for webcam frame snapshot capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <Row gutter={[24, 24]} align="middle">
        {/* ── Left Column: Live Viewfinder (Webcam Stream or Captured Photo) ── */}
        <Col xs={24} lg={15}>
          <div style={{
            background: '#000000',
            borderRadius: 14,
            padding: 16,
            border: '1px solid rgba(0, 180, 216, 0.35)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 180, 216, 0.15)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            overflow: 'hidden'
          }}>
            {/* Viewfinder HUD Corner Accents */}
            <div style={{ position: 'absolute', top: 12, left: 14, width: 14, height: 14, borderLeft: '2px solid #00B4D8', borderTop: '2px solid #00B4D8' }} />
            <div style={{ position: 'absolute', top: 12, right: 14, width: 14, height: 14, borderRight: '2px solid #00B4D8', borderTop: '2px solid #00B4D8' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 14, width: 14, height: 14, borderLeft: '2px solid #00B4D8', borderBottom: '2px solid #00B4D8' }} />
            <div style={{ position: 'absolute', bottom: 12, right: 14, width: 14, height: 14, borderRight: '2px solid #00B4D8', borderBottom: '2px solid #00B4D8' }} />

            {/* Viewfinder Header Status Pill */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 32,
              background: 'rgba(5, 15, 33, 0.85)',
              padding: '3px 10px',
              borderRadius: 6,
              border: '1px solid rgba(0, 180, 216, 0.3)',
              fontSize: 11,
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 10
            }}>
              <Badge
                status={(isStreaming || (inputMode === 'esp32' && esp32LiveStream)) ? "processing" : "default"}
                color={(isStreaming || (inputMode === 'esp32' && esp32LiveStream)) ? "#10B981" : "#0077B6"}
              />
              <span>
                {inputMode === 'esp32' && esp32LiveStream
                  ? "ESP32 LIVE STREAM (PORT 81)"
                  : isStreaming
                  ? "LIVE WEBCAM FEED"
                  : `SNAPSHOT ARCHIVE · ${lastCaptureTime}`}
              </span>
            </div>

            {/* Inspect Button */}
            <Button
              size="small"
              icon={<ZoomIn size={13} style={{ display: 'inline', marginRight: 4 }} />}
              onClick={() => setInspectModalOpen(true)}
              style={{
                position: 'absolute',
                top: 14,
                right: 32,
                background: 'rgba(5, 15, 33, 0.85)',
                borderColor: 'rgba(0, 180, 216, 0.3)',
                color: '#CBD5E1',
                fontSize: 11,
                zIndex: 10
              }}
            >
              Zoom Inspect
            </Button>

            {/* Video Stream OR Image Display */}
            <div style={{ position: 'relative', display: 'inline-block', margin: '20px 0 10px', maxWidth: '100%', maxHeight: 270 }}>
              {inputMode === 'esp32' && esp32LiveStream ? (
                <img
                  src={parseEsp32Target(esp32Url).streamUrl}
                  alt="ESP32 Live Stream"
                  onError={() => {
                    message.warning("Could not connect to ESP32 stream on port 81. Check ESP32 power and Wi-Fi.");
                    setEsp32LiveStream(false);
                  }}
                  style={{
                    maxHeight: 250,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 10,
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                />
              ) : isStreaming ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    maxHeight: 250,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 10,
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                />
              ) : (
                <img
                  src={snapshotUrl}
                  alt="Water Meter Dial"
                  style={{
                    maxHeight: 250,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />
              )}

              {/* Dynamic 5-Drum ROI Bounding Box Overlay */}
              {showRois && (
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
                    padding: 6,
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 8,
                    border: '1px dashed rgba(0, 180, 216, 0.85)',
                    boxShadow: '0 0 16px rgba(0, 180, 216, 0.3)'
                  }}>
                    <div style={{ width: 34, height: 46, border: '2px solid #FFFFFF', background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}>
                      <span>#1</span>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>m³</span>
                    </div>
                    <div style={{ width: 34, height: 46, border: '2px solid #FFFFFF', background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}>
                      <span>#2</span>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>m³</span>
                    </div>
                    <div style={{ width: 34, height: 46, border: '2px solid #FFFFFF', background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}>
                      <span>#3</span>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>m³</span>
                    </div>
                    <div style={{ width: 34, height: 46, border: '2px solid #FFFFFF', background: 'rgba(255, 255, 255, 0.15)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}>
                      <span>#4</span>
                      <span style={{ fontSize: 9, opacity: 0.8 }}>m³</span>
                    </div>
                    <div style={{ width: 34, height: 46, border: '2px solid #EF4444', background: 'rgba(239, 68, 68, 0.25)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FEE2E2', fontWeight: 800, fontSize: 11, boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>
                      <span>#8</span>
                      <span style={{ fontSize: 9, color: '#FCA5A5' }}>0.1</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Optical HUD Metadata */}
            <div style={{
              display: 'flex',
              gap: 16,
              fontSize: 11,
              color: '#94A3B8',
              fontFamily: 'monospace'
            }}>
              <span>Source: <strong style={{ color: '#38BDF8' }}>{inputMode.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Inference Engine: <strong style={{ color: '#10B981' }}>TinyML INT8 CNN</strong></span>
              <span>•</span>
              <span>Target: <strong style={{ color: '#F59E0B' }}>5 Roller Drums</strong></span>
            </div>
          </div>
        </Col>

        {/* ── Right Column: Recognized Digits & Live Readings ─────────────── */}
        <Col xs={24} lg={9}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {/* Live Recognized Value Card */}
            <Card 
              size="small" 
              style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.25)', borderRadius: 12 }}
              title={
                <span style={{ color: '#F1F5F9', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📊 Ingested Meter Value
                </span>
              }
              extra={
                <Button 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={() => setManualAdjustOpen(true)}
                  style={{ background: 'transparent', borderColor: 'rgba(0, 180, 216, 0.3)', color: '#38BDF8', fontSize: 11 }}
                >
                  Adjust
                </Button>
              }
            >
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <Text style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase' }}>Mechanical Dial Reading</Text>
                <Title level={2} style={{ color: '#38BDF8', margin: '4px 0 10px', fontFamily: 'monospace' }}>
                  {lastRecognized ? Number(lastRecognized.reading).toFixed(4) : "37.2468"} <span style={{ fontSize: 16, color: '#94A3B8' }}>m³</span>
                </Title>

                {/* 5-Drum Digit Badges */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                  {(lastRecognized?.digits || [
                    { drum: 1, digit: 0, color: 'white' },
                    { drum: 2, digit: 0, color: 'white' },
                    { drum: 3, digit: 3, color: 'white' },
                    { drum: 4, digit: 7, color: 'white' },
                    { drum: 5, digit: 2, color: 'red' }
                  ]).map((d, i) => (
                    <div 
                      key={i}
                      style={{
                        width: 32,
                        height: 38,
                        borderRadius: 6,
                        background: d.color === 'red' ? '#DC2626' : '#F8FAFC',
                        color: d.color === 'red' ? '#FFFFFF' : '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 16,
                        fontFamily: 'monospace'
                      }}
                    >
                      {d.digit}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid rgba(0, 180, 216, 0.15)', paddingTop: 8 }}>
                  <span style={{ color: '#94A3B8' }}>Flow State:</span>
                  <strong style={{ color: lastRecognized?.is_leak ? '#EF4444' : '#10B981' }}>
                    {lastRecognized?.is_leak ? "⚠️ Leak Anomaly" : "✅ Normal Flow"}
                  </strong>
                </div>
              </div>
            </Card>

            {/* Quick Live Actions Card */}
            <Card 
              size="small" 
              style={{ background: '#050f21', borderColor: 'rgba(0, 180, 216, 0.25)', borderRadius: 12 }}
              title={
                <span style={{ color: '#F1F5F9', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ Real Data Instructions
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#94A3B8' }}>
                <div>
                  <strong style={{ color: '#38BDF8' }}>1. Device WebCam:</strong>
                  <span> Click "Start Live Camera", point webcam at your water meter, and press "Capture".</span>
                </div>
                <div>
                  <strong style={{ color: '#10B981' }}>2. Phone Camera:</strong>
                  <span> Switch to "Upload Real Photo" and snap a photo directly using your phone's camera.</span>
                </div>
                <div>
                  <strong style={{ color: '#F59E0B' }}>3. Physical ESP32-CAM:</strong>
                  <span> Flash the firmware in <code style={{ color: '#CBD5E1' }}>iot/firmware/</code> and connect over Wi-Fi.</span>
                </div>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* ── High-Resolution Inspection Modal ──────────────────────────────── */}
      <Modal
        open={inspectModalOpen}
        onCancel={() => setInspectModalOpen(false)}
        footer={null}
        width={720}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CameraOutlined style={{ color: '#00B4D8' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Optical Dial Inspection · Native View</span>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{
            background: '#000000',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(0, 180, 216, 0.3)',
            display: 'inline-block'
          }}>
            <img
              src={snapshotUrl}
              alt="High-Res Dial Inspection"
              style={{ maxHeight: 380, maxWidth: '100%', borderRadius: 8 }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Manual Adjust / Confirm Reading Modal ──────────────────────────── */}
      <Modal
        open={manualAdjustOpen}
        onCancel={() => setManualAdjustOpen(false)}
        onOk={handleSaveManualReading}
        okText="Confirm & Save Reading"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#00B4D8' }} />
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Confirm / Fine-tune Dial Reading</span>
          </div>
        }
      >
        <Paragraph style={{ color: '#94A3B8', fontSize: 13, marginTop: 10 }}>
          If lighting or tilt caused a digit to be misread by the camera, enter the exact 5-drum number shown on your physical meter:
        </Paragraph>
        <div style={{ margin: '16px 0' }}>
          <Text style={{ color: '#CBD5E1', display: 'block', marginBottom: 6 }}>Water Meter Reading (m³):</Text>
          <Input 
            size="large"
            value={manualReadingVal}
            onChange={(e) => setManualReadingVal(e.target.value)}
            placeholder="e.g. 37.2468"
            suffix={<span style={{ color: '#00B4D8', fontWeight: 700 }}>m³</span>}
            style={{ fontFamily: 'monospace', fontSize: 18 }}
          />
        </div>
      </Modal>
    </Card>
  );
}
