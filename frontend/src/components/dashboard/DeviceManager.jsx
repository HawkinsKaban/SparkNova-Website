import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Alert } from '@/components/ui/alert';

const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [mode, setMode] = useState('list'); // list, add
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tahapBLE, setTahapBLE] = useState('scan'); // scan, hubungkan, konfigurasi
  const [perangkatBLE, setPerangkatBLE] = useState(null);
  const [dataKonfigurasi, setDataKonfigurasi] = useState({
    deviceId: '',
    nama: '',
    lokasi: '',
    wifiSSID: '',
    wifiPassword: ''
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${import.meta.env.REACT_APP_API_URL}/devices`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDevices(response.data.data);
    } catch (err) {
      setError('Gagal mengambil data perangkat');
      console.error('Error:', err);
    }
  };

  const mulaiPemindaian = async () => {
    try {
      setError('');
      
      const perangkat = await navigator.bluetooth.requestDevice({
        filters: [
          {
            services: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
          }
        ],
        optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
      });

      setPerangkatBLE(perangkat);
      setTahapBLE('hubungkan');
    } catch (err) {
      setError('Gagal memindai perangkat: ' + err.message);
    }
  };

  const hubungkanKePerangkat = async () => {
    try {
      setError('');
      setLoading(true);

      const server = await perangkatBLE.gatt.connect();
      const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
      
      setTahapBLE('konfigurasi');
    } catch (err) {
      setError('Gagal terhubung ke perangkat: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Kirim konfigurasi ke perangkat melalui BLE
      const stringKonfigurasi = JSON.stringify(dataKonfigurasi);
      const encoder = new TextEncoder();
      const bufferKonfigurasi = encoder.encode(stringKonfigurasi);
      
      // Setelah berhasil mengonfigurasi perangkat, daftarkan ke server
      const response = await axios.post(
        `${import.meta.env.REACT_APP_API_URL}/devices/register`,
        dataKonfigurasi,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setDevices([...devices, response.data.data]);
        setMode('list');
        setTahapBLE('scan');
        setDataKonfigurasi({
          deviceId: '',
          nama: '',
          lokasi: '',
          wifiSSID: '',
          wifiPassword: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan perangkat');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId) => {
    try {
      await axios.delete(`${import.meta.env.REACT_APP_API_URL}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchDevices();
    } catch (err) {
      setError('Gagal menghapus perangkat');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Perangkat</h2>
        <button
          onClick={() => setMode(mode === 'list' ? 'add' : 'list')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {mode === 'list' ? 'Tambah Perangkat' : 'Kembali ke Daftar'}
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <span>{error}</span>
        </Alert>
      )}

      {mode === 'add' ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Perangkat Baru</h3>
          
          {tahapBLE === 'scan' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Pastikan perangkat ESP32 Anda dalam mode pairing dan berada di dekat
              </p>
              <button
                onClick={mulaiPemindaian}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                Cari Perangkat
              </button>
            </div>
          )}

          {tahapBLE === 'hubungkan' && perangkatBLE && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Perangkat ditemukan: {perangkatBLE.name || 'Perangkat Tidak Dikenal'}
              </p>
              <button
                onClick={hubungkanKePerangkat}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                Hubungkan
              </button>
            </div>
          )}

          {tahapBLE === 'konfigurasi' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID Perangkat
                  </label>
                  <input
                    type="text"
                    value={dataKonfigurasi.deviceId}
                    onChange={(e) => setDataKonfigurasi({
                      ...dataKonfigurasi,
                      deviceId: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={dataKonfigurasi.nama}
                    onChange={(e) => setDataKonfigurasi({
                      ...dataKonfigurasi,
                      nama: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={dataKonfigurasi.lokasi}
                    onChange={(e) => setDataKonfigurasi({
                      ...dataKonfigurasi,
                      lokasi: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SSID WiFi
                  </label>
                  <input
                    type="text"
                    value={dataKonfigurasi.wifiSSID}
                    onChange={(e) => setDataKonfigurasi({
                      ...dataKonfigurasi,
                      wifiSSID: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password WiFi
                  </label>
                  <input
                    type="password"
                    value={dataKonfigurasi.wifiPassword}
                    onChange={(e) => setDataKonfigurasi({
                      ...dataKonfigurasi,
                      wifiPassword: e.target.value
                    })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Menambahkan...' : 'Tambah Perangkat'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div key={device._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{device.nama}</h3>
                  <p className="text-gray-600">ID: {device.deviceId}</p>
                  <p className="text-gray-600">Lokasi: {device.lokasi}</p>
                  <p className="text-gray-600">Status: {device.status || 'Tidak diketahui'}</p>
                </div>
                <button
                  onClick={() => handleDelete(device._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceManager;