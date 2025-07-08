import { defineConfig } from "tsup";

import { description, version } from "./package.json";

const banner = `/*!
 * @ibnlanre/clone-v${version}
 * ${description}
 * 
 * Copyright (c) 2021 Ridwan Olanrewaju.
 * Licensed under the MIT license.
 */`;

export default defineConfig({
  banner: { js: banner },
  clean: true,
  dts: true,
  entry: ["./index.ts"],
  format: ["cjs", "esm"],
  minify: "terser",
  outDir: "./dist",
  sourcemap: true,
});
