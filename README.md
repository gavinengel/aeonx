# aeonx
Browser-side runner for Aeon files

Allows running both .aeon and also .aeon.json definitions.

Aeonx is a library for using .aeon definitions directly in the browser.

Uses event delegation, when possible, on the .aeon definition root node.  This is instead of event listeners on target nodes.  This allows dynamically created DOM elements to make use of the same event listeners created at load time.  Without delegation, a background process is required to be able to auto-assign event listeners to new nodes.  This background process could be seen are both more resource intensive, and more complex.   

Aeonx uses `DOMFocusIn` and `DOMFocusOut` in place of `focus` and `blur`.  This is because `focus` and `blur` do not bubble, and are not reliable for event delegation.

The body-tag is default event delegator.  To use a different tag as the event delegator, pass the tag's id as a config option:

  `aeonx.delegator = "someId";` 