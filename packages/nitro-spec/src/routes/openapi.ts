import { defineEventHandler, EventHandler } from "h3";

export type OpenApiRoute = {
  baseUrl: string;
  title: string;
  description: string;
};

export const createOpenApiRoute = (
  options: OpenApiRoute,
): EventHandler<Request, unknown> =>
  defineEventHandler((event) => {
    const { description, title, baseUrl } = options;

    const scalarConfig = {
      spec: { url: baseUrl },
    };

    return html`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="${description}" />
          <title>${title}</title>
        </head>
        <body>
          <script
            id="api-reference"
            data-configuration="${JSON.stringify(scalarConfig)
              .split('"')
              .join("&quot;")}"
          ></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>`;
  });

function html(str: any, ...args: any) {
  return String.raw(str, ...args);
}
