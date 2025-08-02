/** @type {import("@commitlint/types").UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce project-wide 50-char header limit
    "header-max-length": [2, "always", 50],
  },
};
