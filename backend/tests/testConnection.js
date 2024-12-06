// tests/testConnection.js
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const testConnection = async () => {
  let connection;
  try {
    connection = await connectDB();
    
    if (mongoose.connection.readyState === 1) {
      console.log('\nDetail Koneksi:');
      console.log('----------------');
      console.log('Database:', mongoose.connection.name);
      console.log('Host:', mongoose.connection.host);
      console.log('State: Connected');
      
      // Tampilkan informasi replika set
      console.log('\nReplica Set Info:');
      console.log('----------------');
      console.log('Replica Set:', 'atlas-gvdssf-shard-0');
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\nKoleksi yang tersedia:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }

  } catch (error) {
    console.error('Error saat testing:', error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('\nKoneksi ditutup');
    }
    process.exit(0);
  }
};

// Tambahkan error handler untuk unhandled promises
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

testConnection();