(function(){'use strict';})();

var gulp = require('gulp'),
    _ = require('lodash'),
    plugins = require('gulp-load-plugins')(),
    print = require('gulp-print').default,
    del = require('del'),
    externalPlugins = {
        durandal : require('./index')
    },
    outputDir = './test/tmp';

var testOptions = {
    baseDir: ['test/fixtures/HTML StarterKit/app', 'test/fixtures/HTML Samples/app'],
    minify: [false, true],
    almond: [false, true],
    require: [true, 'main'],
    extraModules: ['plugins/widget', 'plugins/dialog', 'plugins/router', 'transitions/entrance']
};

var generateTestTasks = function(){
    var tasks = {};
    var testGenerators = [];

    var simpleOutput = function(tasks){
        var testNum = 0;
        _.each(testOptions.baseDir, function(baseDir){
            testNum++;
            var taskName = 'simpleOutput' + testNum;
            tasks[taskName] = {
                baseDir: baseDir
            };
        });
    };

    var requireOutput = function(tasks){
        var testNum = 0;
        _.each(testOptions.baseDir, function(baseDir){
            _.each(testOptions.require, function(require){
                testNum++;
                var taskName = 'requireOutput' + testNum;
                tasks[taskName] = {
                    baseDir: baseDir,
                    require: require,
                    extraModules: testOptions.extraModules,
                    durandalDynamicModules: false
                };
            });
        });
    };

    var almondOutput = function(tasks){
        var testNum = 0;
        _.each(testOptions.baseDir, function(baseDir){
            _.each(testOptions.require, function(require){
                testNum++;
                var taskName = 'almondOutput' + testNum;
                tasks[taskName] = {
                    baseDir: baseDir,
                    almond: true,
                    require: require,
                    extraModules: testOptions.extraModules,
                    durandalDynamicModules: false
                };
            });
        });
    };

    var minifyTest = function(tasks){
        var testNum = 0;
        _.each(testOptions.baseDir, function(baseDir){
            _.each(testOptions.almond, function(almond){
                testNum++;
                var taskName = 'minifyTest' + testNum;
                tasks[taskName] = {
                    baseDir: baseDir,
                    almond: almond,
                    minify: true
                };
            });
        });
    };

    var pathTest = function(tasks){
        var testNum = 0,
            taskName;

        _.each(testOptions.almond, function(almond){
            testNum++;

            taskName = 'pathTestSimple' + testNum;
            tasks[taskName] = {
                baseDir: 'test/fixtures/Simple Bower Project/app',
                output: 'main.js',
                almond: almond
            };

            taskName = 'pathTestMain2' + testNum;
            tasks[taskName] = {
                baseDir: 'test/fixtures/Bower Projects/app',
                main: 'main2.js',
                output: 'main.js',
                almond: almond,
                require: 'main2',
                durandalDynamicModules: false
            };

            taskName = 'pathTestNested' + testNum;
            tasks[taskName] = {
                baseDir: 'test/fixtures/Bower Projects/nested/app3',
                main: 'main2.js',
                output: 'main.js',
                almond: almond,
                require: 'main2'
            };

            taskName = 'pathTestExternal' + testNum;
            tasks[taskName] = {
                baseDir: 'test/fixtures/Bower Projects/external/app',
                output: 'main.js',
                almond: almond
            };
        });
    };

    var errorTest = function(tasks){
        var taskName = 'errorTest';

        tasks[taskName] = {
            baseDir: 'test/fixtures/Broken Project/app',
            output: 'main.js'
        };
    };

    var adapterTest = function(tasks){
        var testNum = 0;
        _.each(testOptions.baseDir, function(baseDir){
            testNum++;
            var taskName = 'adapterTest' + testNum;
            tasks[taskName] = {
                baseDir: baseDir,
                rjsConfigAdapter: function(rjsConfig){
                    rjsConfig.generateSourceMaps = false;
                    return rjsConfig;
                }
            };
        });
    };

    var cssRequireTest = function(tasks){
        var testNum = 0;
        _.each(testOptions.almond, function(almond){
            testNum++;
            var taskName = 'cssRequireTest' + testNum;
            tasks[taskName] = {
                baseDir: 'test/fixtures/Bower Project Css In App/app',
                almond: almond
            };
        });
    };

    //TODO test of "main: null"
//    var noMain = function(tasks){
//        var taskName = 'noMain';
//        tasks[taskName] = {
//            baseDir: 'test/fixtures/Simple Bower Project/app',
//            main: null
//        };
//    };

    var excludeTest = function(tasks){
        var taskName = 'excludeTest';
        tasks[taskName] = {
            baseDir: 'test/fixtures/Bower Project Css In App/app',
            moduleFilter: function(m){
                m = m ||'';
                return m.lastIndexOf('css') + 3 != m.length;
            }
        };
    };

    //comment out not needed tests
    testGenerators.push(simpleOutput);
    testGenerators.push(requireOutput);
    testGenerators.push(almondOutput);
    testGenerators.push(minifyTest);
    testGenerators.push(pathTest);
    testGenerators.push(errorTest);
    testGenerators.push(adapterTest);
    testGenerators.push(cssRequireTest);
    testGenerators.push(excludeTest);

    _.each(testGenerators, function(generator){
        generator(tasks);
    });

    return tasks;
};

var testTasks = generateTestTasks();
_.each(testTasks, function(task, taskName){
    gulp.task(taskName, function(){
        return externalPlugins.durandal(task)
            .pipe(print(function(filename){return taskName + ': ' + filename;}))
            .pipe(gulp.dest(outputDir + '/' + taskName));
    });
});

gulp.task('jshint', function(){
    var stream = gulp.src(['test/*_test.js', './gulpfile.js', './index.js'])
        .pipe(plugins.jshint({
            globals: ['require', 'module', 'console']
        }))
        .pipe(plugins.jshint.reporter('default'));

    return stream;
});

gulp.task('nodeunit', function(){
    var stream = gulp.src('test/*_test.js')
        .pipe(plugins.nodeunit({
            reporter: 'junit',
            reporterOptions: {
                output: 'test/reporting'
            }
        }));

    return stream;
});

gulp.task('clean', function(){
    return del('test/tmp');
});

gulp.task('durandal', gulp.series(_.keys(testTasks)));

gulp.task('default', gulp.series(
        'clean',
        'jshint',
        'durandal',
        'nodeunit'));