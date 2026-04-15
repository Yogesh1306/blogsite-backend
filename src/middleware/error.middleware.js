const errorHandler = (error, _, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    status: statusCode,
    success: false,
    message,
    
  });
  next()
};
export default errorHandler;
