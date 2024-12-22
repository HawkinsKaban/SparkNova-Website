import React from 'react';
import { useNavigate } from 'react-router-dom';
import BG from '../assets/bg.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Side - Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8">
          <div className="max-w-md w-full space-y-8">
            {/* Logo and Title */}
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                <h1 className="text-4xl font-bold">
                  <span className="text-gray-800">Spark</span>
                  <span className="text-blue-500">Nova</span>
                </h1>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Smart Home Electricity Management
              </h2>
              <p className="mt-2 text-gray-600">
                Monitor and control your home energy consumption in real-time
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-8 space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 px-4 rounded-lg bg-white text-blue-500 font-medium border-2 border-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign Up
              </button>
            </div>

            {/* Features */}
            <div className="mt-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4">
                  <div className="text-blue-500 font-semibold">Real-time Monitoring</div>
                  <p className="text-sm text-gray-600">Track your energy usage instantly</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-blue-500 font-semibold">Smart Control</div>
                  <p className="text-sm text-gray-600">Manage devices remotely</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-blue-500 font-semibold">Usage Analytics</div>
                  <p className="text-sm text-gray-600">Detailed consumption reports</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-blue-500 font-semibold">Cost Savings</div>
                  <p className="text-sm text-gray-600">Optimize your energy spending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:block md:w-1/2 bg-gray-100">
          <div className="h-full flex items-center justify-center p-8">
            <img
              src={BG}
              alt="Smart Energy Meter"
              className="max-w-md rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;