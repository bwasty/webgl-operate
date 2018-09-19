var glob = require('glob');

// src: https://stackoverflow.com/a/43611910/2858790
function getEntries() {
    // return fs.readdirSync('./source/')
    return glob.sync('source/**/*.ts')
        .filter(
            (file) => file.match(/.*\.ts$/)
        )
        .map((file) => {
            file = file.replace('source/', '');
            return {
                name: file.substring(0, file.length - 3),
                path: file
            }
        }).reduce((memo, file) => {
            memo[file.name] = file.path
            return memo;
        }, {})
}

const entries = getEntries();
console.log(entries);

module.exports = (env, options) => {

    const config = require('./webpack.config');

    config.cache = false;
    config.output.path = __dirname + '/lib-esm';
    config.entry = entries;

    config.module.rules[0].use.options.compilerOptions.module = 'es6';
    config.module.rules[0].use.options.compilerOptions.outDir = 'lib-esm';
    config.module.rules[0].use.options.compilerOptions.noUnusedLocals = true;
    config.module.rules[0].use.options.compilerOptions.declaration = true;
    config.module.rules[0].use.options.compilerOptions.removeComments = false;

    config.output.library = undefined;
    config.output.libraryTarget = 'umd';

    // DISABLE_ASSERTIONS: JSON.stringify(options.mode === 'development'),
    config.plugins[0].definitions.DISABLE_ASSERTIONS = JSON.stringify(false);
    // Log verbosity levels: debug = 3, info = 2, warn = 1, error = 0
    config.plugins[0].definitions.LOG_VERBOSITY_THRESHOLD = JSON.stringify(options.mode === 'development' ? 3 : 2);

    return config;
};
