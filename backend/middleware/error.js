// middleware/error.js
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      sukses: false,
      pesan: Object.values(err.errors).map(val => val.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      sukses: false,
      pesan: 'Data duplikat ditemukan'
    });
  }

  res.status(500).json({
    sukses: false,
    pesan: 'Server Error'
  });
};

module.exports = errorHandler;