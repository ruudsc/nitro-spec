export const isValidMethod = (method: string): method is Method => {
  return methods.includes(method as Method);
};

export const methods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
];

export type Method = (typeof methods)[number];
