
module.exports = require('./webpack.config');

module.exports.entry = {
    '../dist/webgl-operate': ['require.ts', 'polyfill.ts', 'webgl-operate.ts'],
    '../dist/webgl-operate.min': ['require.ts', 'polyfill.ts', 'webgl-operate.ts'],
    '../dist/webgl-operate.slim': ['require.ts', 'polyfill.ts', 'webgl-operate.slim.ts'],
    '../dist/webgl-operate.slim.min': ['require.ts', 'polyfill.ts', 'webgl-operate.slim.ts']
};

module.exports.module.rules[0].use = {
    loader: 'ts-loader',
    options: {
        compilerOptions: {
            removeComments: true
        }
    }
};
