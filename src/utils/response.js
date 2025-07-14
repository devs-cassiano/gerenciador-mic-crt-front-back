class ApiResponse {
  static success(data, message = 'Operação realizada com sucesso') {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message, statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
      statusCode
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }
}

module.exports = ApiResponse;