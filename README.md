BackSupport
===============

A library that provides some "support" for Backbone (developed at, and with the support of, Syapse.com). 


BackSupport provides a set of new versions of the core Backbone Classes (Collection, Model, Router, and View), as well as a brand new "BaseClass", and a new extend2 function which supplements Backbone's built-in extend.

Here's a quick overview of what BackSupport has to offer (more complete documentation coming soon).

**BaseClass**

Not every class is a model or a view, so BackSupport.BaseClass allows you to use the same great inheritance system that Backbone classes have, as well as all the new functionalityprovided by BackSupport, without having to commit to a Backbone Class that doesn't fit your concept.  Creating a new BaseClass sub-class is as simple as creating a regular Backbone sub-class:

    var MyClass = BackSupport.BaseClass.extend({
        // define your class here
    });
    var myInstance = new MyClass();

**extend2**

One of the most frustrating things about Backbone is how it simulates classical inheritance when extending class methods, but not when extending class properties.  Thus, if your "A" View defined as "events" property, and then your "B" sub-class of A also defines an "events" property, B will lose all of A's events.  extend2 (which is available as a static method of every BackSupport class) allows properties like "events" to be extended rather than overwritten.
However, it is important to note that if A and B both define a "click .foo" event, A's event will still be lost even with extend2.  extend2 simply performs an _.extend (instead of a pure replacement).
You can use extend2 the same way you would normally use extend, ie.:

    var MySubClass = MyParentClass.extend2({
        // insert your class definition here
    });

extend2 extends "attributes", "defaults", and "events" properties from Backbone as well as the "boundMethods", "propertyOptions", "requiredAttributes", and "requiredOptions" properties from BackSupport. 


**Property Options**

One of the most common patterns I see repeated over and over again in Backbone code is:

    SomeClass.extend({
        initialize: function(ptions) {
            this.foo = options.foo;
            this.bar = options.bar;
            ...
        }
    }

Backbone itself already provides a solution to this problem, but only for specific options like "collection" and "model".  BackSupport's property options feature provides similar functionality to eliminate boilerplate code.  This property can be used like so:

    SomeClass.extend({
        propertyOptions: ['foo', 'bar']
    }


**Required Options and Attributes**

Another common pattern I often see repeated in Backbone code is:

    SomeClass.extend({
        initialize: function(options) {
            if (_(options.foo).isUndefined()) {
                throw new Error('The "foo" options is required');
            }
            if (_(options.bar).isUndefined()) {
                ...

BackSupport provides a simpler way to require options (and, for Models, attributes) with its requiredAttributes and requiredOptions properties.  Just as with propertyOptions these properties can be set with arrays of strings, where each string is the name of a required attribute or property.

For example:

    SomeClass.extend({
        requiredOptions: ['foo', 'bar']
        ...

**Bound Methods**

Yet another pattern often seen in Backbone code (owing to the flexible nature of Javascript's `this`) is the following:

    SomeClass.extend({
        initialize: function(options) {
            _(this).bindAll('method1', 'method2');
        }
    }

BackSupport provides a more convenient way to bind your methods to your class with its "boundMethods" property:

    SomeClass.extend({
        boundMethods: ['method1', 'method2']
    }


**Events Property (for non-Views)**

Have you ever wished that you could define event handlerss on your collections and models using the same simple "events" property syntax that Backbone.View uses?  Well wish no longer, because BackSupport adds support for an events property on any BackSupport class:

    BackSupport.Model.extend({
        events: {'change:someAttribute', 'handleSomeAttributeChange'}
    }

**Built-in Templating Support**

All BackSupport.View subclases come with a render method already defined.  This render method does two things:

 * Apply the view's template to the view's element (ie. `this.$el.html(this.templatedHtml())`)
 * Append the view to its `$container` property (if any)

Out of the box BackSupport uses Underscore's template function to power it's templating, but you can use any third party templating system you want (eg. this author uses Handlebars) simply by overwriting the compileTemplate method.  Whichever template you use automatically has the view's "templateData" property, along with the view's model (if any)'s attributes and the view's collection (if any) available to the template.

What does all that mean?  It means you can make a view like so:

    var MyView = BackSupport.View.extend({
        template: 'This is a <%= adjective %> view for <%= name %>',
        templateData: {adjective: 'great'}
    })
    
    var myView = new MyView({model: new Backbone.Model({name: 'Jeremy Ashkenas'});
    myView.render();
    
    // myView.$el.html() = 'This is a great view for Jeremy Ashkenas'

    // (and if we'd provided a $container we wouldn't even append our view to the DOM!)

**Convenience Shortcuts**

BackSupport provides several minor convenience features, such as ...

... when you need to rebind an event handler:

    // instead of this:
    this.off('click').on('click', function() { ... 
    // you can do:
    this.offOn('click', function() { ... 

... when you need to invoke a parent class method:

    // instead of this:
    ParentClass.prototype.someMethod.call(this, arg1, arg2);
    // you can do:
    this._proto(ParentClass, 'someMethod', arg1, arg2);
    // (Yes that's only a five character savings, but every bit helps)

.. when you want to set an attribute only if it hasn't already been set:

    // instead of this:
    if(!someModel.has('someAttribute')) {
        someModel.set('someAttribute', someValue);
    }
    // or this:
    someModel.set('someAttribute', someModel.get('someAttribute') || someValue);
    // you can do:
    someModel.setIfUnset('someAttribute', someValue);

**Other Features**

BackSupport contains a number of other great features, and documentation on them is coming soon.  In the meantime though feel free to look at the BackSupport source code, as I've tried to document each new feature as well as possible using JSDoc syntax.

**Future Development**

BackSupport is relatively stable at this point, having been "battle tested" in use at Syapse.com for over a year now.  However, there is one future planned change that is worth mentioning.

Currently if you wish to supply properties such as "propertyOptions" or "requiredAttributes" in a way that won't get overwritten by your subclasses (and you don't want to use extend2 to avoid the problem), you can define a "getPropetyOptions" or "getRequiredAttributes" method which returns the list of options/attributes (and which can invoke its parent's get* method to support inheritance).

This works great, but it doesn't keep to the Backbone convention of using the same property for both the array and function form (like Backbone.Model.defaults).  At some point (when I have time) BackSupport will be modified to use "propertyOptions" (and similar properties) for both the array and function forms, rather than having a separate "getPropertyOptions".
