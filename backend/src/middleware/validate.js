const { ZodError } = require('zod');

const formatIssues = (error) => {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
};

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = source === 'query' ? req.query : req.body;
    const parsed = schema.parse(data);
    if (source === 'body') {
      req.body = parsed;
    } else if (source === 'query') {
      req.query = parsed;
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatIssues(err),
      });
    }
    next(err);
  }
};

module.exports = { validate, formatIssues };
