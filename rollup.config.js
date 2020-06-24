import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const t = terser({ compress: true, mangle: { properties: { regex: /^_/ } } });

function makeExampleTarget(exampleName) {
  return {
    input: `./examples/${exampleName}.ts`,
    plugins: [typescript(), resolve(), commonjs()],
    output: {
      file: `./dist/${exampleName}.js`,
      plugins: [t]
    }
  }
}

export default [
  {
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
  },
  makeExampleTarget("useTimeExample"),
  makeExampleTarget("useAnimationFrameExample")
];
