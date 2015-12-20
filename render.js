// Styles

// Every object created will have an unique id called 'UID'.
var setUniqueId = (function() {
  var called = false;
  var id = 0;
  return function() {
    if (called) return;
    called = true;
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
  };
})();

/*
  Assumptions:
  preRender, postRender
  this.templateData
  this.template  -> a handlebars compiled template
  this.el
*/

/*
  Example usage:
  _.extend(Backbone.View.prototype, mixin);
*/
var mixin = {
  render: function() {
    var data = this.templateData ? this.templateData() : {};

    if (this.preRender)
      this.preRender(data);

    if (this.template) {

      if (this.__renderArgs) {
        for (var k in this.__renderArgs)
          data[k] = this.__renderArgs[k];
      }

      this.el.innerHTML = this.template(data);

      var placeholders = this.el.getElementsByClassName('__placeholder-el');
      for (var i=0; i < placeholders.length; i++) {
        var placeholder = placeholders[i];
        var uid = parseInt(placeholder.dataset.uid);
        var renderObj;
        for (var k in data) {
          if (data.hasOwnProperty(k)) {
            var val = data[k];
            if (typeof val == 'object' && val.UID == uid)
              renderObj = val;
          }
        }
        if (renderObj)
          this.el.replaceChild(renderObj.render().el, placeholder);
      }
    }

    if (this.postRender)
      this.postRender(data);
    return this;
  }
};

var registerHelper = function(Handlebars) {
  /*
    Registers a Handlebars {{render}} helper. 'render' takes an object
    and can also be passed named arguments.

    Example:
    {{render puppy breed=poodle age=1.5}}
  */
  Handlebars.registerHelper('render', function(renderObj, options) {
    if (typeof renderObj == 'undefined')
      throw new Error('{{render <obj>}} was passed undefined.');
    Object.defineProperty(renderObj, '__renderArgs', {
      configurable: true,
      get: function() {return options.hash;}
    });
    var div = '<div class="__placeholder-el" data-uid="' + renderObj.UID + '"></div>';
    return new Handlebars.SafeString(div);
  });
};

module.exports = {
  setUniqueId: setUniqueId,
  mixin: mixin,
  registerHelper: registerHelper
};
