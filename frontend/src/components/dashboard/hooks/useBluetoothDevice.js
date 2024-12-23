// hooks/useBluetoothDevice.js
import { useState, useEffect, useCallback } from 'react';

// UUID yang benar untuk BLE
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const DEVICE_ID_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const WIFI_SSID_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
const WIFI_PASS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26aa";

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
      setError('Bluetooth tidak didukung di browser ini');
      return false;
    }

    try {
      setConnectionStep('connecting');
      setError(null);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_DeviceConfig' }],
        optionalServices: [SERVICE_UUID]
      });

      console.log('Perangkat ditemukan:', device.name);

      const server = await device.gatt.connect();
      console.log('Terhubung ke GATT server');

      const service = await server.getPrimaryService(SERVICE_UUID);
      console.log('Service ditemukan');

      setBluetoothDevice({ device, service });
      setConnectionStep('connected');

      device.addEventListener('gattserverdisconnected', () => {
        console.log('Perangkat terputus');
        setConnectionStep('initial');
        setBluetoothDevice(null);
      });

      return true;
    } catch (err) {
      console.error('Error koneksi Bluetooth:', err);
      setError(err.message || 'Gagal terhubung ke perangkat');
      setConnectionStep('initial');
      return false;
    }
  }, [bluetoothSupported]);

  const configureDevice = useCallback(async (config) => {
    if (!bluetoothDevice?.service) {
      setError('Tidak ada perangkat yang terhubung');
      return false;
    }

    try {
      setConnectionStep('configuring');
      console.log('Mulai konfigurasi perangkat...');

      const writeCharacteristic = async (uuid, value) => {
        const characteristic = await bluetoothDevice.service.getCharacteristic(uuid);
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(value));
        console.log(`Berhasil menulis karakteristik ${uuid}`);
      };

      // Kirim konfigurasi secara berurutan
      await writeCharacteristic(DEVICE_ID_UUID, config.deviceId);
      await writeCharacteristic(WIFI_SSID_UUID, config.wifiSSID);
      await writeCharacteristic(WIFI_PASS_UUID, config.wifiPassword);

      console.log('Konfigurasi selesai');
      return true;
    } catch (err) {
      console.error('Error konfigurasi:', err);
      setError('Gagal mengkonfigurasi perangkat via Bluetooth');
      return false;
    }
  }, [bluetoothDevice]);

  const disconnect = useCallback(() => {
    if (bluetoothDevice?.device?.gatt.connected) {
      bluetoothDevice.device.gatt.disconnect();
      console.log('Perangkat diputuskan');
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