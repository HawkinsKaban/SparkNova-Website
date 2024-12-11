// src/components/detail/DetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import EnergyChart from '../dashboard/EnergyChart';
import CostLogo from '../../assets/cost.svg';
import UsageLogo from '../../assets/usage.svg';

const DetailPage = () => {
    const { unit } = useParams();

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
        "LED Light": {
            averageUsage: 25,
            totalUsage: 800,
            averageCost: 2.0,
            chartData: [
                { time: '2023-12-01', usage: 30 },
                { time: '2023-12-02', usage: 25 },
                { time: '2023-12-03', usage: 20 },
                { time: '2023-12-04', usage: 35 },
            ],
        },
        "Air Conditioner": {
            averageUsage: 95,
            totalUsage: 3000,
            averageCost: 10.0,
            chartData: [
                { time: '2023-12-01', usage: 100 },
                { time: '2023-12-02', usage: 90 },
                { time: '2023-12-03', usage: 80 },
                { time: '2023-12-04', usage: 110 },
            ],
        },
    };

    // const unitData = data[unit];
    const unitData = data["Portable Speaker"];

    if (!unitData) {
        return <div>Unit not found</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">{unit} Detail</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Energy Consumption History</h2>
                <EnergyChart data={unitData.chartData} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {Object.entries(unitData).map(([key, value], index) => {
                    if (key === 'chartData') return null;

                    return (
                        <div key={index} className="bg-white rounded-lg shadow p-2 flex">
                            <img src={index == 0 || index == 1 ? UsageLogo : CostLogo} alt="" />
                            <div className="ml-4">
                                <p className="text-sm text-[#98A4B5] ">{index == 0 ? "Avg Usage" : index == 1 ? "Total Usage" : "Avg Cost"}</p>
                                <p className="text-[#303E65] text-2xl font-bold">{index == 0 ? `${value}kWh` : index == 1 ? `${value}kWh` : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DetailPage;