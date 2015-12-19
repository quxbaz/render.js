// Styles
require('./lib/normalize-css/normalize.css')
require('./less/style.less');
var $ = require('jquery');
var hb = require('handlebars');
var _  = require('underscore');

// App scripts
var App = require('./src/app.js');

function fmt(format) {
  var args = Array.prototype.slice.call(arguments, 1);
  return format.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
}

// Defines a unique id 'UID' on every object.
(function() {
  var id = 0;
  Object.defineProperty(Object.prototype, '__uniqueId', {
    writable: true
  });
  Object.defineProperty(Object.prototype, 'UID', {
    get: function() {
      if (this.__uniqueId == undefined)
        this.__uniqueId = id++;
      return this.__uniqueId;
    }
  });
})();

Backbone.View.prototype.render = function() {
  var data = this.templateData ? this.templateData() : {};
  if (this.preRender)
    this.preRender(data);
  if (this.template)
    this.$el.html(this.template(_.extend(data, this.__renderArgs)));
  $('.placeholder-render-obj', this.el).each(function() {
    var uid = $(this).data('uid');
    var renderObj = _.find(_.values(data), function(val) {
      if (typeof val == 'object')
        return val.UID == uid;
    });
    if (renderObj)
      $(this).replaceWith(renderObj.render());
  });
  if (this.postRender)
    this.postRender(data);
  return this.$el;
};

hb.registerHelper('render', function(renderObj, options) {
  /*
    @renderObj: <TODO: Description>
  */

  // Sets a property on the renderObj to capture any arguments passed
  // to it in the template.
  // Example: {{render myBook chapters=8 pages=200}}
  Object.defineProperty(renderObj, '__renderArgs', {
    configurable: true,
    get: function() {
      return options.hash;
    }
  });

  var div = fmt(
    '<div class="{0}" data-uid="{1}"></div>',
    'placeholder-render-obj',
    renderObj.UID
  );
  return new hb.SafeString(div);
});

document.addEventListener('DOMContentLoaded', function() {
  var app = new App();
  app.load().then(function() {
    app.run();
  });
});
