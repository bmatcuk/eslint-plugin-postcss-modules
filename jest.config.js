const { defaults } = require("jest-config")

module.exports = {
  coverageDirectory: "<rootDir>/reports/",
  coverageReporters: ["text", "cobertura"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "tsx"],
  modulePaths: ["<rootDir>/lib/"],
  reporters: ["default", ["jest-junit", { outputDirectory: "reports" }]],
  transform: {
    "\\.tsx?$": "ts-jest",
  },
}
