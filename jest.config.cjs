module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/unit/**/*.test.js"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};
