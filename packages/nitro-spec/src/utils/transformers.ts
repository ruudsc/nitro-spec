import { ResponseTransformer } from "../hooks/defineMeta";
import { H3Event } from "h3";

/**
 * Field filtering transformer
 * Filters response fields based on the `fields` query parameter.
 * If present, only the specified fields are included in the response object or array of objects.
 *
 * Example: ?fields=id,name
 */
export const createFieldFilterTransformer = (): ResponseTransformer<any> => {
  return (response: any, event: H3Event<Request>, statusCode: number) => {
    if (statusCode !== 200) {
      return response;
    }

    const query = new URL(event.node.req.url || '', `http://${event.node.req.headers.host}`).searchParams;
    const fields = query.get('fields');
    
    if (!fields) {
      return response;
    }

    const fieldsArray = fields.split(',').map(f => f.trim());
    
    const filterObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(filterObject);
      }
      
      if (obj && typeof obj === 'object') {
        const filtered: any = {};
        for (const field of fieldsArray) {
          if (field in obj) {
            filtered[field] = obj[field];
          }
        }
        return filtered;
      }
      
      return obj;
    };

    return filterObject(response);
  };
};

/**
 * Response formatting transformer
 * Wraps the response in a standard envelope format or returns the raw response.
 *
 * Envelope format: { success, statusCode, data, timestamp }
 * Minimal format: returns the raw response
 */
export const createResponseFormatTransformer = (
  format: 'envelope' | 'minimal' = 'envelope'
): ResponseTransformer<any> => {
  return (response: any, event: H3Event<Request>, statusCode: number) => {
    if (format === 'envelope') {
      return {
        success: statusCode >= 200 && statusCode < 300,
        statusCode,
        data: response,
        timestamp: new Date().toISOString(),
      };
    }
    
    return response;
  };
};

/**
 * Compose multiple response transformers into a single transformer.
 * Applies each transformer in sequence to the response.
 * Useful for combining field filtering, formatting, etc.
 */
export const composeTransformers = (...transformers: ResponseTransformer<any>[]): ResponseTransformer<any> => {
  return (response: any, event: H3Event<Request>, statusCode: number) => {
    return transformers.reduce((acc, transformer) => {
      return transformer(acc, event, statusCode);
    }, response);
  };
};
