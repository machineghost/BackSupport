Backbone.Grease = (function() {
    'use strict';

    var Grease = {};

    /**
	 * Occasionally one might wish to use Backbone Grease functionality with an existing
	 * Backbone Collection/Model/View.  Doing this requires "mixing-in" the prototype of
	 * relevant Backbone.Grease class, ie:
	 *     var GreasedGrid = Backgrid.Grid.extend(greasedViewPrototype).extend();
	 * However, we don't want to use the actual prototype, as that could result in modifications to
	 * other classes which also use that prototype; instead, we need a clone of the prototype.
	 * 
	 * This method generates clones of the original Grease mixin expressly for this purpose,
	 * like so:
	 *     var greasedViewPrototype = Backbone.Grease.Mixins('View');
	 *     var GreasedGrid = Backgrid.Grid.extend(greasedViewPrototype).extend();
	 */
	Grease.Mixins = function(mixinName) {
		return _({}).extend(Grease.Mixins[mixinName]);
	};
    
    var assert = function(expression, message) {
        if (expression) return;
        throw new Error(message || 'Assertion failure');
    };

    /**
     * All of our base classes share some common convenience functionality.  For instance, all
     * classes take an "options" (or at least they all can; BaseClass can opt not to), and so all
     * classes can optionally use a property propertyOptions to set some of those properties on
     * the instance itself.
     * 
     * All of this functionality is kept here in BaseCommon (which is a "mix-in", then merged
     * (via _.extend) in to the prototype of the other base classes.
     * 
     * TODO: Further documentation on this mix-in's functionality exists in BaseView (as much of it
     *       originally came from there).  Go take the relevant parts from there and put them here!
     */
    Grease.Mixins.Common = {
        boundMethods: [],
        /**
         * If a class has an "propertyOptions" property, this.options will be checked, and every
         * "property" option found in this.options will be set as a direct property of this view
         * (ie. it will be set as this.foo instead of this.options.foo), in the same way that
         * Backbone already sets this.model to options.model.
         * 
         * Essentially this is just a convenience method to avoid long lists of:
         *     this.foo = options.foo;
         *     this.bar = options.bar
         *     this.baz ... etc.
         *
         * NOTE: In a sense "options" itself is sort of a property option, as it gets set as
         *       this.options in every base class.  However, that's handled separately by each class
         *       (the Backbone-based ones already have it built-in), not here. 
         */
        propertyOptions: [],
        
        /**
         * If a class requires any options, this property can be overridden to include the names
         * of those options, and then this class will assert that they exist (on initialization).
         */
        requiredOptions: [],
        /**
         * This property controls whether or not we use our custom copy of Backbone.View's
         * event-binding system (it's "opt-in" to avoid trampling on Backbone.View's existing
         * functionality). 
         */
        copyModelEventBinding: false,

        preInitialize: function(options) {
            this.options = options || {};
            this.checkOptionsValidity(options);
            this.setPropertiesFromOptions();
            this.bindMethods();
            this.bindEvents();
        },
        /**
         * This method binds any event handlers specified in this.events, similarly to how
         * Backbone.View binds any event handlers specified in its "events" property.
         * NOTE: Someday it would be nice to see if we can re-use Backbone.Views event-binding
         *       logic, rather than re-creating our own here.
         */
        bindEvents: function() {
            if (!this.copyModelEventBinding) return;
            _(this.events).each(function(eventHandler, eventBinding) {
                eventHandler = _.isString(eventHandler) ? this[eventHandler] : eventHandler;
                this.on(eventBinding, eventHandler);
            }, this);
        },
        /**
         * Binds any methods specified in boundMethods to this object (ie. this method calls
         * _.bindAll(this, this.boundMethods[0], this.boundMethods[1], etc.)).
         */
        bindMethods: function() {
            var boundMethods = this.getBoundMethods();
            if (!boundMethods || !boundMethods.length) return;
            var validMethodNames = _.intersection(_.methods(this), boundMethods);
            if (!validMethodNames.length) return;
            
            var bindAllArguments = [this].concat(validMethodNames);
            _.bindAll.apply(null, bindAllArguments);
        },
        checkOptionsValidity: function(options) {
            this.validateRequiredOptions();
            if (!this.validateOptions) return;
            var message = this.validateOptions(options);
            // If validateOptions returns a truthy non-string value, the validation is considered
            // to have passed.  If anything else is returned the validation is considered to have
            // failure, and if a string was returned it is used as the failure message.
            var isValid = !_.isString(message) && message;
            assert(isValid, message);
        },
        getBoundMethods: function() {
            return this.boundMethods;
        },
        getRequiredOptions: function() {
            return this.requiredOptions;
        },
        /**
         * setPropertiesFromOptions uses the array returned from this method to set properties from
         * options as appropriate for this view.  While the base version of this method just returns
         * this.propertyOptions, sub-classes of BaseModel can override this method to add further
         * propertyOptions (options which won't get lost if their sub-classes set their own
         * propertyOptions property).
         * 
         * In other words, if A extends B which extends BaseModel, and A and B both set a
         * propertyOptions property, A's will replace B's.  If B overrides this method instead
         * though, both A's and B's propertyOptions will get used. 
         */
        getPropertyOptions: function() {
            return this.propertyOptions;
        },
        /**
         * If a class has an "propertyOptions" property,  this.options will be checked, and every
         * "property" option found in this.options will be set as a direct property of this view
         * (ie. it will be set as this.foo instead of this.options.foo).
         * 
         * Essentially this is just a convenience method to avoid long lists of:
         *     this.foo = options.foo;
         *     this.bar = options.bar
         *     this.baz ... etc.
         */
        setPropertiesFromOptions: function() {
            _(this).extend(_.pick(this.options, this.getPropertyOptions()));
        },
        //validateOptions: this method can be "overwritten" (or, "written" at least) with a function
        //                 that returns a validation failure message if any options are "invalid"
        //                 (the definition of "invalid" being left to the overwriting subclass).
        //                 See check
        validateRequiredOptions: function() {
            if (!this.getRequiredOptions().length) return; // Nothing was required; we're done
            if (!this.options) console.log(this); // Help with debugging if the next assert fails
            assert(this.options, "The '" + _.toSentence(this.getRequiredOptions()) +
                                      "' options were required, but no options were provided!");
            _.each(this.getRequiredOptions(), function(requiredOption) {
                var hadOption = !_.isUndefined(this.options[requiredOption]);
                if (!hadOption) console.log(this); // Help with debugging if the next assert fails
                var message = "option '" + requiredOption + "' is required!";
                if (this._type) {
                    message = message.subst(0, message.length - 1) + ' for ' + this._type + '!';
                }
                assert(hadOption, message);
            }, this);
        },
        /**
         * Usage (from within a Base* Class method):
         *   this._proto(BaseClass, methodName, arg1, arg2, ...);
         *  
         * For instance, to invoke the BaseCollection's add method with an argument of "foo":
         *   this._proto(BaseCollection, 'add', foo);
         */
        _proto: function(constructor, methodName) {
            var method = constructor.prototype[methodName];
            if (_.isFunction(method)) {
                return method.apply(this, _.rest(arguments, 2));
            } else {
                throw '_proto() failed for ' + methodName;
            }
        }
    };
    
    Grease.BaseClass = function(options) {
        // NOTE: BaseClass extends BaseCommon, and therefore has options-based functionality that
        //       expects a single "options" argument to be provided.  However, BaseClass subclasses 
        //       that don't wish to use the options functionality (eg. propertyOptions) can freely
        //       ignore it, and accept any set of arguments they want (eg. 5 integers) instead.
        this.options = options;
        this.events = {};
        this.preInitialize.apply(this,arguments);
        if (this.initialize) this.initialize.apply(this, arguments);
    };
    // NOTE: We use Backbone.Model.extend here, but it could just as easily be Backbone.View.extend
    //       or Backbone.Collection.extend; they're all the same method, and since the "this" will
    //       be BaseClass in our case (and not a Backbone class) using this won't break anything.
    //       (If Backbone would just expose it's extend function we wouldn't have to bother ...)
    Grease.BaseClass.extend = Backbone.Model.extend;
    // Add Backbone's event system to BaseClass
    // Also add our BaseCommon mix-in, and enable it's emulation of Backbone.Views event binding 
    _(Grease.BaseClass.prototype).extend(Backbone.Events, Grease.Mixins('Common'),
                                         {copyModelEventBinding: true});

    /**
     * In addition to having all of the BaseCommon functionality, this class also adds:
     * 
     * - requiredAttributes  (just like required options only applied to attributes)
     *                       Alternatively, a requiredAttributes value of "true" will simply ensure
     *                       that *some* attributes object (even an empty "{}" one) is provided
     * - Underscore methods  (kinda like Collection's Underscore methods, but these ones are applied
     *                       to this.attributes; currently the only methods are each, map, and pick)
     *                       TODO: Newer versions of Backbone have those methods built-in; upgrade
     *                             and use them instead
     * 
    */
    // .extend ... is for IE8.
    Grease.Mixins.Model = _(Grease.Mixins('Common')).extend({
        copyModelEventBinding: true, // Simulate Backbone.View's handling of the "events" property
        /**
         * Backbone.View has a great event-binding mechanism ("events"), which is handy for our
         * other classes to use ... so we copy it here.  Thus, this events property is designed to
         * work similarly (if not identically) to Backbone.View's events property.
         */
        events: {},
        /**
         * If a model requires any attributes, this property can be overridden to include the names
         * of those attributes, and then this class will assert that they exist (on initialization).
         */
        requiredAttributes: [],

        constructor: function(attributes, options) {
            this.preInitialize(options);
            this.validateRequiredAttributes(attributes);
            return Backbone.Model.apply(this, arguments);
        },
        /**
         * Sometimes we want to iterate through all of the values in a model's attribute, invoking a
         * function on each one; this method provides a convenient way to do that.
         */
        each: function(attributeName, iteratingFunction) {
            _.each(this.get(attributeName), iteratingFunction, this);
        },
        /**
         * Sometimes we want to iterate through all of the values in a model's attribute, invoking a
         * function on each one and returning the results; this method provides a convenient way to
         * do that.
         */
        map: function(attributeName, iteratingFunction) {
            _.map(this.get(attributeName), iteratingFunction, this);
        },
        /**
         * Often when we want to bind an event handler (eg. inside a view's render statement) we
         * want to make sure we don't bind that handler twice, so we call "off" with (almost) the
         * same arguments as the bind-ing on call.  This convenience function simplifies that by
         * calling off with the first two arguments provided, then calling on with all of the
         * arguments.
         */
        offOn: function(event, callback, context) {
            this.off(event, callback)
                .on(event, callback, context);
        },
        /**
         * This method is just a convenience alias for calling Underscore's pick function on this
         * model's attributes (which allows us to easily get any subset of a model's attributes we
         * want).
         */
        pick: function() {
            return _.partial(_.pick, this.attributes).apply(this, arguments);
        },
        /**
         * In Javascript we often set a value for a variable only if there currently is no value:
         *     a = a || valueIfThereIsNoA;
         * With Backbone models however that same pattern gets a bit more awkward:
         *     this.set('a', this.get('a') || valueIfThereIsNoA);
         * This method is designed to reduce that awkwardness by providing a way to set a value only
         * if that attribute is currently unset, with the syntax:
         *     this.setIfUnset('a', valueIfThereIsNoA);
         *
         * NOTE: This method uses this.has for the "or" check, and that method isn't quite the same
         *       as "||" (eg. it won't consider "0" or "" to mean "not set" the way "||" would).
         */
        setIfUnset: function(attributeName, ifUnsetValue) {
            if (this.has(attributeName)) return;
            this.set(attributeName, ifUnsetValue);
        },
        /**
         * Asserts that all of this models required attributes were provided
         * @param actual the actual attributes that were provided
         * @param type
         */
        validateRequiredAttributes: function(actual, type) {
            if (this.requiredAttributes.length || this.requiredAttributes === true) {
                assert(!!actual, 'An attributes object (even if it is just "{}") is required');
            }
            if (!this.requiredAttributes.length) return; // An attributes object existed, we're done
            assert(actual, "The attributes " + _.toSentence(this.requiredAttributes) + " were " +
                           "required, but no attributes were provided!");
            var actualAttributes = _(actual).map_(function(value, name) {
                // Filter out all attributes that were supplied, but with a value of undefined
                return _(value).isUndefined() ? null : name;
            }).compact().join(', ');
            _.each(this.requiredAttributes, function(required) {
                assert(!_.isUndefined(actual[required]), "The attribute \"" + required + "\" was " +
                                                         "required but only the attributes \"" +
                                                         actualAttributes +
                                                         "\" were provided!");
            });
        }
    });
    Grease.Model = Backbone.Model.extend(Grease.Mixins('Model'));
    Grease.Mixins.Collection = _(Grease.Mixins('Common')).extend({
        copyModelEventBinding: true, // Simulate Backbone.View's handling of the "events" property
        /**
         * Backbone.View has a great event-binding mechanism ("events"), which is handy for our
         * other classes to use ... so we copy it here.  Thus, this events property is designed to
         * work similarly (if not identically) to Backbone.View's events property.
         */
        events: {},

        constructor: function(models, options) {
            this.preInitialize(options);
            return Backbone.Collection.apply(this, arguments);
        },
        /**
         * Often when we want to bind an event handler (eg. inside a view's render statement) we
         * want to make sure we don't bind that handler twice, so we call "off" with (almost) the
         * same arguments as the bind-ing on call.  This convenience function simplifies that by
         * calling off with the first two arguments provided, then calling on with all of the
         * arguments.
         */
        offOn: function(event, callback, context) {
            this.off(event, callback)
                .on(event, callback, context);
        }
    });
    Grease.Collection = Backbone.Collection.extend(Grease.Mixins('Collection'));
    /**
     * Some convenient things BaseView can do:
     * 
     * 1) Templating on Render
     *    Instead of:
     *        render: function() {
     *            this.$el.html(someTemplate(this.templateData));
     *        }
     *    you can just do:
     *        template: someTemplate
     *
     * 2) Property-Setting From Options
     *    Instead of:
     *        initialize: function(options) {
     *            this.foo = options.foo;
     *            this.bar = options.bar;
     *            this.baz = options.baz;
     *        }
     *    you can just do:
     *        propertyOptions: ['foo', 'bar', 'baz']
     *
     * 3) Template Data-Setting From Options
     *    Instead of:
     *        initialize: function(options) {
     *            this.templateData.foo = options.foo;
     *            this.templateData.bar = options.bar;
     *            this.templateData.baz = options.baz;
     *        }
     *    you can just do:
     *        templateDataOptions: ['foo', 'bar', 'baz']
     *
     * 4) Option Validation
     *    Instead of:
     *        initialize: function(options) {
     *            require('Utility').assert(options.foo == 1);
     *            require('Utility').assert(options.bar == 2);
     *            require('Utility').assert(options.baz == 3);
     *        }
     *    you can just do:
     *        validateOptions: function(options) {
     *            return options.foo == 1 && options.bar == 2 && options.baz == 3;
     *        };
     *    
     * 4b) Similarly, if you want to have a failure message then instead of:
     *        initialize: function(options) {
     *            require('Utility').assert(options.foo == 1, 'Foo wasn't equal to 1!');
     *        }
     *    you can just do:
     *        validateOptions: function(options) {
     *             if (options.foo != 1) return 'Foo wasn't equal to 1!';
     *        };
     *
     * 4c) Similarly, if you just want dead simple "this option is required" validation, instead of:
     *        initialize: function(options) {
     *            require('Utility').assert(options.foo != undefined);
     *        }
     *     you can just do:
     *        requiredOptions: ['foo']
     *
     * 5) Method Binding
     *    Instead of:
     *        initialize: function() {
     *            // Note: bindAll fails if you give it the name of a method that isn't in "this"
     *            _.bindAll(this, 'foo', 'bar', this.baz ? 'baz' : undefined); 
     *        }
     *    you can just do:
     *        boundMethods: ['foo', 'bar', 'baz']
     *
     * 6) Require a Specific Class of Model
     *    Instead of:
     *        initialize: function() {
     *            require('Utility').assert(this.model instanceof FooClass); 
     *        }
     *    you can just do:
     *        modelClass: FooClass
     */
    Grease.Mixins.View = _(Grease.Mixins('Common')).extend({
        /**
         * Any method names included here will be bound to "this" ... if "this" actually has a
         * method with that name (that last part is relevant because bindAll gets very unhappy if
         * you try to have it bind methods that doesn't exist).
         */
//            boundMethods: [],
        
        /**
         * Indicates whether to merge the view's model with the tepmlate data before templating
         */
        includeModelInTemplateData: true,
        
        /**
         * Any property names included here will be set (from the provided options) as templateData
         * of this view.  For example, if templateDataOptions: ['foo'], and this view is initialized
         * with {foo: 5}, this.templateData.foo will be set to 5.
         */
        templateDataOptions: [],
        
        /**
         * This overloaded version of the Backbone View constructor sets up all the BaseView
         * wonderfulness.
         */
        constructor:function(options) {
            this.preInitialize(options);
            this.validateModelClass();
            // templateData can be set one of three ways:
            // 1) as an option to initialize
            // 2) as a property of the view
            // 3) (if neither of the above) as a fresh object here
            this.templateData = this.templateData || (this.options.templateData) || {};
            this.setTemplateDataFromOptions();
            this.template = this.template ||
            (this.options.template ? this.options.template : this.template);
            Backbone.View.apply(this, arguments);
        },
        appendTo$Container: function() {
            if (!this.$container) return;
            this.$el.appendTo(this.$container);
        },
        compileTemplate: function() {
            this.template = _(this.template).template();
        },
        /**
         * Just as with the normal version of this method (in BaseCommon) this method returns any
         * propertyOptions specified, and can be overridden to set propertyOptions that won't get
         * replaced by a sub-class's propertyOptions.
         * 
         * Unlike the base getPropertyOptions though, this version also appends some other,
         * view-specific, property options.
         */
        getPropertyOptions: function() {
            var basePropertyOptions = Grease.Mixins.Common.getPropertyOptions.apply(this, arguments);
            return ['$container', 'template'].concat(basePropertyOptions);
        },
        getTemplate: function() {
            if (this.template && _(this.template).isString())  {
                this.compileTemplate();
            }
            return this.template;
        },
        getTemplateData: function() {
            var templateData = {};
            var includeModel = this.includeModelInTemplateData && this.model;
            if (includeModel) {
                _.extend(templateData, this.model.toJSON(), this.templateData);
                templateData.BACKBONE_CID = this.model.cid;
            }
            if (this.collection) {
                var models = this.collection.invoke('toJSON');
                _.extend(templateData, {collection: models}, this.templateData);
            }
            if (!includeModel && !this.collection) {
                _.extend(templateData, this.templateData);
            }
            return templateData;
        },
        getTemplateDataOptions: function() {
            return this.templateDataOptions;
        },
        outerHtml: function() {
            return $('<div>').append(this.$el.clone()).html();
        },
        render: function() {
            this.renderTemplate();
            this.appendTo$Container();
            return this;
        },
        renderTemplate: function() {
            this.$el.html(this.templatedHtml());
        },
        /**
         * If a view has an "templateDataOptions" property,  this.options will be checked, and every
         * "templateData" option found in this.options will be set on this view's templateData (ie.
         * it will be set as this.foo instead of this.options.foo).
         */
        setTemplateDataFromOptions: function() {
            _.extend(this.templateData, _.pick(this.options, this.getTemplateDataOptions()));
        },
        /**
         * This method returns the HTML that would be generated for this view during rendering ...
         * without actually applying it to the view's el (as render would).
         * @returns a string of html for this view
         */
        templatedHtml: function() {
            var template = this.getTemplate();
            assert(template && _(template).isFunction(), 'A valid template is required to render!');
            return template(this.getTemplateData());
        },

        validateModelClass: function() {
            if (_(this.model).isUndefined() || _(this.modelClass).isUndefined()) return;
            // USe typeof, since it might not be defined.
            assert(this.model instanceof this.modelClass);
        }
    });
    Grease.View = Backbone.View.extend(Grease.Mixins('View'));
    // For now the Greased Router has no special logic except for the common Grease bits (eg.
    // bound methods); in the future this class may gain additional functionality, such as
    // methods for guarding against users accidentally navigating away from a page.
    Grease.Mixins.Router = _(Grease.Mixins('Common')).extend({
        constructor:function(options) {
            this.preInitialize(options);
            Backbone.Router.apply(this, arguments);
        }
    });
    Grease.Router = Backbone.Router.extend(Grease.Mixins('Router'));

    /**
     * extend2 works similarly to Backbone's normal extend, except that for certain, specified
     * properties (eg. events, defaults) it merges the property's value with the parents, rather
     * than replacing it outright.
     */
    Grease.BaseClass.extend2 = Grease.Collection.extend2 = Grease.Model.extend2 =
    Grease.View.extend2 = function(protoProps, staticProps) {
        var child = Backbone.Model.extend.apply(this, arguments);
        _(['attributes', 'defaults', 'events']).each(function(key) {
            if (_(this.prototype[key]).isObject() && _(protoProps[key]).isObject()){
                // Inherit instead of overwriting
                child.prototype[key] = _({}).extend(this.prototype[key], protoProps[key]);
            }
         }, this);

        _(['boundMethods', 'propertyOptions', 'requiredAttributes', 'requiredOptions',
           'templateDataOptions']).each(function(key) {
            if (_(this.prototype[key]).isArray() && _(protoProps[key]).isArray()){
                // Inherit instead of overwriting
                child.prototype[key] = _(this.prototype[key]).union(protoProps[key]);
            }
         }, this);       
        return child;
    };
    
    return Grease;
} ());