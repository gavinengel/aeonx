# aeonx
Browser-side runner for Aeon files

Allows running both .aeon and also .aeon.json definitions.

Aeonx is a library for using .aeon definitions directly in the browser.

## Examples

Here are 3 examples of simple web applications using .aeon files:
 
 * [TodoMVC](http://code.gavinengel.com/aeonx/examples/todomvc/)
 * [Calculator](http://code.gavinengel.com/aeonx/examples/calculator/)
 * [String Manipulation](http://code.gavinengel.com/aeonx/examples/all-operators/)
 

## What are .aeon files?

Aeon is a language to easily manipulate DOM Elements, Attributes, and Events.  Aeon files (example.aeon) are similar to CSS.  Its purpose is to create a language to simplify working with DOM events. [Here is an example](https://github.com/gavinengel/aeonx/blob/master/examples/todomvc/todomvc.aeon) of a single .aeon file.

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

### operators

- `:`   save:           `src : "http://example.com/";`
- `+:`  increment       `data-clicked +: 1;`
- `-:`  decrement       `data-available-clicks -: 1;`
- `*:`	multiply	``
- `/:`	divide		``
- `%:`	modulus		``
- `: #foo`	foo.import (html link-tag template)		``
- `!:`  toggle value    `class !: hidden;`
- `.:`  concatenate     `data-full-string .: "some message;";`


## calling functions

```
// method A
#calculator {
	.eval {
		onclick: $onClickEq  // inserts string into onclick-attr; extension does the attr updating
	}
}

// method B
.eval {
	@onclick {
		.screen & value: $onClickEq // calls extension, then inserts return value to attribute
	}
}
	
```

## available rules
- `@on{Event}`    aeon will add a event listener to each DOM node with your previously specified selector
- `@on({Event},{Event},{Event})`	similar to above, except aeon adds event listener for each event-type


## function calls

```
#foo {
  onclick: $handlers.example;
  ondblclick: $handlers.example2;
}
@onclick {
  $stores.example: $filters.example;
}
```

 ## How can .aeon files help?
 
 Aeon files can reduce the lines of source code, compared to popular JavaScript frameworks.  For simplistic frontend projects, using an Aeon file instead of a heavy framework, such as Angular, can reduce complexity and increase legibility.
 
 Let's compare a few popular implementations of TodoMVC to one written with Aeon.  For this comparison, we will look at custom SLOC (lines of source code) in each project.  To count SLOC I included all files in: index.html, /js, and /css.
 
### project / custom SLOC (fewer is better) 

* [Ember.js](http://todomvc.com/examples/emberjs/) / 1281 lines 
* [React](http://todomvc.com/examples/react/#/) / 520 lines 
* [AngularJS](http://todomvc.com/examples/angularjs/#/) / 442 lines 
* [Backbone.js](http://todomvc.com/examples/backbone/) / 423 lines 
* [Knockout.js](http://todomvc.com/examples/knockoutjs/) / 254 lines 
* [Aeon](http://code.gavinengel.com/aeonx/examples/todomvc/) / 253 lines 

Even without the heavier framework libraries, the Aeon implementation of TodoMVC implements the project goal.  Additionally, Aeon focuses on manipulating normal HTML5 attributes without new DOM syntax (for example, see the HTML of [Angular](https://github.com/tastejs/todomvc/blob/gh-pages/examples/angularjs/index.html), [Ember](https://github.com/tastejs/todomvc/blob/gh-pages/examples/emberjs/index.html), and [Knockout](https://github.com/tastejs/todomvc/blob/gh-pages/examples/knockoutjs/index.html)).  This allows for HTML to remain 100% valid.  This is helpful for many reasons, such as better text-editor linting, avoidance of mixing languages, as well as reducing time to switch between libraries/frameworks at a later day.

## Event Delegation

Uses event delegation, when possible, on the .aeon definition root node.  This is instead of event listeners on target nodes.  This allows dynamically created DOM elements to make use of the same event listeners created at load time.  Without delegation, a background process is required to be able to auto-assign event listeners to new nodes.  This background process could be seen are both more resource intensive, and more complex.   

Aeonx uses `DOMFocusIn` and `DOMFocusOut` in place of `focus` and `blur`.  This is because `focus` and `blur` do not bubble, and are not reliable for event delegation.

The body-tag is default event delegator.  To use a different tag as the event delegator, pass the tag's id as a config option:

  `aeonx.delegator = "someId";` 
