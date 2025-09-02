import { defineConfig } from "vite"
import { resolve } from "path"
import dts from "vite-plugin-dts"

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SupabaseTypedQuery",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.js"),
    },
    rollupOptions: {
      external: ["@supabase/supabase-js", "functype", /^@supabase\//, /^functype\//],
      output: {
        globals: {
          "@supabase/supabase-js": "supabase",
          functype: "functype",
        },
      },
    },
    sourcemap: true,
    minify: false, // Keep readable for debugging
  },
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      outDir: "dist",
      insertTypesEntry: true,
      // DO NOT use rollupTypes - it breaks functype type inference
      // rollupTypes: false
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
