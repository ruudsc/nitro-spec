import { eventHandler } from "h3";

export default eventHandler((event) => {
  const title = "Redoc";

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="${title}" />
        <title>${title}</title>
      </head>
      <body>
        <redoc spec-url="./openapi.json"></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html> `;
});

function html(str: any, ...args: any) {
  return String.raw(str, ...args);
}
