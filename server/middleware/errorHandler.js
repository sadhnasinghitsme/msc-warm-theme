function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate value';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
