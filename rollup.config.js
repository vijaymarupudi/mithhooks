import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

const t = terser({ compress: true, mangle: { properties: { regex: /^_/ } } });

export default {
  input: "./mithHooks.ts",
  plugins: [typescript()],
  external: ["mithril"],
  output: [
    {
      file: "dist/mithhooks.esm.js",
      plugins: [t],
      format: "es"
    },
    {
      file: "dist/mithhooks.cjs.js",
      plugins: [t],
      format: "cjs"
    },
    {
      file: "dist/mithhooks.umd.js",
      format: "umd",
      plugins: [t],
      name: "mithHooks",
      globals: {
        mithril: "m"
      }
    }
  ]
};
