// @ts-check

/** @type {import("webpack").Configuration} */
export default {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    filename: "index.js",
  },
  module: {
    rules: [{
      test: /.tsx?$/,
      use: "ts-loader",
    }],
  },
};
