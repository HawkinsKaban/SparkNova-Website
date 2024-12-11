import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, Settings, AlertTriangle, Cpu } from 'lucide-react';
import Account from '../../assets/account.png';

const Sidebar = () => {
  const location = useLocation();

  // Ambil data user dari localStorage (jika ada)
  const user = JSON.parse(localStorage.getItem('user')) || {}; // Ambil data user yang tersimpan, jika tidak ada, gunakan object kosong
  console.log(user?.pengguna);
  
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white w-40 md:w-64 shadow-sm flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800">SparkNova</h2>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link
          to="/"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Home className="w-5 h-5 mr-3" />
          Dashboard
        </Link>

        {/* Link lainnya bisa dimasukkan di sini */}

        <Link
          to="/settings"
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/settings')
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </nav>

      {/* Bagian Profile */}
      <Link
        to="/settings"
        className={`absolute bottom-4 w-60 flex items-center px-4 py-2 rounded-lg transition-colors ${isActiveRoute('/settings')
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        <img src={Account} alt="" className="w-10 md:w-12" />
        <div className="ml-2">
          <p className="font-bold text-sm md:text-lg">{user?.pengguna?.username || 'Username'}</p>
          <p className="font-bold text-[10px] md:text-xs -mt-1">{user?.pengguna?.email || 'Email'}</p>
          <p className="font-normal text-[9px] md:text-[11px]">
            <a href="#">edit profile</a>
          </p>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
