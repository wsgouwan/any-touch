const chalk = require('chalk');
const {
    terser
} = require('rollup-plugin-terser');
const { build, walkPackageDirs } = require('./build');

console.log(chalk.blue('正在生成es模块!'));
walkPackageDirs((dirName) => {
    build({
        input: `./packages/${dirName}/src/index.ts`,
        output: {
            file: `./packages/${dirName}/dist/index.es.js`,
            format: 'esm',
            sourcemap: true,
        },
        external: id => ['any-event', 'any-touch', 'tslib'].includes(id) || /^@/.test(id),
        tsConfig: {
            target: 'ES6',
            module: "ESNEXT",
        }, terser: terser({
            output: {
                comments: false
            }
        })
    });
});