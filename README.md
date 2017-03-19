# aeonx
Browser-side runner for Aeon files

Allows running both .aeon and also .aeon.json definitions.

Aeonx is a library for using .aeon definitions directly in the browser.

Uses event delegation, when possible, on the .aeon definition root node.  This is instead of event listeners on target nodes.  This allows dynamically created DOM elements to make use of the same event listeners created at load time.  Without delegation, a background process is required to be able to auto-assign event listeners to new nodes.  This background process could be seen are both more resource intensive, and more complex.   

Aeonx uses `DOMFocusIn` and `DOMFocusOut` in place of `focus` and `blur`.  This is because `focus` and `blur` do not bubble, and are not reliable for event delegation.

The body-tag is default event delegator.  To use a different tag as the event delegator, pass the tag's id as a config option:

  `aeonx.delegator = "someId";` 

# What are .aeon files?

Aeon files (example.aeon) are similar to CSS.  Its purpose is to create a language to simplify working with DOM events.

Its main inspration is from CSS, which can be seen in its key:value syntax.  It also is inspired by SASS and LESS projects, which can be seen in it's nested syntax.  

The goal of Aeon is to provide a concise way to store DOM event programming.  It seeks to reduce the need of coding in Vanilla JavaScript or jQuery.  It is slightly enforcing in the way it expects functions are called.  For example, here is how a function is called from a separate custom JavaScript file:

```
  /** inside example.aeon */
  #example-id {
    @onclick {
      class: $handler.doSomething;
    }
  }
  
  /** inside handler.js */
  var doSomething = function(e) {
    console.log("Here is the DOM event information", e);
  }

  // module export
  handler = {
      doSomething: $doSomething
  }
```
  
 Here are 3 examples of simple web applications using .aeon files:
 
 * [TodoMVC](http://code.gavinengel.com/aeonx/examples/todomvc/)
 * [Calculator](http://code.gavinengel.com/aeonx/examples/calculator/)
 * [String Manipulation](http://code.gavinengel.com/aeonx/examples/all-operators/)
 
 ## How can .aeon files help?
 
 Aeon files can reduce the lines of source code, compared to popular JavaScript frameworks.  For simplistic frontend projects, using an Aeon file instead of a heavy framework, such as Angular, can reduce complexity and increase legibility.
 
 Let's compare a few popular implementations of TodoMVC to one written with Aeon.  For this comparison, we will look at custom SLOC (lines of source code) in each project.  To count SLOC I included all files in: index.html, /js, and /css.
 
### project / custom SLOC
* [Backbone.js](http://todomvc.com/examples/backbone/) / 423
* [AngularJS](http://todomvc.com/examples/angularjs/#/) / 442
* [Ember.js](http://todomvc.com/examples/emberjs/) / 1281
* [Knockout.js](http://todomvc.com/examples/knockoutjs/) / 254
* [React](http://todomvc.com/examples/react/#/) / 520
* [Aeon](http://code.gavinengel.com/aeonx/examples/todomvc/) / 260
