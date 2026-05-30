const { defineFlatConfig } = require("eslint-define-config");

import config from "defaults/configurations/eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineFlatConfig({
  plugins: [config, eslintConfigPrettier],
});
