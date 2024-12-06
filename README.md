# SparkNova - Sistem Monitoring Energi Listrik

SparkNova adalah sistem monitoring dan manajemen energi listrik berbasis IoT yang memungkinkan pengguna untuk memantau dan mengontrol penggunaan listrik secara real-time.

## 🌟 Fitur Utama

- **Monitoring Real-time**
  - Pantau tegangan, arus, dan daya secara langsung
  - Visualisasi data menggunakan grafik interaktif
  - Riwayat penggunaan energi

- **Kontrol Perangkat**
  - Kontrol relay jarak jauh
  - Pengaturan batas penggunaan daya
  - Notifikasi peringatan

- **Manajemen Biaya**
  - Kalkulasi biaya listrik otomatis
  - Laporan penggunaan harian/mingguan/bulanan
  - Estimasi tagihan

## 🛠️ Teknologi

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Frontend
- React.js
- TailwindCSS
- Recharts
- Axios

### IoT Hardware
- ESP32
- PZEM-004T v3.0
- Relay Module
- OLED Display

## 📦 Instalasi

### Backend
```bash
# Masuk ke direktori backend
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Jalankan server
npm run dev
```

### Frontend
```bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies
npm install

# Jalankan aplikasi
npm start
```

### Konfigurasi ESP32
1. Install Arduino IDE
2. Install library yang diperlukan:
   - PZEM004Tv30
   - WiFi
   - ArduinoJson
   - Adafruit_SSD1306
3. Upload kode ke ESP32

## 🔧 Penggunaan

1. Register akun baru
2. Login ke sistem
3. Tambahkan device baru
4. Mulai monitoring penggunaan listrik

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user

### Devices
- `GET /api/devices` - Mendapatkan daftar device
- `POST /api/devices/register` - Mendaftarkan device baru
- `PUT /api/devices/:id` - Update informasi device

### Energy Data
- `GET /api/energy/:deviceId` - Mendapatkan data energi terkini
- `GET /api/energy/:deviceId/history` - Mendapatkan riwayat penggunaan

## 👥 Tim Pengembang

- Ray Hawkins Kaban - Developer & Researcher

## 📄 Lisensi

Hak Cipta © 2024 SparkNova. All rights reserved.

## 📞 Kontak

Untuk pertanyaan dan informasi lebih lanjut:
- Email: rayhawkinskaban@gmail.com
- GitHub: [HawkinsKaban](https://github.com/HawkinsKaban)