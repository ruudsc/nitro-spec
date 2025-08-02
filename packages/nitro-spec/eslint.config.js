const { defineFlatConfig } = require("eslint-define-config");

import eslintConfigPrettier from "eslint-config-prettier";
import config from "defaults/configurations/eslint";

export default defineFlatConfig({
  plugins: [config, eslintConfigPrettier],
});
