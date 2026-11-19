import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryChart({ readings = [] }) {
  const labels = readings.map(r => {
    if (!r.timestamp) return '';
    const parts = r.timestamp.split(' ');
    return parts[1] || r.timestamp;
  });

  const flowData = readings.map(r => r.flow_rate_lpm || 0);
  const pointColors = readings.map(r => r.is_anomaly ? '#ef4444' : '#06b6d4');
  const pointRadii = readings.map(r => r.is_anomaly ? 6 : 3);

  const data = {
    labels: labels.length > 0 ? labels : ['00:00', '00:10', '00:20', '00:30'],
    datasets: [
      {
        label: 'Flow Rate (L/min)',
        data: flowData.length > 0 ? flowData : [0, 0, 0, 0],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: pointRadii,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const index = context.dataIndex;
            const r = readings[index];
            if (r && r.is_anomaly) {
              return `⚠️ ANOMALY: ${r.alert_message || 'Abnormal usage'}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', maxTicksLimit: 10 }
      },
      y: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8' },
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '360px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}

