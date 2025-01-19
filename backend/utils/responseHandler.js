const sendResponse = (res, statusCode, success, message = '', data = null) => {
    const response = {
      success,
      ...(message && { message }),
      ...(data !== null && { data })
    };
    return res.status(statusCode).json(response);
  };
  
  const sendSuccess = (res, data = null, message = '', statusCode = 200) => {
    return sendResponse(res, statusCode, true, message, data);
  };
  
  const sendError = (res, message = 'Server Error', statusCode = 500) => {
    return sendResponse(res, statusCode, false, message);
  };
  
  module.exports = {
    sendSuccess,
    sendError
  };