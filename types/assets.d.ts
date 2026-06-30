// Ambient declarations for non-code side-effect/asset imports so that
// `next build` / `tsc` don't error on them (e.g. `import './globals.css'` in
// app/layout.tsx). Next.js handles the actual bundling of these files; these
// declarations only satisfy the TypeScript checker.
//
// Required because this project is pinned to TypeScript 6.0.3, which strictly
// checks side-effect imports of modules with no type declarations (TS2882).
declare module '*.css'
declare module '*.scss'
declare module '*.sass'
