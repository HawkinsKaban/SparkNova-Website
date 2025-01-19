import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
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
import { motion } from 'framer-motion';

// Register ChartJS components
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

// Constants for chart styling
const CHART_COLORS = {
  power: {
    border: 'rgb(75, 192, 192)',
    background: 'rgba(75, 192, 192, 0.5)'
  },
  energy: {
    border: 'rgb(255, 99, 132)',
    background: 'rgba(255, 99, 132, 0.5)'
  }
};

const EnergyChart = ({ 
  data = [], 
  period = 'daily',
  loading = false,
  height = 400 
}) => {
  // Format timestamp based on period
  const formatTime = useMemo(() => (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const options = {
        daily: { 
          hour: '2-digit', 
          minute: '2-digit' 
        },
        weekly: { 
          weekday: 'short', 
          day: 'numeric' 
        },
        monthly: { 
          day: 'numeric', 
          month: 'short' 
        }
      };
      
      return date.toLocaleString('id-ID', options[period] || options.daily);
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }, [period]);

  // Process and validate chart data
  const processedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => 
      item && 
      (item.timestamp || item.readingTime) && 
      (typeof item.power !== 'undefined' || typeof item.energy !== 'undefined')
    ).map(item => ({
      timestamp: item.timestamp || item.readingTime,
      power: Number(item.power) || 0,
      energy: Number(item.energy) || 0
    }));
  }, [data]);

  // Memoize chart configuration
  const { chartData, chartOptions } = useMemo(() => {
    const formattedData = {
      labels: processedData.map(item => formatTime(item.timestamp)),
      datasets: [
        {
          label: 'Power (W)',
          data: processedData.map(item => item.power),
          borderColor: CHART_COLORS.power.border,
          backgroundColor: CHART_COLORS.power.background,
          yAxisID: 'y',
          pointRadius: 3,
          tension: 0.4,
          fill: false,
          borderWidth: 2
        },
        {
          label: 'Energy (kWh)',
          data: processedData.map(item => item.energy),
          borderColor: CHART_COLORS.energy.border,
          backgroundColor: CHART_COLORS.energy.background,
          yAxisID: 'y1',
          pointRadius: 3,
          tension: 0.4,
          fill: false,
          borderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      stacked: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        title: {
          display: true,
          text: `Energy Consumption History (${period.charAt(0).toUpperCase() + period.slice(1)})`,
          font: { size: 16, weight: 'bold' },
          padding: 20
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#000',
          titleFont: { size: 13 },
          bodyColor: '#666',
          bodyFont: { size: 12 },
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          callbacks: {
            title: (context) => formatTime(processedData[context[0].dataIndex]?.timestamp),
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return label.includes('Power') 
                ? `${label}: ${value.toFixed(2)} W`
                : `${label}: ${value.toFixed(3)} kWh`;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Power (W)',
            font: { weight: 'bold' },
            padding: { bottom: 10 }
          },
          grid: {
            drawOnChartArea: true,
            color: 'rgba(0, 0, 0, 0.05)'
          },
          min: 0,
          ticks: {
            callback: (value) => `${value.toFixed(1)} W`
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Energy (kWh)',
            font: { weight: 'bold' },
            padding: { bottom: 10 }
          },
          grid: {
            drawOnChartArea: false
          },
          min: 0,
          ticks: {
            callback: (value) => `${value.toFixed(3)} kWh`
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time',
            font: { weight: 'bold' },
            padding: { top: 10 }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 12
          },
          grid: {
            display: false
          }
        }
      }
    };

    return { chartData: formattedData, chartOptions: options };
  }, [processedData, period, formatTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!processedData.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for this period</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-lg p-4"
      style={{ height }}
    >
      <Line data={chartData} options={chartOptions} />
    </motion.div>
  );
};

EnergyChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string,
    readingTime: PropTypes.string,
    power: PropTypes.number,
    energy: PropTypes.number
  })),
  period: PropTypes.oneOf(['daily', 'weekly', 'monthly']),
  loading: PropTypes.bool,
  height: PropTypes.number
};

export default React.memo(EnergyChart);