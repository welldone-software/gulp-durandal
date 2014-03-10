'use strict';

var gulp = require('gulp'),
    livereload = require('gulp-livereload'),
    rename = require('gulp-rename'),
    htmlReplace = require('gulp-html-replace'),
    durandal = require(/*'gulp-durandal'*/ '../../index');

var dest = '../dist/simple',
    destAlmond = '../dist/almond';


//
// simple build
//
// Relying on conventions and default options.
// Outputting all resource files into dest/**/* and all app files
// as a single dest/app/main.js that contains all the scripts and 
// views.
//
// This combined file uses the original html file and also needs 
// require.js, so both are also copied to the destintaion.
//

gulp.task('durandal', function(){
    return durandal()
        .pipe(gulp.dest(dest + '/app'))
        .pipe(livereload());
});

gulp.task('statics', function(){
    return gulp.src(['**/*.png', '**/*.css', '**/*.ttf', '**/*.woff', 'index.html', '**/require.js'])
        .pipe(gulp.dest(dest))
        .pipe(livereload());
});

gulp.task('build-simple', ['statics', 'durandal']);

//
// Almone build
// 
// This will create a single output file with no need for require.js.
// This option also changes some other settings internaly, but hopfully
// they remain transparent to you.
//
// Note however that the html file also needs to change to support almond:
// we need to changed the script tag in the html since we now only have a single file
// and have no need for require.js and no support for data-main.
//
// Generate a new html file named 'index-almond.html' with the script tag changed.
//
//  Change from
//      <script src="path/to/require.js" data-main="app/main"></script>
//  to 
//      <script src="path/to/generated/containing/almond.and.app.js"></script>
//
//
gulp.task('durandal-almond', function(){
    return durandal({
            almond: true
        })
        .pipe(gulp.dest(destAlmond))
        .pipe(livereload());
});

gulp.task('index-almond', function(){
    return gulp.src('index.html')
        .pipe(htmlReplace('js', 'main.js'))
        .pipe(rename('index-almond.html'))
        .pipe(gulp.dest(destAlmond))
        .pipe(livereload());
});

gulp.task('statics-almond', function(){
    return gulp.src(['**/*.png', '**/*.css', '**/*.ttf', '**/*.woff'])
        .pipe(gulp.dest(destAlmond))
        .pipe(livereload());
});

gulp.task('build-almond', ['statics-almond', 'index-almond', 'durandal-almond']);


//
// Rebuild durandal when sources change. 
// Naive implementation, but good enough for an example.
//
﻿gulp.task('watch', function () {
    gulp.watch(['app/**/*'], ['durandal-almond', 'durandal']); 
});



gulp.task('default', ['build-simple', 'build-almond', 'watch']);




