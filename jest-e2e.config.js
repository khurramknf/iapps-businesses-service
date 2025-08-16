/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  testRegex: "test/e2e/.*\\.e2e-spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": ["@swc/jest"] },
  setupFilesAfterEnv: ["<rootDir>/test/e2e/setup/jest.setup.js"],
  globalSetup: "<rootDir>/test/e2e/setup/global-setup.js",
  globalTeardown: "<rootDir>/test/e2e/setup/global-teardown.js",
};
