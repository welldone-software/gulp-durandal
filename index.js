var fs = require('fs'),
    path = require('path'),
    requirejs = require('requirejs'),
    es = require('event-stream'),
    glob = require('glob'),
    _ = require('lodash')._,
    gutil = require('gulp-util');

var PLUGIN_NAME = 'gulp-durandaljs',
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
    };


module.exports = function gulpDurandaljs(userOptions){
    var _s = es.pause(),

        options = _.defaults(userOptions, defOptions),

        baseDir =  options.baseDir,

        mainFile = path.join(baseDir, options.main),

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

        dynamicModules = (function(){
            var  mainFileContent = fs.readFileSync(mainFile, {encoding: 'utf-8'}),
                 plugins = mainFileContent.match(/['"]?plugins['"]?\s*:/) ? durandalDynamicPlugins : [],
                 transitions = mainFileContent.match(/['"]?transitions['"]?\s*:/) ? durandalDynamicTransitions : [];

            return _.flatten(plugins, transitions);
        }),

        scannedModuels = (function(){
            var stripExtension = function(p){ return p.substr(0, p.length - path.extname(p).length); },
                expand = function(p){ return glob.sync(path.normalize(path.join(baseDir, p))); },
                relativeToBaseDir = path.relative.bind(path, baseDir),
                jsFiles = _.unique( _.flatten([ mainFile, expand('/**/*.js') ])),
                jsModules = jsFiles.map(relativeToBaseDir).map(stripExtension),
                textFiles = _.flatten(_.map(options.textModuleExtensions, function(ext){return expand('/**/*'+ext);})),
                textModules = textFiles.map(relativeToBaseDir).map(function(m){ return 'text!' + m; }),
                scannedModules = {js: jsModules, text: textModules};
                
            return scannedModules;
        }),

        allModules = (function(){
            var fixSlashes = function(p){ return p.replace(new RegExp('\\\\','g'),'/'); };
                modules = 
                    _.flatten([scannedModules.js, options.extraModules || [], dynamicModules, scannedModules.text])
                    .map(fixSlashes);
                    .filter(options.moduleFilter);

            return _.unique(modules);
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
        
        rjsCb = function(text, sourceMapText){

            var output = options.output || path.basename(mainFile),
                mapOutput = output + '.map';

            _s.resume();

            text += '//# sourceMappingURL=' + path.basename(mapOutput);

            _s.write(new gutil.File({
                path: output,
                contents: new Buffer(text)
            }));

            if(sourceMapText){
                _s.write(new gutil.File({
                    path: mapOutput,
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
