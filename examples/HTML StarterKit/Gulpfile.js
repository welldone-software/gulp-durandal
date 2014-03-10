'use strict';

var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    rename = require('gulp-rename'),
    htmlReplace = require('gulp-html-replace'),
    durandal = require(/*'gulp-durandal'*/ '../../index');

var dest = '../dist/HTML StarterKit';

var extraModules = [
    'plugins/widget',
    'plugins/dialog',
    'plugins/router',
    'transitions/entrance'
];

﻿gulp.task('default', ['build', 'watch']);

﻿gulp.task('build', ['statics', 'durandal', 'durandal-almond', 'index-almond']);

﻿gulp.task('watch', function () {
    gulp.watch(['app/**/*', 'css/**/*'], ['build']); //rebuild durandal when sources change
});

gulp.task('statics', function(){
    return gulp.src(['**/*.png', '**/*.css', '**/*.ttf', '**/*.woff',
            'index.html', '**/require.js'])
        .pipe(gulp.dest(dest));
});

﻿gulp.task('durandal', function(){
    return durandal({
            // needed since not explicitly required by any 'define([...])',
            // but rather loaded dynamically by convention
            extraModules: extraModules
        })
        .pipe(gulp.dest(dest + '/app'))
        .pipe(livereload());
});

﻿gulp.task('durandal-almond', function(){
    return durandal({
            // needed since not explicitly required by any 'define([...])',
            // but rather loaded dynamically by convention
            extraModules: extraModules,
            almond: true
        })
        .pipe(gulp.dest(dest))
        .pipe(livereload());
});

gulp.task('index-almond', function(){
    return gulp.src('index.html')
        .pipe(htmlReplace('js', 'main.js'))
        .pipe(rename('index-almond.html'))
        .pipe(gulp.dest(dest));
});