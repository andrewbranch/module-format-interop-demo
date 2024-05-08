# module-format-interop-demo

This demo shows how different bundlers treat a default import, in the scope of a package.json with `"type": "module"`, of an ESM-transpiled-to-CommonJS module.

## Bundled source code

[**`package.json`**](./package.json):

```json
{
  "type": "module"
}
```

[**`src/index.ts`**](./src/index.ts) / [**`src/index.js`**](./src/index.js):

```ts
import pkg from "./vendor/pkg/index.js";
console.log(pkg);
```

[**`vendor/pkg/index.js`**](./vendor/pkg/index.js):

```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = "pkg";
```

## Discussion

Historically, most bundlers have generated code that results in the string `"pkg"` being logged to the console—that is, the default import of the ESM-transpiled-to-CommonJS module binds to `exports.default` in the CommonJS module. This behavior is triggered by the presence of `exports.__esModule`, which indicates that the module was originally written with ESM syntax  (`export default "pkg"` in this case). Parcel, and Rollup with `@rollup/plugin-commonjs`, demonstrate this behavior:

```sh
❯ npm run parcel-js

> module-format-interop-demo@1.0.0 parcel-js
> parcel build src/index.js --dist-dir dist && node dist/index.js

✨ Built in 370ms

dist/index.js    150 B    35ms
pkg

❯ npm run rollup-js

> module-format-interop-demo@1.0.0 rollup-js
> rollup -i src/index.js -o dist/index.js -f iife -p @rollup/plugin-commonjs && node dist/index.js


src/index.js → dist/index.js...
created dist/index.js in 30ms
pkg
```

However, Node.js does not try to detect `exports.__esModule` and instead binds the default export to `module.exports` in the CommonJS module, resulting in `{ default: 'pkg' }` being logged to the console:

```sh
❯ npm run node-js

> module-format-interop-demo@1.0.0 node-js
> node src/index.js

{ default: 'pkg' }
```

In response, esbuild and Webpack adopted this behavior to align with Node.js when the importing file has a `.mjs` extension, or is in scope of a package.json with `"type": "module"`.

```sh
❯ npm run esbuild-js

> module-format-interop-demo@1.0.0 esbuild-js
> esbuild --bundle src/index.js --outfile=dist/index.js && node dist/index.js


  dist/index.js  1.7kb

⚡ Done in 21ms
{ default: 'pkg' }

❯ npm run webpack-js

> module-format-interop-demo@1.0.0 webpack-js
> webpack --config webpack.js.config.js && node dist/index.js

asset index.js 256 bytes [emitted] [minimized] (name: main)
./src/index.js 59 bytes [built] [code generated]
./src/vendor/pkg/index.js 102 bytes [built] [code generated]
webpack 5.91.0 compiled successfully in 316 ms
{ default: 'pkg' }
```

While `@rollup/plugin-commonjs` can be configured to bind the default export to `module.exports` in the CommonJS module with the `defaultIsModuleExports`, only Webpack and esbuild trigger this behavior based on file extension or package.json `"type"`.

esbuild, which has built-in support for TypeScript, applies the same behavior to `.mts` and `.ts` as it does to `.mjs` and `.js` files, respectively. On the other hand, Webpack only applies this behavior to JavaScript files, since it doesn’t know anything about TypeScript file extensions natively.

```sh
❯ npm run esbuild-ts

> module-format-interop-demo@1.0.0 esbuild-ts
> esbuild --bundle src/index.ts --outfile=dist/index.js && node dist/index.js


  dist/index.js  1.7kb

⚡ Done in 16ms
{ default: 'pkg' }

❯ npm run webpack-ts

> module-format-interop-demo@1.0.0 webpack-ts
> webpack --config webpack.ts.config.js && node dist/index.js

asset index.js 203 bytes [emitted] [minimized] (name: main)
./src/index.ts 59 bytes [built] [code generated]
./src/vendor/pkg/index.js 102 bytes [built] [code generated]
webpack 5.91.0 compiled successfully in 1274 ms
pkg
```

[A discussion](https://github.com/webpack/webpack/issues/17288) about making Webpack treat TypeScript and JavaScript file module formats consistently is ongoing.

## Conclusion

Since different (popular) bundlers intentionally produce different results for default imports, TypeScript should be configurable to match its type checking behavior with the bundler’s interop behavior. Currently, type checking `src/index.ts` with the recommended settings for esbuild shows incorrect types and errors.

Additionally, Webpack (or Webpack loaders that handle TypeScript) will need to be patched to treat TypeScript and JavaScript file module formats consistently.
