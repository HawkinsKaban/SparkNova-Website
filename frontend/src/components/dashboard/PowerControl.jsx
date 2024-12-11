import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import EnergyChart from '../dashboard/EnergyChart';
import CostLogo from '../../assets/cost.svg';
import UsageLogo from '../../assets/usage.svg';
import VoltageLogo from '../../assets/voltage.svg';
import CurrentLogo from '../../assets/current.svg';
import PowerLogo from '../../assets/power.svg';

const DetailPage = () => {
    const { unit } = useParams();
    const [isRelayOn, setIsRelayOn] = useState(false);
    const [realtimeData, setRealtimeData] = useState({
        voltage: 220,
        current: 0.5,
        power: 110,
        powerFactor: 0.98,
        frequency: 50,
        energy: 0.5
    });

    // Dummy data untuk unit tertentu
    const data = {
        "Portable Speaker": {
            averageUsage: 450,
            totalUsage: 450,
            averageCost: 50000,
            chartData: [
                { time: '2023-12-01', usage: 50 },
                { time: '2023-12-02', usage: 45 },
                { time: '2023-12-03', usage: 40 },
                { time: '2023-12-04', usage: 60 },
            ],
        },
    };

    const unitData = data["Portable Speaker"];

    // Toggle relay state
    const handleRelayToggle = async () => {
        try {
            // Ganti dengan endpoint API yang sebenarnya
            const response = await fetch(`/api/devices/${unit}/relay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ state: !isRelayOn }),
            });
            
            if (response.ok) {
                setIsRelayOn(!isRelayOn);
            }
        } catch (error) {
            console.error('Failed to toggle relay:', error);
        }
    };

    // Polling realtime data
    useEffect(() => {
        const fetchRealtimeData = async () => {
            try {
                // Ganti dengan endpoint API yang sebenarnya
                const response = await fetch(`/api/devices/${unit}/metrics`);
                const data = await response.json();
                setRealtimeData(data);
            } catch (error) {
                console.error('Failed to fetch realtime data:', error);
            }
        };

        const interval = setInterval(fetchRealtimeData, 1000);
        return () => clearInterval(interval);
    }, [unit]);

    if (!unitData) {
        return <div>Unit not found</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{unit} Detail</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                        Power {isRelayOn ? 'On' : 'Off'}
                    </span>
                    <Switch
                        checked={isRelayOn}
                        onCheckedChange={handleRelayToggle}
                    />
                </div>
            </div>

            {/* Realtime Monitoring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <img src={VoltageLogo} alt="Voltage" className="w-12 h-12" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Voltage</p>
                            <p className="text-2xl font-bold">{realtimeData.voltage} V</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <img src={CurrentLogo} alt="Current" className="w-12 h-12" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Current</p>
                            <p className="text-2xl font-bold">{realtimeData.current} A</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <img src={PowerLogo} alt="Power" className="w-12 h-12" />
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Power</p>
                            <p className="text-2xl font-bold">{realtimeData.power} W</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">PF</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Power Factor</p>
                            <p className="text-2xl font-bold">{realtimeData.powerFactor}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">Hz</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Frequency</p>
                            <p className="text-2xl font-bold">{realtimeData.frequency} Hz</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">E</span>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">Energy</p>
                            <p className="text-2xl font-bold">{realtimeData.energy} kWh</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Energy Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Energy Consumption History</h2>
                <EnergyChart data={unitData.chartData} />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(unitData).map(([key, value], index) => {
                    if (key === 'chartData') return null;

                    return (
                        <div key={index} className="bg-white rounded-lg shadow p-4 flex items-center">
                            <img 
                                src={index === 0 || index === 1 ? UsageLogo : CostLogo} 
                                alt="" 
                                className="w-12 h-12"
                            />
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">
                                    {index === 0 ? "Avg Usage" : index === 1 ? "Total Usage" : "Avg Cost"}
                                </p>
                                <p className="text-2xl font-bold">
                                    {index === 0 || index === 1 
                                        ? `${value}kWh` 
                                        : new Intl.NumberFormat('id-ID', { 
                                            style: 'currency', 
                                            currency: 'IDR' 
                                          }).format(value)
                                    }
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DetailPage;