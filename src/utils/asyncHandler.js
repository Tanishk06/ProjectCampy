const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)) //ensures that no matter what your handler returns (sync or async), it’s treated as a Promise, making error handling consistent and automatic.

      .catch((err) => next(err));
  };
};

export { asyncHandler };
