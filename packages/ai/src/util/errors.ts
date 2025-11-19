export const getErrorMessage = (e: unknown) => {
  if (e instanceof Error) {
    return e.message;
  } else if (typeof e === 'string') {
    return e;
  }
};
