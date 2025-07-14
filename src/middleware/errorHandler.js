const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const error = {
    success: false,
    message: 'Erro interno do servidor',
    statusCode: 500
  };

  if (err.message) {
    error.message = err.message;
  }

  if (err.statusCode) {
    error.statusCode = err.statusCode;
  }

  res.status(error.statusCode).json(error);
};

module.exports = errorHandler;