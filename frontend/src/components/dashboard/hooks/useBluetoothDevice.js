import { useState, useEffect, useCallback } from 'react';

export const useBluetoothDevice = () => {
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [connectionStep, setConnectionStep] = useState('initial');
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setBluetoothSupported('bluetooth' in navigator);
  }, []);

  const connectDevice = useCallback(async () => {
    if (!bluetoothSupported) {
      setError('Bluetooth is not supported in this browser');
      return false;
    }

    try {
      setConnectionStep('connecting');
      setError(null);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_DeviceConfig' }],
        optionalServices: ['device_configuration_service']
      });

      await device.gatt.connect();
      setBluetoothDevice(device);
      setConnectionStep('connected');

      device.gatt.addEventListener('gattserverdisconnected', () => {
        setConnectionStep('initial');
        setBluetoothDevice(null);
      });

      return true;
    } catch (err) {
      console.error('Bluetooth connection error:', err);
      setError(err.message || 'Failed to connect to Bluetooth device');
      setConnectionStep('initial');
      return false;
    }
  }, [bluetoothSupported]);

  const configureDevice = useCallback(async (config) => {
    if (!bluetoothDevice) {
      setError('Please connect to a device first');
      return false;
    }

    try {
      setConnectionStep('configuring');
      const server = await bluetoothDevice.gatt.connect();
      const service = await server.getPrimaryService('device_configuration_service');

      const writeCharacteristic = async (uuid, value) => {
        const characteristic = await service.getCharacteristic(uuid);
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(value));
      };

      await writeCharacteristic('wifi_ssid', config.wifiSSID);
      await writeCharacteristic('wifi_password', config.wifiPassword);
      await writeCharacteristic('device_id', config.deviceId);

      return true;
    } catch (err) {
      console.error('Bluetooth configuration error:', err);
      setError('Failed to configure device via Bluetooth');
      return false;
    }
  }, [bluetoothDevice]);

  const disconnect = useCallback(() => {
    if (bluetoothDevice?.gatt.connected) {
      bluetoothDevice.gatt.disconnect();
    }
    setConnectionStep('initial');
    setBluetoothDevice(null);
  }, [bluetoothDevice]);

  return {
    bluetoothSupported,
    connectionStep,
    bluetoothDevice,
    error,
    connectDevice,
    configureDevice,
    disconnect
  };
};