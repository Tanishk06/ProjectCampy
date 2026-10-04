class apiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "", //It's basically the history of where the error came from.
  ) {
    super(message); //"Run the parent (Error) constructor and give it message as its argument." as apiError is a children of Error class , so before using "this" ,the parent class class needs to be initialized.
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
