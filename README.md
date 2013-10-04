Backbone-Grease
===============

A library for making Backbone "slicker" to work with (developed at, and with the support of, Syapse.com)


Backbone Grease provides a set of new versions of the core Backbone Classes (Collection, Model, Router, and View), as well as a brand new "BaseClass", and a new extend2 function which supplements Backbone's built-in extend.

Here's a quick overview of what Backbone Grease has to offer (more complete documentation coming soon).

**BaseClass**

Not every class is a model or a view, so Backbone.Grease.BaseClass allows you to use the same great inheritance system that Backbone classes have, as well as all the new functionalityprovided by Backbone Grease, without having to commit to a Backbone Class that doesn't fit your concept.  Creating a new BaseClass sub-class is as simple as creating a regular Backbone sub-class:

    var MyClass = Backbone.Grease.BaseClass.extend({
        // define your class here
    });
    var myInstance = new MyClass();

**extend2**

One of the most frustrating things about Backbone is how it simulates classical inheritance when extending class methods, but not when extending class properties.  Thus, if your "A" View defined as "events" property, and then your "B" sub-class of A also defines an "events" property, B will lose all of A's events.  extend2 (which is available as a static method of every Grease class) allows properties like "events" to be extended rather than overwritten.
However, it is important to note that if A and B both define a "click .foo" event, A's event will still be lost even with extend2.  extend2 simply performs an _.extend (instead of a pure replacement).
You can use extend2 the same way you would normally use extend, ie.:

    var MySubClass = MyParentClass.extend2({
        // insert your class definition here
    });

extend2 extends "attributes", "defaults", and "events" properties from Backbone as well as the "boundMethods", "propertyOptions", "requiredAttributes", and "requiredOptions" properties from Backbone Grease. 


**Property Options**

One of the most common patterns I see repeated over and over again in Backbone code is:

    SomeClass.extend({
        initialize: function(ptions) {
            this.foo = options.foo;
            this.bar = options.bar;
            ...
        }
    }

Backbone itself already provides a solution to this problem, but only for specific options like "collection" and "model".  Backbone Grease's property options feature provides similar functionality to eliminate boilerplate code.  This property can be used like so:

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

Backbone Grease provides a simpler way to require options (and, for Models, attributes) with its requiredAttributes and requiredOptions properties.  Just as with propertyOptions these properties can be set with arrays of strings, where each string is the name of a required attribute or property.

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

Backbone Grease provides a more convenient way to bind your methods to your class with its "boundMethods" property:

    SomeClass.extend({
        boundMethods: ['method1', 'method2']
    }

**Other Features**

Backbone Grease contains a number of other great features, and documentation on them is coming soon.  In the meantime though feel free to look at the Backbone Grease source code, as I've tried to document each new feature as well as possible using JSDoc syntax.

**Future Development**

Backbone Grease is relatively stable at this point, having been "battle tested" in use at Syapse.com for over a year now.  However, there is one future planned change that is worth mentioning.

Currently if you wish to supply properties such as "propertyOptions" or "requiredAttributes" in a way that won't get overwritten by your subclasses (and you don't want to use extend2 to avoid the problem), you can define a "getPropetyOptions" or "getRequiredAttributes" method which returns the list of options/attributes (and which can invoke its parent's get* method to support inheritance).

This works great, but it doesn't keep to the Backbone convention of using the same property for both the array and function form (like Backbone.Model.defaults).  At some point (when I have time) Backbone Grease will be modified to use "propertyOptions" (and similar properties) for both the array and function forms, rather than having a separate "getPropertyOptions".
