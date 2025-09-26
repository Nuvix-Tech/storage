import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    splitting: false,
    minify: false,
    target: "es2024",
    shims: true,
    bundle: true,
    tsconfig: "./tsconfig.json",
});
