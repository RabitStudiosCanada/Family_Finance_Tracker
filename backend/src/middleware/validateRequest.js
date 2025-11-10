const createError = require('http-errors');
const { ZodError } = require('zod');

const formatZodIssues = (error) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

const validateRequest = (schema) => async (req, _res, next) => {
  try {
    const result = await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (result.body) {
      req.body = result.body;
    }

    if (result.params) {
      req.params = result.params;
    }

    if (result.query) {
      req.query = result.query;
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(createError(422, 'Validation failed', { details: formatZodIssues(error) }));
      return;
    }

    next(error);
  }
};

module.exports = validateRequest;
