var $translatr = require("./aeon-translatr.js");
var $net = require("./aeon-net.js");
var $domcrud = require("./aeon-domcrud.js");
var $conditionr = require("./aeon-conditionr.js");

/**
 * data tree
 */

var $debug = true
var $delegate = ''

var _data = {
    ver: '0.4.1',
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
var $runAeon = function(str) {
    var obj = $translatr.parse(str)
    return $run(obj)
}

/**
 *
 */
var $runJson = function(str) {
    var obj = JSON.parse(str)
    return $run(obj)
}




/**
 *
 */
var $run = function(O, p, opts) {
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
        $run(value, property, _data.opts);    
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
    if (eventConds.length) {
        console.log('add _execOnRule '+eventType+' for multiple listeners: '+selector)

        ///for( i=0; i < eventConds.length; i++ ) {
            ///eventType = eventConds[i].eventType || eventConds[i].rgt
            _addListeners(eventType, eventConds, selector, value)
        ///}
    }

    // otherwise add a single listener
    else {
        console.log('add _execOnRule '+eventType+' for single listener: '+selector)
        _addListeners(eventType, [], selector, value)
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
            $run(value, null, _data.opts)
        }
}

/**
 *
 */
var _execElseRule = function (value) {
    // obtain the the left, op, and right from the condition
    if (_data.cond.result === false) {
        $run(value, null, _data.opts)
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
                console.log({line:604, target: target, selector:selector})
                if (target.matches(selector)) {
                    if (e != lastEvent) {
                        lastEvent = e;
                        console.log('found!', selector)
                        console.log(target)
                        console.log({a:a, eId:eId, _data:_data})

                        eData = _data.eData[ eId ]

                        
                        var foundFail = $conditionr.multiCompare(e, eData)

                        
                        if (!foundFail || !eData.conditions.length) { 
                            if ($debug) console.log('condition passed', {e:e, eData: eData})
                            $run(eData.aeon, null, {el: e.currentTarget, e: e})

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
    //run: $run,
    runAeon: $runAeon,
    runJson: $runJson,
    fetch: $net.fetch
}



