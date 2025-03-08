export type BaseOpenApiOptions = {
  baseUrl: string;
};

export type OpenApiOptions = BaseOpenApiOptions & {
  title?: string;
  description?: string;
  termsOfService?: string;
  version: string;
  contact?: {
    name: string;
    url: string;
    email: string;
  };
  license?: {
    name: string;
    url: string;
  };
  servers?: {
    url: string;
    description?: string;
  }[];
};
