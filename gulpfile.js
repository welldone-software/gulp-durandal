(function(){'use strict';})();

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    externalPlugins = {
        durandaljs : require('./index')
    };

gulp.task('jshint', function(){
    gulp.src(['test/*_test.js', './gulpfile.js', './index.js'])
        .pipe(plugins.jshint({
            globals: ['require', 'module', 'console']
        }))
        .pipe(plugins.jshint.reporter('default'));
});

gulp.task('nodeunit', function(){
    gulp.src('test/*_test.js')
        .pipe(plugins.nodeunit());
});

gulp.task('clean', function(){
//    gulp.src('test/tmp', {read: false})
//        .pipe(plugins.clean({force: true}));
//
//    cannot use gulp-clean here because of a bug where cleaning and rebuilding doesn't rewrite the rebuilt files.
});

gulp.task('durandaljs', function(){
    externalPlugins
        .durandaljs({
            baseDir: 'test/fixtures/Bower Projects/external/app',
            output: 'main.js',
            almond: false
        })
        .pipe(gulp.dest('./test/tmp/simpleOutput1'));
});

gulp.task('prepare', ['jshint', 'clean']);
gulp.task('test', ['durandaljs', 'nodeunit']);

gulp.task('default', ['prepare', 'test']);