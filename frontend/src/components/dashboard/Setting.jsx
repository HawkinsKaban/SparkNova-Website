import React from 'react';

const ProfilePage = () => {
  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Cek apakah data user ada
  if (!user || !user?.pengguna) {
    return <div className="p-6">User data not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Profile</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-8 justify-center">
          {/* Gambar profil */}
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-semibold text-white">
            {user?.pengguna?.username ? user?.pengguna?.username.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
        
        {/* Menampilkan detail lainnya */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">User Details</h3>
            <p className="text-lg"><strong>Username:</strong> {user?.pengguna?.username || 'Not available'}</p>
            <p className="text-lg"><strong>Email:</strong> {user?.pengguna?.email || 'Not available'}</p>
            <p className="text-lg"><strong>Peran:</strong> {user?.pengguna?.peran || 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
