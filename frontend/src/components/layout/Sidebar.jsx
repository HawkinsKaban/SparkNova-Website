// components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Settings, AlertTriangle, Cpu } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white w-64 shadow-sm flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">SparkNova</h2>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link
          to="/"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isActiveRoute('/') 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        
        <Link
          to="/devices"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isActiveRoute('/devices') 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Cpu className="w-5 h-5 mr-3" />
          Devices
        </Link>
        
        <Link
          to="/monitoring"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isActiveRoute('/monitoring') 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Activity className="w-5 h-5 mr-3" />
          Monitoring
        </Link>
        
        <Link
          to="/alerts"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isActiveRoute('/alerts') 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mr-3" />
          Alerts
        </Link>
        
        <Link
          to="/settings"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isActiveRoute('/settings') 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;