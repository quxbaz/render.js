var _ = require('./lib/underscore/underscore');
require('./lib/chai/chai').should();
var Handlebars = require('./lib/handlebars/handlebars');
var $ = require('./lib/jquery/dist/jquery');
var render = require('../render');

describe('render.js', function() {

  describe('.setUniqueId', function() {

    before(function() {
      render.setUniqueId();
    });

    it("should set a 'UID' property on an object.", function() {
      var a = {};
      a.UID.should.not.eql(undefined);
      var b = {};
      b.UID.should.not.eql(undefined);
    });

    it("should set only unique ids.", function() {
      var ids = _.times(1000, function() {
        return new Object().UID;
      });
      _.uniq(ids).length.should.eql(ids.length);
    });

  });

  describe("render mixin", function() {

    var View;

    before(function() {
      render.setUniqueId();
      render.registerHelper(Handlebars);
    });

    beforeEach(function() {
      View = function(data, html) {
        this.el = document.createElement('div');
        this.$el = $(this.el);
        this.data = data;
        this.html = html;
      };
      View.prototype.templateData = function() {
        return this.data;
      };
      View.prototype.template = function(data) {
        return Handlebars.compile(this.html)(data);
      };
      _.extend(View.prototype, render.mixin);
    });

    it("should render a simple attribute.", function() {
      var view = new View({foo: 'i am foo'}, '{{foo}}');
      view.render().el.innerHTML.should.eql('i am foo');
    });

    it("should render a sub-template.", function() {
      var list = new View({comment: 'looking good'}, 'you {{comment}}');
      var main = new View({list: list}, 'hey there. {{render list}}');
      var rendered = main.render();
      var innerHTML = rendered.el.innerHTML;
      rendered.el.innerHTML.should.eql('hey there. <div>you looking good</div>');
    });

    it("should render a nested sub-template.", function() {
      var child2 = new View({text: 'child2'}, '{{text}}');
      var child1 = new View({text: 'child1', child: child2});
      child1.html = '{{text}} and {{render child}}';
      var main = new View({child: child1});
      main.html = 'i have {{render child}} here';
      var rendered = main.render();
      rendered.el.innerHTML.should.eql('i have <div>child1 and <div>child2</div></div> here');
    });

    it("should pass arguments to a sub-template and render them", function() {
      var child = new View({}, 'my dad is {{dadAge}} years old');
      var parent = new View({child: child, age: 42}, '{{render child dadAge=age}}');
      parent.render().el.innerHTML.should.eql('<div>my dad is 42 years old</div>');
    });

  });

});