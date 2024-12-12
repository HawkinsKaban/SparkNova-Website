import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Gauge, Battery, Activity, Calendar } from 'lucide-react';
import EnergyChart from '../dashboard/EnergyChart';
import axios from 'axios';


const DetailPage = () => {
    const { deviceId } = useParams();
    const navigate = useNavigate();
    const [period, setPeriod] = useState('daily');
    const [deviceData, setDeviceData] = useState({
        name: "Living Room Device",
        readings: {
            current: { value: 2.3, unit: 'A' },
            voltage: { value: 220.5, unit: 'V' },
            power: { value: 506.15, unit: 'W' },
            energy: { value: 45.2, unit: 'kWh' },
            frequency: { value: 50.0, unit: 'Hz' },
            powerFactor: { value: 0.95, unit: '' }
        }
    });
    const [usageStats, setUsageStats] = useState({
        avgUsage: 0,
        totalUsage: 0,
        avgCost: 0
    });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                let fromDate = new Date();

                switch(period) {
                    case 'daily':
                        fromDate.setHours(0, 0, 0, 0);
                        break;
                    case 'weekly':
                        fromDate.setDate(now.getDate() - 7);
                        break;
                    case 'monthly':
                        fromDate.setMonth(now.getMonth() - 1);
                        break;
                    default:
                        fromDate.setHours(0, 0, 0, 0);
                }

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/energy/history/${deviceId}`,
                    {
                        params: {
                            from: fromDate.toISOString(),
                            to: now.toISOString()
                        }
                    }
                );

                if (response.data.success) {
                    setChartData(response.data.data);
                    // Calculate statistics from response data
                    // This would need to be adjusted based on your actual API response structure
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [deviceId, period]);

    return (
        <div className="p-6">
            {/* Header with back button and period selector */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">{deviceData.name}</h1>
                </div>
                
                <div className="flex items-center bg-white rounded-lg shadow px-4 py-2">
                    <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="border-none bg-transparent focus:ring-0"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>

{/* Real-time Readings Grid */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-500">Voltage</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.voltage.value}
            <span className="text-sm text-gray-500 ml-1">
                {deviceData.readings.voltage.unit}
            </span>
        </p>
    </div>

    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Current</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.current.value}
            <span className="text-sm text-gray-500 ml-1">
                {deviceData.readings.current.unit}
            </span>
        </p>
    </div>

    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Gauge className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-500">Power</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.power.value}
            <span className="text-sm text-gray-500 ml-1">
                {deviceData.readings.power.unit}
            </span>
        </p>
    </div>

    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Battery className="w-5 h-5 text-purple-500 mr-2" />
            <span className="text-sm text-gray-500">Energy</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.energy.value}
            <span className="text-sm text-gray-500 ml-1">
                {deviceData.readings.energy.unit}
            </span>
        </p>
    </div>

    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm text-gray-500">Frequency</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.frequency.value}
            <span className="text-sm text-gray-500 ml-1">
                {deviceData.readings.frequency.unit}
            </span>
        </p>
    </div>

    <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-2">
            <Gauge className="w-5 h-5 text-orange-500 mr-2" />
            <span className="text-sm text-gray-500">Power Factor</span>
        </div>
        <p className="text-xl font-semibold">
            {deviceData.readings.powerFactor.value}
            {deviceData.readings.powerFactor.unit && (
                <span className="text-sm text-gray-500 ml-1">
                    {deviceData.readings.powerFactor.unit}
                </span>
            )}
        </p>
    </div>
</div>

            {/* Energy Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Power Consumption History</h2>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <EnergyChart data={chartData} period={period} />
                )}
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <Gauge className="w-6 h-6 text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold">Avg Usage</h3>
                    </div>
                    <p className="text-3xl font-bold">{usageStats.avgUsage.toFixed(2)} kWh</p>
                    <p className="text-sm text-gray-500 mt-2">Average daily consumption</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <Battery className="w-6 h-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-semibold">Total Usage</h3>
                    </div>
                    <p className="text-3xl font-bold">{usageStats.totalUsage.toFixed(2)} kWh</p>
                    <p className="text-sm text-gray-500 mt-2">Total energy consumed</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <Zap className="w-6 h-6 text-purple-500 mr-2" />
                        <h3 className="text-lg font-semibold">Avg Cost</h3>
                    </div>
                    <p className="text-3xl font-bold">
                        {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR'
                        }).format(usageStats.avgCost)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Average daily cost</p>
                </div>
            </div>
        </div>
    );
};

export default DetailPage;