import React, { memo } from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';

// Metric configurations with direct icon imports
const METRICS = [
  { 
    key: 'power',
    label: 'Power', 
    unit: 'W',
    icon: LucideIcons.Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    format: (value) => value?.toFixed(2) || '0',
    getValue: (readings) => readings?.power || 0,
    showZeroWhenInactive: true
  },
  { 
    key: 'voltage',
    label: 'Voltage',
    unit: 'V',
    icon: LucideIcons.Activity,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    format: (value) => value?.toFixed(1) || '0',
    getValue: (readings) => readings?.voltage || 0,
    showZeroWhenInactive: false
  },
  { 
    key: 'current',
    label: 'Current',
    unit: 'A',
    icon: LucideIcons.Waves,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    format: (value) => value?.toFixed(3) || '0',
    getValue: (readings) => readings?.current || 0,
    showZeroWhenInactive: true
  },
  { 
    key: 'powerFactor',
    label: 'Power Factor',
    unit: '',
    icon: LucideIcons.Gauge,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    format: (value) => value?.toFixed(2) || '0',
    getValue: (readings) => readings?.powerFactor || 0,
    showZeroWhenInactive: true
  },
  { 
    key: 'frequency',
    label: 'Frequency',
    unit: 'Hz',
    icon: LucideIcons.Activity,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    format: (value) => value?.toFixed(1) || '0',
    getValue: (readings) => readings?.frequency || 0,
    showZeroWhenInactive: false
  },
  { 
    key: 'energy',
    label: 'Energy',
    unit: 'kWh',
    icon: LucideIcons.Battery,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    format: (value) => value?.toFixed(3) || '0',
    getValue: (readings) => readings?.energy || 0,
    showZeroWhenInactive: false
  }
];

const MetricsCard = memo(({ metric, reading, isConnected, isLoading }) => {
  const { 
    label, 
    unit, 
    icon: Icon, 
    color, 
    bgColor, 
    format, 
    getValue, 
    showZeroWhenInactive 
  } = metric;

  let displayValue;
  if (!isConnected && showZeroWhenInactive) {
    displayValue = 0;
  } else {
    displayValue = getValue(reading?.readings);
  }

  return (
    <div className={`${bgColor} rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Icon className={`h-5 w-5 ${color} mr-2`} />
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <LucideIcons.RefreshCcw className="h-4 w-4 text-blue-500 animate-spin" />
            )}
            <div className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`} />
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-800">
              {format(displayValue)}
            </span>
            {unit && (
              <span className="ml-1 text-sm text-gray-500">{unit}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-gray-400">
              {reading?.readings?.timestamp?.local && (
                new Date(reading.readings.timestamp.local)
                  .toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const MetricsGrid = ({ 
  latestReading, 
  isLoading = false,
  customMetrics,
  className = ''
}) => {
  const isConnected = latestReading?.status?.deviceStatus === 'connected';
  const metricsToRender = customMetrics || METRICS;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
      {metricsToRender.map((metric) => (
        <MetricsCard
          key={metric.key}
          metric={metric}
          reading={latestReading}
          isConnected={isConnected}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

// PropTypes
MetricsCard.propTypes = {
  metric: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    unit: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    bgColor: PropTypes.string.isRequired,
    format: PropTypes.func.isRequired,
    getValue: PropTypes.func.isRequired,
    showZeroWhenInactive: PropTypes.bool
  }).isRequired,
  reading: PropTypes.object,
  isConnected: PropTypes.bool,
  isLoading: PropTypes.bool
};

MetricsGrid.propTypes = {
  latestReading: PropTypes.shape({
    status: PropTypes.shape({
      deviceStatus: PropTypes.string,
      relayState: PropTypes.bool
    }),
    readings: PropTypes.shape({
      power: PropTypes.number,
      voltage: PropTypes.number,
      current: PropTypes.number,
      powerFactor: PropTypes.number,
      frequency: PropTypes.number,
      energy: PropTypes.number,
      timestamp: PropTypes.shape({
        local: PropTypes.string
      })
    })
  }),
  isLoading: PropTypes.bool,
  customMetrics: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    unit: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    bgColor: PropTypes.string.isRequired,
    format: PropTypes.func.isRequired,
    getValue: PropTypes.func.isRequired,
    showZeroWhenInactive: PropTypes.bool
  })),
  className: PropTypes.string
};

MetricsGrid.defaultProps = {
  latestReading: null,
  isLoading: false,
  customMetrics: null,
  className: ''
};

export default memo(MetricsGrid);