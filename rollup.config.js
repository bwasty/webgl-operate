import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import glsl from 'rollup-plugin-glsl';

const pkg = require('./package.json');
const glob = require('glob');

const libraryName = 'webgl-operate';

export default {
    experimentalCodeSplitting: true,
    // input: `source/${libraryName}.ts`,
    input: glob.sync('source/**/*.ts'),
    output: [
        // { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
        // { file: pkg.module, format: 'esm', sourcemap: true },
        { dir: 'lib', format: 'esm', sourcemap: true },
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: ['rxjs'],
    watch: {
        include: 'source/**',
    },
    plugins: [
        // Allow json resolution
        json(),
        glsl({
            include: ['source/**/*.vert', 'source/**/*.frag'],
        }),
        // Compile TypeScript files
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {
                noUnusedLocals: true,
                declaration: true,
                removeComments: false
            }
        }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve(),

        // Resolve source maps to the original source
        sourceMaps(),
    ],
}
