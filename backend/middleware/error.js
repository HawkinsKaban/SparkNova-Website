// middleware/error.js
const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map(val => val.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate data found'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
};

// Ensure correct export
module.exports = errorHandler;
