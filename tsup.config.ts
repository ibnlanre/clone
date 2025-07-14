import { defineConfig } from "tsup";

import { description, name, version } from "./package.json";

const js = `/*!
 * @ibnlanre/clone-v${version}
 * ${description}
 * 
 * Copyright (c) 2025 Ridwan Olanrewaju.
 * Licensed under the BSD-3-Clause license.
 */`;

export default defineConfig({
  banner: { js },
  clean: true,
  dts: true,
  entry: ["./index.ts"],
  format: ["cjs", "esm"],
  minify: true,
  name,
  outDir: "./dist",
  platform: "browser",
  sourcemap: true,
  target: "es2022",
  treeshake: true,
});
