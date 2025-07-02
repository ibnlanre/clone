import { version, description } from "./package.json";
import { defineConfig } from "tsup";

const banner = `/*!
 * @ibnlanre/clone-v${version}
 * ${description}
 * 
 * Copyright (c) 2021 Ridwan Olanrewaju.
 * Licensed under the MIT license.
 */`;

export default defineConfig({
  entry: ["./index.ts"],
  outDir: "./",
  format: ["cjs", "esm"],
  dts: true,
  clean: false,
  sourcemap: true,
  minify: true,
  banner: {
    js: banner,
  },
});
