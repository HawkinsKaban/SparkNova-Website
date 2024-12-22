import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Gauge, Battery, Activity, Calendar } from 'lucide-react';
import EnergyChart from '../dashboard/EnergyChart';
import axios from 'axios';

const DetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const deviceId = location.pathname.split('/')[2];  // Asumsi deviceId ada setelah /device/

    const [fromDate, setFromDate] = useState(new Date('2024-01-01T00:00:00'));
    const [toDate, setToDate] = useState(new Date());
    const [period, setPeriod] = useState('daily');
    const [chartData, setChartData] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [statisticData, setStatisticData] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const fetchDataHistory = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/energy/history/${deviceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        from: fromDate.toISOString(),
                        to: toDate.toISOString()
                    }
                }
            );

            if (response.data.success) {
                setHistoryData(response.data?.data[0]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataStatistics = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/energy/statistics/${deviceId}/${period}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log(response);

            if (response.data.success) {
                setStatisticData(response.data?.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchDataHistory();
    };

    useEffect(() => {
        fetchDataHistory();
    }, [deviceId]);

    useEffect(() => {
        fetchDataStatistics();
    }, [period]);

    console.log(statisticData);
    

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
                    <h1 className="text-2xl font-bold text-gray-800">{historyData.name}</h1>
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

            {/* Tanggal dan waktu range picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col">
                    <label htmlFor="fromDate" className="text-sm font-semibold text-gray-500">From</label>
                    <input
                        type="datetime-local"
                        id="fromDate"
                        value={fromDate.toISOString().slice(0, 16)}
                        onChange={(e) => setFromDate(new Date(e.target))}
                        className="mt-2 p-2 border border-gray-300 rounded-lg"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="toDate" className="text-sm font-semibold text-gray-500">To</label>
                    <input
                        type="datetime-local"
                        id="toDate"
                        value={toDate.toISOString().slice(0, 16)}
                        onChange={(e) => setToDate(new Date(e.target))}
                        className="mt-2 p-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Tombol Search */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Filter
                </button>
            </div>

            {/* Real-time Readings Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {/* Grid card untuk menampilkan data seperti Voltage, Current, Power, dll */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-500">Voltage</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.voltage}
                        <span className="text-sm text-gray-500 ml-1">
                            V
                        </span>
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Activity className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-500">Current</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.current}
                        <span className="text-sm text-gray-500 ml-1">
                            A
                        </span>
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Gauge className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-500">Power</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.power}
                        <span className="text-sm text-gray-500 ml-1">
                            W
                        </span>
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Battery className="w-5 h-5 text-purple-500 mr-2" />
                        <span className="text-sm text-gray-500">Energy</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.energy}
                        <span className="text-sm text-gray-500 ml-1">
                            kWh
                        </span>
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Activity className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-sm text-gray-500">Frequency</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.frequency}
                        <span className="text-sm text-gray-500 ml-1">
                            Hz
                        </span>
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center mb-2">
                        <Gauge className="w-5 h-5 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-500">Power Factor</span>
                    </div>
                    <p className="text-xl font-semibold">
                        {historyData.powerFactor}
                        {historyData.powerFactor && (
                            <span className="text-sm text-gray-500 ml-1">

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
                    <></>
                    // <EnergyChart data={chartData} period={period} />
                )}
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <Gauge className="w-6 h-6 text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold">Avg Usage</h3>
                    </div>
                    <p className="text-3xl font-bold">{statisticData?.averagePower?.toFixed(2)} kWh</p>
                    <p className="text-sm text-gray-500 mt-2">Average daily consumption</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-4">
                        <Battery className="w-6 h-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-semibold">Total Usage</h3>
                    </div>
                    <p className="text-3xl font-bold">{statisticData?.totalKwh?.toFixed(2)} kWh</p>
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
                        }).format(statisticData?.totalCost / (period == "daily" ? 1 : period == "weekly" ? 7 : 30))}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Average daily cost</p>
                </div>
            </div>
        </div>
    );
};

export default DetailPage;
