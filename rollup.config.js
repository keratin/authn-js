import filesize from "rollup-plugin-filesize"
import uglify from "rollup-plugin-uglify"

export default [
  {
    input: "./lib/index.js",
    output: {
      file: "./dist/keratin-authn.js",
      format: "cjs"
    },
    plugins: [filesize()]
  },
  {
    input: "./lib/index.js",
    output: {
      file: "./dist/keratin-authn.min.js",
      format: "umd"
    },
    name: "KeratinAuthN",
    plugins: [uglify(), filesize()]
  },
  {
    input: "./lib/index.js",
    output: {
      file: "./dist/keratin-authn.module.js",
      format: "es"
    },
    plugins: [filesize()]
  }
]
