define(['knockout', 'plugins/dialog'], function(ko, dialog){
    return {
        name: ko.observable(),
        sayHello: function() {
            dialog.showMessage('Hello ' + this.name() + '! Nice to meet you.', 'Greetings');
        }
    };
});