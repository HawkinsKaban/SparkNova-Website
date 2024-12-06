// src/components/dashboard/PowerControl.jsx
import React, { useState } from 'react';
import { toggleRelay } from '../../services/api';

const PowerControl = () => {
  const [relayStatus, setRelayStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await toggleRelay(!relayStatus);
      setRelayStatus(response.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Power Control</h2>
          <p className="text-gray-600">Current status: {relayStatus ? 'ON' : 'OFF'}</p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            ${relayStatus 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
            }
          `}
        >
          {loading ? 'Processing...' : relayStatus ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>
    </div>
  );
};

export default PowerControl;