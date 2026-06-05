const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.name === 'ZodError') {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      message: 'Validation error',
      errors: issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  const status = err.status || 500;
  const message = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(status).json({ message });
};

module.exports = errorHandler;
