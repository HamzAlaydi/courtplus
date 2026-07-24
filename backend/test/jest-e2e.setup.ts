// Jest forces NODE_ENV=test, which the Joi validation schema
// (src/config/validation.ts) rejects when app.module.ts is evaluated.
process.env.NODE_ENV = 'development';
