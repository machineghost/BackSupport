mocha.setup('bdd');
mocha.ui('bdd');

describe('BackSupport', function() {
    'use strict';

    var sandbox;
    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });
    afterEach(function() {
       sandbox.restore();
    });

    describe('Underscore', function() {
        describe('#extend', function() {
           it('adds a constructor property to the extension object', function() {
               var constructorFunction = function() {};
               constructorFunction.a = 1;
               var foo = _.extend({}, {constructor: constructorFunction});
               expect(foo.constructor).to.be(constructorFunction);
               expect(foo.constructor.a).to.be(1);
           });
        });
        describe('#has', function() {
            it('returns true when used to evaluate an object with a constructor property', function() {
                var hasConstructor = _({constructor: $.noop}).has('constructor');
                expect(hasConstructor).to.be(true);
            });
        });
    });
    describe('BackSupport.mixins.View', function() {
        describe('#extend', function() {
            it('does not modify parent class prototypes', function() {
                var SupportedView = Backbone.View.extend(BackSupport.mixin('View').prototype);
                var SubView = SupportedView.extend({foo: 'bar'});
                expect(BackSupport.mixin('View').prototype).to.be(undefined);
                expect(Backbone.View.prototype.foo).to.be(undefined);
                expect(SupportedView.prototype.foo).to.be(undefined);
                expect(SubView.prototype.foo).to.be('bar');
            });
        });
    });
    describe('BackSupport.BaseClass', function() {
        describe('#_parsePropertyOptions', function() {
            var instance, TestClass;
            beforeEach(function() {
                TestClass = BackSupport.BaseClass.extend();
                instance = new TestClass();
            });
            it('does nothing if there are no property/required options defined', function() {
                instance._parsePropertyOptions();

                expect(instance.propertyOptions).to.be.empty();
                expect(instance.requiredOptions).to.be.empty();
            });
            it('does nothing if there are property options with asterisks', function() {
                instance.propertyOptions = ['a'];

                instance._parsePropertyOptions();
                expect(instance.propertyOptions).to.eql(['a']);
                expect(instance.requiredOptions).to.be.empty();
            });
            it('adds any property options with asterisks to required options', function() {
                instance.propertyOptions = ['*a'];

                instance._parsePropertyOptions();
                expect(instance.propertyOptions).to.eql(['a']);
                expect(instance.requiredOptions).to.eql(['a']);
            });
            it('keeps required options (even with asterisked property options)', function() {
                instance.propertyOptions = ['*a'];
                instance.requiredOptions = ['a', 'b'];

                instance._parsePropertyOptions();
                expect(instance.propertyOptions).to.eql(['a']);
                expect(instance.requiredOptions).to.eql(['a', 'b']);
            });
        });
        describe('.extend2', function() {
            it('doesn\'t alter properties of the parent class', function() {
                var ParentClass = BackSupport.BaseClass.extend({
                    events: {a: 'b'},
                    propertyOptions: ['a'],
                    requiredOptions: ['a']
                });
                var SubClass = ParentClass.extend2({
                    events: {c: 'd'},
                    propertyOptions: ['c'],
                    requiredOptions: ['c']
                });
                expect(ParentClass.prototype.events.a).to.be('b');
                expect(ParentClass.prototype.propertyOptions[0]).to.be('a');
                expect(ParentClass.prototype.requiredOptions[0]).to.be('a');
            });
        });
    });
    describe('BackSupport.View', function() {
        describe('#constructor', function() {
            it('replaces the Backbone.View constructor', function() {
                var BackboneConstructor = Backbone.View.prototype.constructor;
                var BackSupportConstructor = BackSupport.mixins.View.constructor;
                expect(BackSupport.View.prototype.constructor).to.not.be(BackboneConstructor);
                expect(BackSupport.View.prototype.constructor).to.be(BackSupportConstructor);
            });
            it('calls preInitialize', function() {
                var SubClass = BackSupport.View.extend({template: '<div>'});
                window.a = 1;
                var stub = sandbox.stub(SubClass.prototype, 'preInitialize');
                new SubClass();
                expect(stub.calledOnce).to.be(true);
            });
        });
        describe('#preInitialize', function() {
            it('exists', function() {
                var preInitialize = BackSupport.mixin('View').preInitialize;
                expect(BackSupport.View.prototype.preInitialize).to.be.a('function');
                expect(BackSupport.View.prototype.preInitialize).to.be(preInitialize);
            });
            it('calls bindMethods', function() {
                var SubClass = BackSupport.View.extend({boundMethods: ['foo'], foo: $.noop});
                var stub = sandbox.stub(SubClass.prototype, 'bindMethods');
                new SubClass();
                expect(stub.calledOnce).to.be(true);
            });
        });
        describe('#bindMethods', function() {
            it('binds the specified "boundMethods"', function() {
                var SubClass = BackSupport.View.extend({
                    foo: function() {
                        return this;
                    }
                });
                var instance = new SubClass();
                instance.boundMethods = ['foo'];
                instance.bindMethods();
                expect(instance.foo.call({})).to.be(instance);
            });
        });
        describe('#setPropertiesFromOptions', function() {
            it('converts its "propertyOptions" options in to properties', function() {
                var SubClass = BackSupport.View.extend({propertyOptions: ['foo']});
                var instance = new SubClass();
                instance.options = {foo: 1};
                instance.setPropertiesFromOptions();
                expect(instance.foo).to.be(1);
            });
        });
    });
});
mocha.run();