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
        rjsConfigAdapter : function(cfg){return cfg;},
        almond: false,
        moduleFilter: function(m){return true;},
        pluginMap: {
            '.html': 'text',
            '.json': 'text',
            '.txt': 'text',
            '.css': 'css'
        }
    };


module.exports = function gulpDurandaljs(userOptions){
    var stream = es.through(),

        options = _.defaults(userOptions || {}, defOptions),

        baseDir =  options.baseDir,

        mainFile = options.main ? path.join(baseDir, options.main) : undefined,

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
            if(!mainFile){
                return options.durandalDynamicModules ?
                    [].concat(durandalDynamicPlugins, durandalDynamicTransitions) : [];
            }

            var  mainFileContent = fs.readFileSync(mainFile, {encoding: 'utf-8'}),
                 plugins = mainFileContent.match(/['"]?plugins['"]?\s*:/) ? durandalDynamicPlugins : [],
                 transitions = mainFileContent.match(/['"]?transitions['"]?\s*:/) ? durandalDynamicTransitions : [];

            return [].concat(plugins, transitions);
        })(),

        scannedModules = (function(){
            var stripExtension = function(p){ return p.substr(0, p.length - path.extname(p).length); },
                expand = function(p){ return glob.sync(path.normalize(path.join(baseDir, p))); },
                relativeToBaseDir = path.relative.bind(path, baseDir),
                jsFiles = (function() {
                    var expandedJsFiles = _.flatten([ expand('/**/*.js') ]);
                    return _.unique( mainFile ? [mainFile].concat(expandedJsFiles) : expandedJsFiles );
                })(),
                jsModules = jsFiles.map(relativeToBaseDir).map(stripExtension),
                pluggedFiles = _.flatten( _.map( _.keys(options.pluginMap) , function(ext){return expand('/**/*'+ext);} ) ),
                pluggedModules = pluggedFiles.map(relativeToBaseDir).map(function(m){ return options.pluginMap[path.extname(m)] + '!' + m; });

            return {js: jsModules, plugged: pluggedModules};
        })(),

        allModules = (function(){
            var fixSlashes = function(p){ return p.replace(new RegExp('\\\\','g'),'/');},
                modules =
                    _.flatten([scannedModules.js, options.extraModules || [], dynamicModules, scannedModules.plugged])
                    .map(fixSlashes),
                include = _.filter(modules, options.moduleFilter),
                exclude = _.reject(modules, options.moduleFilter);

            return { include:_.unique(include), exclude:_.unique(exclude) };
        })(),

        insertRequireModules = (function(){
            if(typeof(options.require) === 'string' || _.isArray(options.require)){
                return  _.flatten([options.require]);
            }
            else if(options.require === true || (options.almond && options.require !== false)){
                return [allModules.include[0]];
            }
            return undefined;
        })(),
        
        rjsCb = function(text, sourceMapText){

            var output = options.output || path.basename(mainFile),
                mapOutput = output + '.map';

            if(sourceMapText){
                text += '//# sourceMappingURL=' + path.basename(mapOutput);
            }

            stream.write(new gutil.File({
                path: output,
                contents: new Buffer(text)
            }));

            if(sourceMapText){
                stream.write(new gutil.File({
                    path: mapOutput,
                    contents: new Buffer(sourceMapText)
                }));
            }

            stream.end();
        },
        
        errCb = function(err){
            stream.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
        };

    var rjsConfig = {
        logLevel: options.verbose ? 0 : 4,
        baseUrl : baseDir,
        mainConfigFile: mainFile,
        include: allModules.include,
        exclude: allModules.exclude,
        out: rjsCb,
        optimize: options.minify ? 'uglify2' : 'none',
        preserveLicenseComments: !options.minify,
        generateSourceMaps : true,
        insertRequire : insertRequireModules,
        wrap: almondWrapper
    };

    rjsConfig = options.rjsConfigAdapter(rjsConfig);

    requirejs.optimize(rjsConfig, null, errCb);

    stream.on('error', function(e){
        gutil.log('Durandal ' + gutil.colors.red(e.message));
        stream.end();
    });
    
    return stream;
};
