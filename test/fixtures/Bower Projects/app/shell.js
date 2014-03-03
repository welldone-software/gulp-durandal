define(function (require) {
    var ko = require('knockout'),
        dialog = require('plugins/dialog');

    return {
        name: ko.observable(),
        sayHello: function() {
            dialog.showMessage('Hello ' + this.name() + '! Nice to meet you.', 'Greetings');
        }
    };
});