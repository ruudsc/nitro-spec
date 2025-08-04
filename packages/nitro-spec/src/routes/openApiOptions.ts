export type BaseOpenApiOptions = {
  baseUrl: string;
  openapi?: "3.1.0" | "3.0.0";
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
  additionalJsonUrls?: string[];
};
