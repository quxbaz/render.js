/*
  render.js
  Handlebars tool for rendering sub-templates. No dependencies besides
  Handlebars.
*/

function has(obj, key) {
  return obj.hasOwnProperty(key);
}

function each(obj, fn, context) {
  if (Array.isArray(obj)) {
    for (var i=0; i < obj.length; i++)
      fn.call(context, obj, i);
  }
  else {
    for (var k in obj) {
      if (obj.hasOwnProperty(k))
        fn.call(context, obj[k], k);
    }
  }
}

function extend(a, b) {
  if (typeof b != 'object')
    return a;
  each(b, function(val, key) {
    a[key] = val;
  });
  return a;
}

function values(obj) {
  var vals = [];
  for (var k in obj) {
    if (has(obj, k))
      vals.push(obj[k]);
  }
  return vals;
}

function find(list, pred) {
  for (var i=0; i < list.length; i++) {
    if (pred(list[i]))
      return list[i];
  }
  return undefined;
}

// Every object created from the prototype will have an unique id
// called 'UID'.
var setUniqueId = (function() {
  var id = 0;
  return function(prototype) {
    Object.defineProperty(prototype, '__uniqueId', {
      writable: true
    });
    Object.defineProperty(prototype, 'UID', {
      get: function() {
        if (this.__uniqueId == undefined)
          this.__uniqueId = id++;
        return this.__uniqueId;
      }
    });
  };
})();

/*
  Adds the methods preRender, postRender, renderContent, and render to
  the prototype. The prototype should supply a method templateData
  that provides the render function any data it needs to render the
  template. The object instance created from the prototype should have
  an object this.el containing the DOM object that represents it.
*/
var mixin = function(prototype) {

  prototype.render = function(data) {
    var data = data || (this.templateData ? this.templateData() : {});
    return this.postRender(this.renderContent(this.preRender(data)));
  };

  prototype.preRender = prototype.preRender || function(data){return data};

  prototype.renderContent = prototype.renderContext || function(data) {
    if (!this.template)
      return data;
    extend(data, this.__renderArgs);
    this.el.innerHTML = this.template(data);
    each(this.el.getElementsByClassName('__render-placeholder'), function(el) {
      var uid = parseInt(el.dataset.uid);
      var renderObj = find(values(data), function(val) {
        return typeof val == 'object' && val.UID == uid;
      });
      renderObj && this.el.replaceChild(renderObj.render().el, el);
    }, this);
    return data;
  };

  prototype.postRender = prototype.postRender || function(data){return this};

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
      get: function() {return options.hash}
    });
    var div = '<div class="__render-placeholder" data-uid="' + renderObj.UID + '"></div>';
    return new Handlebars.SafeString(div);
  });
};

function setup(Handlebars, prototype) {
  if (!Handlebars)
    throw new Error('You must provide the Handlebars object to register a helper on.');
  if (!prototype)
    throw new Error('You must provide a prototype object to mixin.');
  setUniqueId(prototype);
  registerHelper(Handlebars);
  mixin(prototype);
}

module.exports = {
  setUniqueId: setUniqueId,
  mixin: mixin,
  registerHelper: registerHelper,
  setup: setup
};
