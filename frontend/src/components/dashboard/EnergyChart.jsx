import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EnergyChart = ({ data, period = 'daily' }) => {
  // Format timestamp based on period
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    switch (period) {
      case 'daily':
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      case 'weekly':
        return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      case 'monthly':
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      default:
        return date.toLocaleTimeString('id-ID');
    }
  };

  const chartData = {
    labels: data.map(item => formatTime(item.readingTime)),
    datasets: [
      {
        label: 'Power (W)',
        data: data.map(item => item.power),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Energy (kWh)',
        data: data.map(item => item.energy),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: `Energy Consumption History (${period.charAt(0).toUpperCase() + period.slice(1)})`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Power')) {
              return `${label}: ${value.toFixed(2)} W`;
            }
            return `${label}: ${value.toFixed(3)} kWh`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Power (W)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for this period</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default EnergyChart;