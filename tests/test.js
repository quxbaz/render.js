var _ = require('./lib/underscore/underscore');
require('./lib/chai/chai').should();
var Handlebars = require('./lib/handlebars/handlebars');
var $ = require('./lib/jquery/dist/jquery');
var render = require('../render');

describe('render.js', function() {

  describe('.setUniqueId', function() {

    var Foo = function() {};

    before(function() {
      render.setUniqueId(Foo.prototype);
    });

    it("should set a 'UID' property on an object.", function() {
      var a = new Foo();
      a.UID.should.not.eql(undefined);
      var b = new Foo();
      b.UID.should.not.eql(undefined);
    });

    it("should set only unique ids.", function() {
      var ids = _.times(1000, function() {
        return new Foo().UID;
      });
      _.uniq(ids).length.should.eql(ids.length);
    });

  });

  describe("renderer", function() {

    var View;

    before(function() {
      render.registerHelper(Handlebars);
    });

    beforeEach(function() {
      View = function(data, html) {
        this.el = document.createElement('div');
        this.$el = $(this.el);
        this.data = data;
        this.html = html || '';
      };
      render.setUniqueId(View.prototype);
      View.prototype.templateData = function() {
        return this.data;
      };
      View.prototype.template = function(data) {
        return Handlebars.compile(this.html)(data);
      };
      render.mixin(View.prototype);
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

    it("should render within a nested div", function() {
      var child = new View({}, 'foobar');
      var main = new View({child: child});
      main.html = '<div>{{render child}}</div>'
      main.render().el.innerHTML.should.eql('<div><div>foobar</div></div>');
    });

    it("should render within a second-level nested div", function() {
      var child = new View({}, 'foobar');
      var main = new View({child: child});
      main.html = '<div><div>{{render child}}</div></div>';
      main.render().el.innerHTML.should.eql('<div><div><div>foobar</div></div></div>');
    });

    it("should render a list of subviews.", function() {
      var children = _.times(3, function(i) {
        return new View({age: 5 + i}, '{{age}}y');
      });
      var main = new View({children: children});
      main.html = '{{#each children}}{{render this}}{{/each}}';
      main.render().el.innerHTML.should.eql(
        '<div>5y</div><div>6y</div><div>7y</div>'
      );
    });

    it("should render a list of subviews that subrender.", function() {
      var toys = ['doll', 'truck', 'bear'];
      var children = _.times(3, function(i) {
        var toy = new View({name: toys[i]}, 'big {{name}}');
        return new View({toy: toy}, 'my toy is a {{render toy}}');
      });
      var main = new View({children: children});
      main.html = '{{#each children}}{{render this}}{{/each}}';
      main.render().el.innerHTML.should.eql(
        '<div>my toy is a <div>big doll</div></div><div>my toy is a <div>big truck</div></div><div>my toy is a <div>big bear</div></div>'
      );
    });

    it("should provide a custom preRender function.", function() {
      View.prototype.preRender = function(data) {
        data.foo = 'sunny';
        return data;
      };
      var v = new View({foo: 'bar'}, 'hello {{foo}} world');
      v.render().el.innerHTML.should.eql('hello sunny world');
    });

    it("should provide a custom postRender function.", function() {
      View.prototype.postRender = function(data) {
        return data.foo + ' hooked';
      };
      var v = new View({foo: 'you are'});
      v.render().should.eql('you are hooked');
    });

    it("should provide a custom renderContent function.", function() {
      View.prototype.renderContent = function(data) {
        this.el.innerHTML = data.foo + 'bar';
        return data;
      };
      var v = new View({foo: 'bar'});
      v.render().el.innerHTML.should.eql('barbar');
    });

  });

});
