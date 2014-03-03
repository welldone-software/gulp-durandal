requirejs.config({
    paths: {
        'text': '../../bower_components/requirejs-text/text',
        'durandal':'../../bower_components/durandal/js',
        'plugins' : '../../bower_components/durandal/js/plugins',
        'knockout': '../../bower_components/knockout.js/knockout',
        'jquery': '../../bower_components/jquery/jquery'
        //'external-shell': '../ext/external-shell-generator'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        }
    }
});

define(['durandal/system', 'durandal/app', 'durandal/viewLocator'],  function (system, app, viewLocator) {
    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'Durandal Simple Project';

    app.start().then(function () {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //Show the app by setting the root view model for our application.
        app.setRoot('shell');
    });
});