// src/components/dashboard/EnergyChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Mendaftarkan komponen Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EnergyChart = ({ data }) => {
  // Menyiapkan data untuk chart.js
  const chartData = {
    labels: data.map((item) => item.time),  // Menampilkan waktu pada sumbu X
    datasets: [
      {
        label: 'Energy Usage (W)',
        data: data.map((item) => item.usage),  // Menampilkan penggunaan energi pada sumbu Y
        fill: false,
        borderColor: 'rgba(75,192,192,1)',  // Warna garis
        tension: 0.1,  // Menentukan kelengkungan garis
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Energy Consumption History',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Usage: ${context.raw} W`;  // Menampilkan nilai penggunaan energi
          },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default EnergyChart;
