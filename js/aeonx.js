/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var $translatr = __webpack_require__(1);
	var $net = __webpack_require__(2);
	var $domcrud = __webpack_require__(3);
	var $conditionr = __webpack_require__(4);

	/**
	 * data tree
	 */

	var $debug = false
	var $delegate = ''

	var _data = {
	    ver: '0.4.2',
	    selectors: [],
	    opts: {},
	    e: {},
	    eId: 0,
	    eData: {},
	    sel: "",
	    eventType: "",
	    cond: {
	        raw: "",
	        sel: "",
	        attr: "",
	        ext: "",
	        extReturn: null,
	        oper: "",
	        lft: "",
	        rgt: "",
	        result: null
	    },
	    src: {},
	    tar: {}
	}



	/**
	 *
	 */
	var $run = function(str) {
	    var obj = $translatr.parse(str)
	    return $runObj(obj)
	}

	/**
	 *
	 */
	var $runJson = function(str) {
	    var obj = JSON.parse(str)
	    return $runObj(obj)
	}




	/**
	 *
	 */
	var $runObj = function(O, p, opts) {
	    if (p) { _data.selectors.push(p); }

	    for (var property in O) {
	        var value      = O[property]

	        _data.opts = opts
	        _data.src.attr = value
	        _data.tar.attr = property

	        // Array?
	        if (Array.isArray(value)) {
	            _execArray(property, value)
	        }
	    
	        // String?
	        else if (typeof value === 'string' || value instanceof String) {
	            $domcrud.set(property, _unstringExec(value, _data.opts), null, null, _data)
	        }
	    
	        // Function?
	        else if (typeof value === 'function') {
	            $domcrud.set(property, value, null, null, _data)    
	        }

	        // Plain Object?
	        else if (typeof value == 'object' && value.constructor == Object) {
	            _execObject(property, value)
	        }
	        else if (typeof value === 'boolean' || typeof value === 'number') {
	            $domcrud.set(property, value, null, null, _data)    
	        }
	        else {
	            console.error('invalid value', value)
	        }
	    }
	    _data.selectors.pop()
	}



	/**
	 *
	 */
	var _execObject = function(property, value) {
	    if (property.charAt(0) == '@') {
	        _execRule(property, value)
	    }
	    else if (Object.keys(value).length > 0) {
	        $runObj(value, property, _data.opts);    
	    }
	}

	/**
	 *
	 */
	var _execArray = function(property, value) {
	    newValue = _unstringExec(value[1], _data.opts)
	    newOperator = value[0]
	    $domcrud.set(property, newValue, newOperator, null, _data)
	}

	/**
	 *
	 */
	var _execRule = function(property, value) {
	    var selector = _data.selectors.join(' ')
	    // is a rule.  do not add this to selectors.

	    // get `rule`
	    var pieces = property.split('(')
	    var rule = pieces[0].substr(1).trim().toLowerCase()

	    // get `eventConds`
	    var eventConds = [] // [{ lft: '', op: '', rgt: '' }]
	    if (pieces[1]) {
	        pieces = pieces[1].split(')')
	        condsPieces = pieces[0].trim().split(';') 
	        
	        for (var i = 0; i < condsPieces.length; i++) {
	            wholeCond = condsPieces[ i ].trim()
	            eventCond = $conditionr.parse(wholeCond, _data)
	            if (!eventCond.oper) {
	                eventCond = { lft: 'type' , oper: '=' , rgt: eventCond.lft }
	            }

	            eventConds.push(eventCond)
	        }

	    }


	    if (rule.substr(0, 2) == 'on') {
	        var eventType = (rule.length > 2)? rule.slice(2) : pieces[0].trim()
	        _execOnRule(selector, value, eventType, eventConds)
	    }
	    else if (rule == 'if') {
	        _execIfRule(property, value)
	    }
	    else if (rule == 'else') {
	        _execElseRule(value)
	    }
	    else {
	        console.error('bad rule', {rule: rule}); debugger
	    }
	}

	/**
	 *
	 */
	var _execOnRule = function (selector, value, eventType, eventConds){
	    
	    // there are conditions, loop and add listeners
	    var passConds = []
	    if (eventConds.length) {
	        passConds = eventConds
	    }

	    // loop each eventType (it is possible to pass comma-delimited eventType)
	    var pieces = eventType.split(',');

	    for (var eventTypePiece of pieces) {
	        if (eventTypePiece) _addListeners(eventTypePiece, passConds, selector, value)
	    }


	}


	/**
	 *
	 */
	var _execIfRule = function (property, value) {
	// obtain the the left, op, and right from the condition
	        var pieces = property.split('(')
	        var pieces = pieces[1].split(')')
	        _data.cond.raw = pieces[0].trim()
	        if ( $conditionr.evalIf( _data.cond.raw ) ) { 
	            $runObj(value, null, _data.opts)
	        }
	}

	/**
	 *
	 */
	var _execElseRule = function (value) {
	    // obtain the the left, op, and right from the condition
	    if (_data.cond.result === false) {
	        $runObj(value, null, _data.opts)
	    }
	    _data.cond.result = null
	}

	/**
	 *
	 */
	var _addListeners = function (eventType, eventConds, selector, value) {
	    // we must add a listener for the current selector + this onEvent.
	    ///var els = document.querySelectorAll( selector )
	    var delegateSel = ($delegate)? $delegate : 'body' 
	    var delegate = document.querySelectorAll( delegateSel )[0]      

	console.log({addListeners:[eventType, eventConds, selector, value]});

	    ///for (var i=0; i < els.length; i++ ) {
	        newExec = {}
	        newExec[selector] = value

	        // stash the event data for later use (by saving key to new element attribute)
	        var a = document.createAttribute( 'data-' + eventType + '-eid'  )
	        var eId = ++_data.eId
	        _data.eData[ eId ] = { aeon: newExec, conditions: eventConds }
	        a.value = eId
	        ///els[i].setAttributeNode( a )

	        ///

	        // $(document).on("click", <selector>, handler)
	        lastEvent = {}
	        delegate.addEventListener(eventType, function(e) {
	            for (var target=e.target; target && target!=this; target=target.parentNode) {
	            // loop parent nodes from the target to the delegation node
	                if ($debug) console.log({line:604, target: target, selector:selector})
	                if (target.matches(selector)) {
	                    if (e != lastEvent) {
	                        lastEvent = e;
	                        if ($debug) console.log('found!', selector)
	                        if ($debug) console.log(target)
	                        if ($debug) console.log({a:a, eId:eId, _data:_data})

	                        eData = _data.eData[ eId ]

	                        
	                        var foundFail = $conditionr.multiCompare(e, eData)

	                        
	                        if (!foundFail || !eData.conditions.length) { 
	                            if ($debug) console.log('condition passed', {e:e, eData: eData})
	                            $runObj(eData.aeon, null, {el: e.currentTarget, e: e})

	                        }
	                        else {
	                            if ($debug) console.log('condition failed', {e:e, eData: eData})
	                        }

	                        break;
	                    }
	                }
	            }
	        }, false);

	}




	/**
	 * 
	 */
	var _unstring = function (value) {
	    if ((typeof value === 'string' || value instanceof String) && value.charAt(0) == '`') {
	        // if the VALUE is surrounded by `` marks, remove them.  It shouldn't be seen as a String.
	        // remove ` from ends
	        value = value.substr(1).slice(0, -1)
	    }

	    return value;
	}

	/**
	 * 
	 */
	var _unstringExec = function(value, opts) {
	    if ((typeof value === 'string' || value instanceof String) && value.charAt(0) == '`') {
	        value = _unstring(value)

	        //// a) trigger event
	        if (value.charAt(0) == '@') {
	            // remove @ from front
	            value = value.slice(1)
	        }
	        // else if: extension:
	        else if (value.charAt(0) == '$') { 
	            value = value.slice(1)

	            // split the string at `.`
	            var pieces = value.split('.');

	            parent = {}
	            parentName = ''
	            if (typeof window[ pieces[0] ] != 'undefined') {
	                parent = window
	                parentName = 'window'
	            }
	            else {
	                console.error('invalid value:', value); debugger
	            }

	            // if: extension-link
	            if (_data.tar.attr.slice(0, 2) == 'on') {
	                value = 'return ' + parentName + '.' + value + '(event) || false;' 
	            }
	            // else: extension-exec or extension-value
	            else {
	                // TODO: refactor
	                if (pieces.length == 3) {
	                    var shortcut = parent[ pieces[0] ][ pieces[1] ][ pieces[2] ]
	                }
	                else if (pieces.length == 2) {
	                    var shortcut = parent[ pieces[0] ][ pieces[1] ]
	                }
	                else {
	                    // length is only 1
	                    var shortcut = parent[ pieces[0] ]
	                }


	                if (typeof shortcut === 'function') {
	                    ext = shortcut
	            
	                    var e = {}
	                    if (opts && opts.hasOwnProperty('e')) {
	                        e = opts.e
	                    }

	                    value = ext(e)
	                }
	                // ... or if simple variable, get it
	                else {
	                    value = shortcut
	                }

	            }
	        }

	        // b) new sel & attribute:     #foo .bar & data-foo
	        else if (value.indexOf('&') != -1) {
	            var values = value.split('&')

	            _data.src.attr = values[1].trim()
	            _data.src.sel = values[0].trim()

	            value = $domcrud.get(_data.src.attr, _data.src.sel) 
	        }
	        // c) empty or attribute from same selector:         data-foo
	        else {
	            if (value.length) {
	                opts.el = opts.e.target
	                value = $domcrud.get(value, _data.selectors[0], opts)  // May 25th  
	            }
	            else {
	                value = ''
	            }
	        }
	    }

	    return value
	}




	/**
	 * 
	 */
	aeonx = {
	    debug: $debug,
	    run: $run,
	    runJson: $runJson,
	    fetch: $net.fetch
	}





/***/ },
/* 1 */
/***/ function(module, exports) {

	var $debug = true
	var _preOps = [ '+', '-', '*', '/', '%', '.', '$', '!' ]; // may be used before colon to form special operator

	var _tokenize = function (raw) {


	  /** tokenizer **/
	  raw = raw.replace(/;/g, "; ") 
	  raw = raw.replace(/{/g, " {") // why?  because leaving out space in this causes error:  .someclass{ 
	  var tokens = raw.match(/\S+/g)
	  if ($debug) console.log({tokens1: tokens})

	  // TODO: integrate following block into previous RegExp.match
	  // pop the biop (ex: .:, +:, *:) off the end of some tokens, add to new token
	  var temp = []
	  var len = tokens.length
	  for (var i = 0; i < len; i++ ) {
	    var tok = tokens[i] 
	    // if token has a `:`
	    if (tok.slice(-1) == ':') {
	        withoutColon = tok.slice(0, -1); // remove the ":" from end
	        preOp = '';
	        withoutOp = withoutColon;

	        // is the current last char a preOp char?  
	        lastChar = withoutColon.slice(-1);
	        if (_preOps.indexOf( lastChar ) != -1) {
	            // yes it is.  remove it
	            preOp = withoutColon.slice(-1);
	            withoutOp = withoutColon.slice(0, -1);
	        }
	        op = preOp + ':';
	        temp.push(withoutOp);
	        temp.push(op);

	    }
	    // if the token has `;`
	    else if ( tok.indexOf(';') >= 0) {
	        mid = tok.indexOf(';')
	        temp.push( tok.slice(0, mid) )
	        temp.push( ';')

	        rgtHalf = tok.slice(mid + 1).trim()
	        if (rgtHalf) temp.push(rgtHalf)
	    }
	    // if the token has `(` or `)`
	    else if ( tok.indexOf('(') != -1 || tok.indexOf(')') != -1) {
	        // first the `(`
	        mid = tok.indexOf('(')
	        if (mid != -1) {
	            temp.push( tok.slice(0, mid) )
	            temp.push('(')
	        }

	        // next the `)`
	        rgtHalf = tok.slice(mid + 1)
	        if (rgtHalf.indexOf(')') != -1) {
	            mid = rgtHalf.indexOf(')')
	            temp.push( rgtHalf.slice(0, mid) )
	            temp.push(')')
	        }
	        else {
	            temp.push( rgtHalf )
	        }
	    }
	    else {
	        temp.push(tok)
	    }
	  }
	  tokens = temp
	  if ($debug) console.log({tokens2: tokens})

	  return tokens;
	}


	/**
	 * this fn makes sure that operators are stuck together
	 */
	var _grouper = function (tokens) {

	    groups = []
	    combined = ''
	    len = tokens.length
	    
	    for ( var i = 0; i < len; i++ ) {
	        tok = tokens[i]
	        if (
	            (tok.length == 2 && tok.charAt(1) == ':') || 
	            (['{', '}', ':', ';', '(', ')'].indexOf( tok ) != -1)
	        ) {
	            if (combined) groups.push( combined.trim() )
	            combined = ''
	            groups.push( tok )
	        }
	        else {

	            combined = combined + " " + tok
	        }
	    }

	    return groups
	}


	var _categorizer = function(tokens) {
	    cats = []

	    if (tokens) {
	        prev = ''
	        next = ''
	        // determine key, lft, rgt, mid, par
	        for (var i = 0; i < tokens.length; i++ ) {
	            token = tokens[i]
	            next = tokens[i+1]
	            each = {
	                tok: token,
	                //cat: null,
	                pos: null,
	                //opr: null
	                next: next,
	                prev: prev,
	                unstr: null
	            }

	            //##if (token == '{' || token == '}') each.cat = 'fin';

	            // key
	            if (prev == '') {
	                each.pos = 'key';
	            } else if (prev == '{' && next == '{') {
	                each.pos = 'key';

	            } else if (prev == '}' && next == '{') {
	                each.pos = 'key';
	            }

	            // brk
	            if (token == '}' || token == '{') {
	                each.pos = 'brk';
	            } 

	            // par
	            if (token == ')' || token == '(') {
	                each.pos = 'par';
	            } 

	            // cnd
	            if (token.indexOf( '=' ) != -1) {
	                each.pos = 'cnd';
	            } 

	            // end
	            if (token == ';') {
	                each.pos = 'end';
	            } 

	            // left: if prev == {
	            if (!each.pos) {
	                if (prev == '{' || prev == '}' || prev == ';') {
	                    each.pos = 'lft';
	                }
	            }

	            // middle
	            if (_isOperator(token)) {
	                each.pos = 'mid';
	            }

	            // right
	            if (_isOperator(prev)) {
	                each.pos = 'rgt';
	            }    

	            // unstr
	            if (each.pos == 'rgt') {
	                first = each.tok.charAt(0) 
	                if ( first == '$' || ( first != '"' && first != "'" ) ) {
	                    // make sure it isn't a number
	                    if (isNaN(first)) {
	                        each.unstr = true
	                    }
	                }
	            }

	            prev = each.tok;
	            cats.push(each)
	        }
	    }

	    return cats
	}



	var _isOperator = function(token) {
	    result = false;

	    if (token) {
	        if (token == ':') {
	            result = true;
	        }
	        else if (token.length == 2) {
	            for ( var i = 0; i < _preOps.length; i++ ) {
	                op = _preOps[i] + ':'
	                if (token == op) {
	                    result = true
	                    break
	                }
	            }
	        }
	    }

	    return result;
	}



	var _stringizer = function(cats) {
	    var jsonString = ''

	    if (cats) {

	      var openArray = false
	      for (var i = 0; i < cats.length; i++ ) {
	        cat = cats[i]

	        if (cat.pos == 'brk') {
	            jsonString = jsonString + cat.tok

	            // add comma?
	            if (cat.tok == '}' && cat.next && cat.next != '}') {
	                jsonString = jsonString + ','
	            }
	        } else if (cat.pos == 'key') {
	            jsonString = jsonString + '"' + cat.tok + '":'
	        } else if (cat.pos == 'end') {
	            // found semi colon.  we add no char, or add comma if the next token is not `}`
	            if (cat.next.indexOf('=') != -1) jsonString = jsonString + ';'
	            else if (cat.next != '}' && cat.next != ')') jsonString = jsonString + ','
	        } else if (cat.pos == 'lft') {
	            end = (cat.next == '(')? '' : '"' // { or (

	            if (cat.unstr)
	                jsonString = jsonString + '"`' + cat.tok + '`"'
	            else
	                jsonString = jsonString + '"' + cat.tok + end
	        } else if (cat.pos == 'mid') {
	            if (cat.tok == ':') {
	                jsonString = jsonString + ':'
	            } else {
	                jsonString = jsonString + ': ["' + cat.tok.charAt(0) + '",'  
	                openArray = true       
	            }
	        } else if (cat.pos == 'rgt') {
	            if (cat.tok == '""' || cat.tok == "''") {
	                jsonString = jsonString + '""'
	            } else {

	                if (cat.unstr)
	                    jsonString = jsonString + '"`' + cat.tok + '`"'
	                else if (cat.tok.charAt(0) == "'" || cat.tok.charAt(0) == '"') {
	                    // remove both start/end character, force doublequote
	                    newToken = '"' + (cat.tok.slice( 1 ).slice(0, -1)) + '"'

	                    jsonString = jsonString + newToken
	                }
	                else 
	                    jsonString = jsonString + '"' + cat.tok + '"' 
	            }

	            if (openArray) {
	                jsonString = jsonString + ']'
	                openArray = false
	            }
	        } else if (cat.tok == ')' && cat.next == '{') {
	            jsonString = jsonString + cat.tok + '":'
	        } else {
	            jsonString = jsonString + cat.tok
	        }
	      }
	      jsonString = "\t{" + jsonString + "}\t"

	    }

	  return jsonString
	}

	var $parse = function(raw) {

	  pretokens = _tokenize(raw)
	  if ($debug) console.log('pretokens', pretokens);
	  tokens = _grouper(pretokens)
	  if ($debug) console.log('tokens', tokens);
	  cats = _categorizer(tokens)
	  if ($debug) console.log('cats', cats);

	  jsonString = _stringizer(cats)
	  if ($debug) console.log('jsonString', jsonString);

	  var newObj = JSON.parse(jsonString)

	  return newObj
	}


	module.exports = {
	    parse: $parse
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	
	/**
	 *
	 */
	var $fetch = function (path, success, error) {
	    var xhr = new XMLHttpRequest()
	    xhr.onreadystatechange = function()
	    {
	        if (xhr.readyState === XMLHttpRequest.DONE) {
	            if (xhr.status === 200) {
	                if (success) success(xhr.responseText)
	            } else {
	                if (error) error(xhr)
	            }
	        }
	    }
	    xhr.open("GET", path, true)
	    xhr.send()
	}


	module.exports = {
	    fetch: $fetch
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	


	/**
	 * 
	 */
	var $set = function(selatts, newValue, newOperator, opts, _data) {
	    // if a javascript element...
	    if (selatts.charAt(0) == '`' && selatts.charAt(1) == '$') {
	        rawTarget = _unstring(selatts).substr(1)
	        // split on dot
	        pieces = rawTarget.split('.')

	        extLink = window
	        for (var i = 0; i < pieces.length-1; i++) {

	            if (typeof extLink[ pieces[i] ] != 'undefined') {
	                extLink = extLink[ pieces[i] ]
	            }
	            else {
	                extLink = null
	                break
	            }
	        }
	        // final param of pieces is the element to update/call
	        if (pieces.length > 1) {

	            target = pieces.pop()
	        }

	        // set the target
	        if (extLink !== null) { 
	            if (typeof extLink[target] == 'function') {
	                ext = extLink[target]
	                ext(newValue)
	            }
	            else {
	                if (newOperator) {
	                    newValue = _operate(selector, attribute, newOperator, newValue)
	                }

	                extLink[target] = newValue
	            }
	        }
	        else {
	            console.error('invalid property target', selatts); debugger; 
	        }


	    }
	    // ... else, set DOM object
	    else {
	        if (selatts.indexOf('&') !== -1) {
	            var pieces = selatts.split('&')
	            selector = pieces[0].trim()
	            attribute = pieces[1].trim()
	        }
	        else {
	            selector = _data.selectors.join(' ')
	            attribute = selatts
	        }

	        /// determine final `value`
	        if (newOperator) {
	            newValue = _operate(selector, attribute, newOperator, newValue)
	        }

	        if (!selector) debugger


	        if (selatts.indexOf('&') === -1 && typeof _data.opts != 'undefined') {
	            console.log(72);
	            _setAttribute(_data.opts.e.target, attribute, newValue)
	        }
	        else {

	            /// modify all elements
	            var els = document.querySelectorAll( selector )
	            var i = 0
	            for( i=0; i < els.length; i++ ) {
	                _setAttribute(els[i], attribute, newValue)
	            }
	        }

	    }
	    
	}


	/**
	 *
	 */
	var _setAttribute = function(el, attribute, newValue) {
	    tag = el.tagName.toLowerCase()

	    var booleanAttribute = (attribute == 'disabled' || attribute == 'checked')? true : false;

	    if (attribute == 'value' && tag != 'input') { 
	        el.textContent = newValue
	    }
	    else { // attr, when a=value and tag=input
	        if(el.hasAttribute( attribute ) == false) {
	            if (!booleanAttribute || newValue) {
	                var a = document.createAttribute( attribute )
	                a.value = newValue
	                el.setAttributeNode(a)
	            }
	        }
	        else {
	            if (booleanAttribute && !newValue) {
	                el.removeAttribute(attribute)
	            }
	            else {
	                el.setAttribute(attribute, newValue)
	            }
	        }
	    }
	}


	/**
	 *
	 */
	var _operate = function (selector, attribute, newOperator, newValue) {
	    var existingValue = $get(attribute, selector)
	    switch(newOperator) {
	        case '+':
	            newValue = _toNum(existingValue) + _toNum(newValue) 
	            break
	        case '-':
	            newValue = _toNum(existingValue) - _toNum(newValue)  
	            break
	        case '*':
	            newValue = _toNum(existingValue) * _toNum(newValue)  
	            break
	        case '/':
	            newValue = _toNum(existingValue) / _toNum(newValue) 
	            break
	        case '%':
	            newValue = _toNum(existingValue) % _toNum(newValue) 
	            break
	        case '.':
	            newValue = existingValue.concat(newValue)
	            break
	        case '!': // toggle on/off
	            // split value by spaces
	            var existingValues = existingValue.split(' ')
	            // check for value...
	            var key = existingValues.indexOf(newValue) // TODO indexOf missing from IE8

	            if (key > -1) {
	                // ... exists.  Remove it.
	                console.debug('removed', existingValues.splice(key, 1))
	            }
	            else {
	                // ... doesn't exist.  Add it.
	                existingValues.push(newValue)
	            }
	            newValue = existingValues.join(' ')
	            break
	        default:
	            console.error('invalid newOperator', newOperator)
	    }

	    return newValue
	}


	var _toNum = function (someString) {
	    var someNum = parseFloat(someString)
	    if (isNaN(someNum)) someNum = 0
	    return someNum
	}


	/**
	 * 
	 */
	var $get = function(attribute, differentSelector, opts, _data) {
	    var result = ''

	    if (differentSelector) {
	        selector = differentSelector
	    }
	    else {
	        selector = _data.selectors.join(' ')    
	    }
	    
	    if (opts && opts.hasOwnProperty('el')) {
	        var el = opts.el
	    }
	    else {
	        var el = document.querySelector( selector )
	    }

	    if (el) {
	        // attr or textcontent?
	        tag = el.tagName.toLowerCase()
	        if (attribute == 'value' && tag != 'input') { // use textcontent
	            result = el.textContent
	        }
	        else { // attr, when a=value and tag=input
	            result = el.getAttribute( attribute )
	        }

	        if (result === undefined || result === null) {
	            result = ''
	        }
	    }
	    
	    return result
	}


	module.exports = {
	    get: $get,
	    set: $set,
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	$debug = true
	_condOper = ['!=', '>=', '<=', '>', '<', '='] // add single char conditions at end of array

	/**
	 *
	 */
	var $compare = function(lft, oper, rgt, typecast) {
	    result = false

	    if ($debug) console.log({lft:lft, oper:oper, rgt:rgt})


	    typecast = typecast || typeof lft;

	    if (typecast == 'number') {
	        lft = parseFloat(lft)
	        rgt = parseFloat(rgt)

	    }
	    else if (typecast == 'boolean') {
	        lft = JSON.parse(lft)
	        rgt = JSON.parse(rgt)

	    }

	    switch(oper) {
	        case '=':
	            if (lft == rgt) result = true
	            break
	        case '!=':
	            if (lft != rgt) result = true
	            break
	        case '<':
	            if (lft < rgt) result = true
	            break
	        case '>':
	            if (lft > rgt) result = true
	            break
	        case '<=':
	            if (lft <= rgt) result = true
	            break
	        case '>=':
	            if (lft >= rgt) result = true
	            break
	        default:
	            console.error('invalid oper', oper)
	    }

	    if ($debug) console.log({lft:lft, oper:oper, rgt:rgt, result:result})

	    return result
	}

	/**
	 *
	 */
	var $multiCompare = function(e, eData) {
	    var foundFail = false
	    
	    for (var j=0; j < eData.conditions.length; j++ ) {
	        var cnd = eData.conditions[j]
	        if (cnd.lft) { 
	            if (cnd.oper && cnd.rgt) {
	                if ($debug) console.log('3 part condition found', {e:e, eData: eData})

	                // loop each eventType (it is possible to pass comma-delimited eventType)
	                var pieces = cnd.rgt.split(',');
	                var found = false;
	                for (var eventTypePiece of pieces) {
	                    if ($compare(e[cnd.lft], cnd.oper, eventTypePiece)) found = true;
	                }

	                if (!found) foundFail = true;
	            }    
	            else {
	                if ($debug) console.log('1 part condition found', {e:e, eData: eData})

	                if (!e[cnd.lft]) foundFail = true
	            }
	        }
	    }

	console.log({foundFail:foundFail});

	    return foundFail
	}

	/**
	 *
	 */
	var $evalIf = function (expression) {
	    result = false; // aka: _data.cond.result

	    var withoutSel = _data.cond.attr = expression
	                    
	    // is extension-exec?
	    if (withoutSel.charAt(0) == '$') {
	        // extension-exec
	        _data.cond.ext = withoutSel.substr(1)    
	        // execute it
	        var ext = window[ _data.cond.ext ]
	        var e = {}
	        if (_data.opts && _data.opts.hasOwnProperty('e')) {
	            e = _data.opts.e
	        }

	        _data.cond.extReturn = ext(e)
	        if (_data.cond.extReturn === true) _data.cond.result = true
	    }
	    else {
	        // not extension-exec
	        if (_data.cond.raw.indexOf('&') != -1) {
	            pieces = _data.cond.raw.split('&')
	            _data.cond.sel = pieces[0].trim()
	            _data.cond.attr = withoutSel = pieces[1].trim()
	        }    

	        var trio = $parse(withoutSel, _data)

	        _data.cond.lft = $domcrud.get(_data.cond.attr, _data.cond.sel)

	        console.log('get cond result from:', _data.cond)
	        if (_data.cond.oper) {
	            _data.cond.result = $compare(_data.cond.lft, _data.cond.oper, _data.cond.rgt)
	        }
	        else if (_data.cond.lft) {
	            _data.cond.result = true
	        }

	        result = _data.cond.result
	    }

	    return result
	}

	/**
	 *
	 */
	var $parse = function (condition, _data) {
	    var trio = {
	        lft: condition,
	        oper: '',
	        rgt: ''
	    }

	    for (var i=0; i < _condOper.length; i++ ) {
	        if (condition.indexOf( _condOper[i] ) != -1) {
	            if ($debug) console.log('found a conditional operator:', _condOper[i])
	            trio.oper = _data.cond.oper = _condOper[i]
	            pieces = condition.split( _data.cond.oper )
	            trio.lft = _data.cond.attr = pieces[0].trim()
	            trio.rgt = _data.cond.rgt = pieces[1].trim()
	            break
	        }
	    }

	    return trio
	}

	module.exports = {
	    compare: $compare,
	    multiCompare: $multiCompare,
	    parse: $parse,
	    evalIf: $evalIf
	};

/***/ }
/******/ ]);