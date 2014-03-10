var fs = require('fs'),
    path = require('path'),
    requirejs = require('requirejs'),
    es = require('event-stream'),
    glob = require('glob'),
    _ = require('lodash')._,
    gutil = require('gulp-util');

var PLUGIN_NAME = 'gulp-durandaljs';

module.exports = function gulpDurandaljs(userOptions){
    var _s = es.pause(),

        durandalDynamicTransitions = ['transitions/entrance'],
        durandalDynamicPlugins = ['plugins/dialog', 'plugins/history','plugins/http',
            'plugins/observable', 'plugins/router', 'plugins/serializer', 'plugins/widget'],

        defOptions = {
            baseDir: 'app',
            main: 'main.js',
            extraModules: [],
            durandalDynamicModules: true,
            verbose : false,
            output: undefined,
            minify: false,
            require : undefined,
            almond: false,
            moduleFilter: function(m){return true;},
            textModuleExtensions : ['.json', '.html', '.txt']
        },

        options = _.defaults(userOptions, defOptions),

        baseDir =  options.baseDir,

        mainFile = path.join(baseDir, options.main),

        mainFileContent = fs.readFileSync(mainFile, {encoding: 'utf-8'}),

        almondWrapper = (function(){
            var almond = options.almond,
                almondPath = typeof(almond) === 'string' ? almond : path.join(__dirname, 'res/custom-almond.js');

            if(!almond){
                return undefined;
            }

            return {
                start: '(function() {\n' + fs.readFileSync(almondPath, {encoding: 'utf-8'}),
                end: '}());'
            };

        })(),

        allModules = (function(){
            var stripExtension = function(p){ return p.substr(0, p.length - path.extname(p).length); },
                fixSlashes = function(p){ return p.replace(new RegExp('\\\\','g'),'/'); },
                expand = function(p){ return glob.sync(path.normalize(path.join(baseDir, p))); },
                relativeToBaseDir = path.relative.bind(path, baseDir),
                jsFiles = _.unique( _.flatten([ mainFile, expand('/**/*.js') ])),
                jsModules = jsFiles.map(relativeToBaseDir).map(stripExtension),
                textFiles = _.flatten(_.map(options.textModuleExtensions, function(ext){return expand('/**/*'+ext);})),
                textModules = textFiles.map(relativeToBaseDir).map(function(m){ return 'text!' + m; }),
                scannedModules = {js: jsModules, text: textModules},
                dynamicModules = options.durandalDynamicModules ? [].concat(
                    mainFileContent.match(/['"]?plugins['"]?\s.*?:/i) ? durandalDynamicPlugins : [],
                    mainFileContent.match(/['"]?transitions['"]?\s.*?:/i) ? durandalDynamicTransitions: []
                ) : [];

            if(options.verbose){console.log('Gulpfile added the following modules dynamicly: ' + dynamicModules)}

            return _.flatten([scannedModules.js, options.extraModules || [], dynamicModules, scannedModules.text])
                .filter(options.moduleFilter).map(fixSlashes);
        })(),

        insertRequireModules = (function(){
            if(typeof(options.require) === 'string' || _.isArray(options.require)){
                return  _.flatten([options.require]);
            }
            else if(options.require === true || (options.almond && options.require !== false)){
                return [allModules[0]];
            }
            return undefined;
        })(),
        output = options.output || path.basename(mainFile),
        rjsCb = function(text, sourceMapText){
            _s.resume();

            _s.write(new gutil.File({
                path: output,
                contents: new Buffer(text)
            }));

            if(sourceMapText){
                _s.write(new gutil.File({
                    path: output + '.map',
                    contents: new Buffer(sourceMapText)
                }));
            }

            _s.end();
        },
        errCb = function(err){
            _s.resume();
            _s.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
            _s.end();
        };

    var rjsConfig = {
        logLevel: options.verbose ? 0 : 4,
        baseUrl : baseDir,
        mainConfigFile: mainFile,
        include : allModules,
        out: rjsCb,
        optimize: options.minify ? 'uglify2' : 'none',
        preserveLicenseComments: !options.minify,
        generateSourceMaps : true,
        insertRequire : insertRequireModules,
        wrap: almondWrapper
    };

    requirejs.optimize(rjsConfig, null, errCb);

    _s.on('error', function(e){
        gutil.log('Durandal ' + gutil.colors.red(e.message));
    });
    
    return _s;
};
