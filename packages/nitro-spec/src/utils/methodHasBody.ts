export const methodHasBody = (method: string) =>
  ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
