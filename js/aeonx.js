/**
 * aeonx.js
 * `Controller for DOM Events and Attributes` 
 * example usage: aeonx.fetch('/aeon.json', aeonx.mix)
 * Public methods:
 * - fetch
 * - mix
 */

/**
 * private data tree
 */
var _data = {
    ver: '0.1.1',
    debug: false,
    condOper: ['!=', '>=', '<=', '>', '<', '='], // add single char conditions at end of array
    ext: {},
    // these internal *will* change names frequently, and without notice... 
    priv: {
        valuables: ['input'],
        selectors: []
    },
    // ... as will these data store names.
    proc: {
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
}



/**
 *
 */
var $fetch = function (path, success, error) {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success) success(JSON.parse(xhr.responseText))
            } else {
                if (error) error(xhr)
            }
        }
    }
    xhr.open("GET", path, true)
    xhr.send()
}


/**
 *
 */
var $mix = function(O, p, opts) {
    if (p) { _data.priv.selectors.push(p); }

    for (var property in O) {
        var value      = O[property]

        _data.proc.opts = opts
        _data.proc.src.attr = value
        _data.proc.tar.attr = property

        // Array?
        if (Array.isArray(value)) {
            _mixArray(property, value)
        }
    
        // String?
        else if (typeof value === 'string' || value instanceof String) {
            _set(property, _unstring(value))
        }
    
        // Function?
        else if (typeof value === 'function') {
            _set(property, value)    
        }

        // Plain Object?
        else if (typeof value == 'object' && value.constructor == Object) {
            _mixObject(property, value)
        }
        else if (typeof value === 'boolean' || typeof value === 'number') {
            _set(property, value)    
        }
        else {
            console.error('invalid value', value)
        }
    }
    _data.priv.selectors.pop()
}

/**
 *
 */
var _compare = function(lft, oper, rgt, typecast) {
    result = false

    if (_data.debug) console.log({lft:lft, oper:oper, rgt:rgt})


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

    if (_data.debug) console.log({lft:lft, oper:oper, rgt:rgt, result:result})

    return result
}


/**
 *
 */
var _mixObject = function(property, value) {
    if (property.charAt(0) == '@') {
        _mixRule(property, value)
    }
    else if (Object.keys(value).length > 0) {
        $mix(value, property, _data.proc.opts);    
    }
}

/**
 *
 */
var _mixArray = function(property, value) {
    newValue = _unstring(value[1], _data.proc.opts)
    newOperator = value[0]
    _set(property, newValue, newOperator)
}

/**
 *
 */
var _mixRule = function(property, value) {
    var selector = _data.priv.selectors.join(' ')
    // is a rule.  do not add this to selectors.

    // get `rule`
    var pieces = property.split('(')
    var rule = pieces[0].substr(1).trim().toLowerCase()

    // get `eventConds`
    wholeConds = ''
    eventConds = [] // [{ lft: '', op: '', rgt: '' }]
    if (pieces[1]) {
        pieces = pieces[1].split(')')
        wholeConds = pieces[0].trim()
        condsPieces = wholeConds.split(';')
        
        for (var i = 0; i < condsPieces.length; i++) {
            wholeCond = condsPieces[ i ].trim()
            eventCond = _parseCondition(wholeCond)
            if (!eventCond.oper) {
                eventCond = { lft: 'type' , oper: '=' , rgt: eventCond.lft }
            }

            eventConds.push(eventCond)
        }

    }

    if (rule.substr(0, 2) == 'on') {
        _mixOnRule(selector, value, rule, wholeConds, eventConds)
    }
    else if (rule == 'if') {
        _mixIfRule(property, value)
    }
    else if (rule == 'else') {
        _mixElseRule(value)
    }
    else {
        console.error('bad rule', {rule: rule}); debugger
    }
}

/**
 *
 */
var _mixOnRule = function (selector, value, rule, wholeConds, eventConds){
    
    if (rule != 'on') {
        // is @onEvent rule.
        eventConds.push({ eventType: rule.slice(2) })
    }

    for( i=0; i < eventConds.length; i++ ) {
        eventType = eventConds[i].eventType || eventConds[i].rgt
        _addListeners(eventType, eventConds[i], selector, value)
    }
}


/**
 *
 */
var _mixIfRule = function (property, value) {
// obtain the the left, op, and right from the condition
        var pieces = property.split('(')
        var pieces = pieces[1].split(')')
        _data.proc.cond.raw = pieces[0].trim()
        if ( _evalIf( _data.proc.cond.raw ) ) { 
            $mix(value, null, _data.proc.opts)
        }
}

/**
 *
 */
var _mixElseRule = function (value) {
    // obtain the the left, op, and right from the condition
    if (_data.proc.cond.result === false) {
        $mix(value, null, _data.proc.opts)
    }
    _data.proc.cond.result = null
}


/**
 *
 */
var _addListeners = function (eventType, eventCond, selector, value) {
    // we must add a listener for the current selector + this onEvent.
    var els = document.querySelectorAll( selector )

    for (var i=0; i < els.length; i++ ) {
        newMix = {}
        newMix[selector] = value

        // stash the event data for later use (by saving key to new element attribute)
        var a = document.createAttribute( 'data-' + eventType + '-eid'  )
        var eId = ++_data.proc.eId
        _data.proc.eData[ eId ] = { aeon: newMix, condition: eventCond }
        a.value = eId
        els[i].setAttributeNode( a )

        els[i].addEventListener(eventType, function(e){
            if (_data.debug) console.log(e)
            eAttr = 'data-' + e.type + '-eid'
            eId = e.target.getAttribute( eAttr )
            eData = _data.proc.eData[ eId ]

            var condResult = true
            if (eData.condition.lft) { 
                if (eData.condition.oper && eData.condition.rgt) {
                    if (_data.debug) console.log('3 part condition found', {e:e, eData: eData})

                    condResult = _compare(e[eData.condition.lft], eData.condition.oper, eData.condition.rgt)
                }    
                else {
                    if (_data.debug) console.log('1 part condition found', {e:e, eData: eData})

                    if (!e[eData.condition.lft]) condResult = false
                }
            }
            else {
                if (_data.debug) console.log('no event condition', eventCond)

            }
            
            if (condResult) { 
                if (_data.debug) console.log('condition passed', {e:e, eData: eData})
                $mix(eData.aeon, null, {el: e.target, e: e})

            }
            else {
                if (_data.debug) console.log('condition failed', {e:e, eData: eData})
            }
        })
    }
}

/**
 *
 */
var _evalIf = function (expression) {
    result = false; // aka: _data.proc.cond.result

    var withoutSel = _data.proc.cond.attr = expression
                    
    // is extension-exec?
    if (withoutSel.charAt(0) == '$') {
        // extension-exec
        _data.proc.cond.ext = withoutSel.substr(1)    
        // execute it
        var ext = _data.ext[ _data.proc.cond.ext ]
        var e = {}
        if (_data.proc.opts && _data.proc.opts.hasOwnProperty('e')) {
            e = _data.proc.opts.e
        }

        _data.proc.cond.extReturn = ext(e)
        if (_data.proc.cond.extReturn === true) _data.proc.cond.result = true
    }
    else {
        // not extension-exec
        if (_data.proc.cond.raw.indexOf('&') != -1) {
            pieces = _data.proc.cond.raw.split('&')
            _data.proc.cond.sel = pieces[0].trim()
            _data.proc.cond.attr = withoutSel = pieces[1].trim()
        }    

        var trio = _parseCondition(withoutSel)

        _data.proc.cond.lft = _get(_data.proc.cond.attr, _data.proc.cond.sel)

        console.log('get cond result from:', _data.proc.cond)
        if (_data.proc.cond.oper) {
            _data.proc.cond.result = _compare(_data.proc.cond.lft, _data.proc.cond.oper, _data.proc.cond.rgt)
        }
        else if (_data.proc.cond.lft) {
            _data.proc.cond.result = true
        }

        result = _data.proc.cond.result
    }

    return result
}

/**
 *
 */
var _parseCondition = function (condition) {
    var trio = {
        lft: condition,
        oper: '',
        rgt: '',
    }

    for (var i=0; i < _data.condOper.length; i++ ) {
        if (condition.indexOf( _data.condOper[i] ) != -1) {
            if (_data.debug) console.log('found a conditional operator:', _data.condOper[i])
            trio.oper = _data.proc.cond.oper = _data.condOper[i]
            pieces = condition.split( _data.proc.cond.oper )
            trio.lft = _data.proc.cond.attr = pieces[0].trim()
            trio.rgt = _data.proc.cond.rgt = pieces[1].trim()
            break
        }
    }

    return trio
}

/**
 * 
 */
var _unstring = function(value, opts) {
    if ((typeof value === 'string' || value instanceof String) && value.charAt(0) == '`') {
        // if the VALUE is surrounded by `` marks, remove them.  It shouldn't be seen as a String.
        // remove ` from ends
        value = value.substr(1).slice(0, -1)

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
            if (typeof _data.ext[ pieces[0] ] != 'undefined') {
                parent = _data.ext
                parentName = '_data.ext'
            }
            else if (typeof window[ pieces[0] ] != 'undefined') {
                parent = window
                parentName = 'window'
            }
            else {
                console.error('invalid value:', value); debugger
            }

            // if: extension-link
            if (_data.proc.tar.attr.slice(0, 2) == 'on') {
                value = 'return ' + parentName + '.' + value + '(event);'
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

            _data.proc.src.attr = values[1]
            _data.proc.src.sel = values[0]

            value = _get(values[1], values[0], opts) 
        }
        // c) empty or attribute from same selector:         data-foo
        else {
            if (value.length) {
                value = _get(value, null, opts)    
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
var _get = function(attribute, differentSelector, opts) {
    var result = ''

    if (differentSelector) {
        selector = differentSelector
    }
    else {
        selector = _data.priv.selectors.join(' ')    
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
        if (attribute == 'value' && _data.priv.valuables.indexOf(tag) === -1) { // use textcontent
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


/**
 *
 */
var _operate = function (selector, attribute, newOperator, newValue) {
    var existingValue = _get(attribute, selector)
    switch(newOperator) {
        case '+':
            newValue += existingValue
            break
        case '-':
            newValue -= existingValue
            break
        case '*':
            newValue *= existingValue
            break
        case '/':
            newValue /= existingValue
            break
        case '%':
            newValue %= existingValue
            break
        case '&':
            newValue = existingValue.concat(newValue)
            break
        case '$':
            // this is calling an extension.
            newValue = 'return _data.ext.' + newValue + '(event);'
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

/**
 * 
 */
var _set = function(selatts, newValue, newOperator, opts) {
    
    // if a javascript element...
    if (selatts.charAt(0) == '$') {
        rawTarget = selatts.substr(1)
        // split on dot
        pieces = rawTarget.split('.')

        // first, search in aenic.ext
        extLink = _data.ext
        for (var i = 0; i < pieces.length-1; i++) {

            if (typeof extLink[ pieces[i] ] != 'undefined') {
                extLink = extLink[ pieces[i] ]
            }
            else {
                extLink = null
                break
            }
        }

        // else use global
        if (!extLink) {
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
            selector = _data.priv.selectors.join(' ')
            attribute = selatts
        }

        /// determine final `value`
        if (newOperator) {
            newValue = _operate(selector, attribute, newOperator, newValue)
        }

        if (!selector) debugger

        /// modify all elements
        var els = document.querySelectorAll( selector )
        var i = 0
        for( i=0; i < els.length; i++ ) {
            _setAttribute(els[i], attribute, newValue)
        }

    }
    
}

/**
 *
 */
var _setAttribute = function(el, attribute, newValue) {
    tag = el.tagName.toLowerCase()
    if (attribute == 'value' && _data.priv.valuables.indexOf(tag) === -1) { 
        el.textContent = newValue
    }
    else { // attr, when a=value and tag=input
        if(el.hasAttribute( attribute ) == false) {
            var a = document.createAttribute( attribute )
            a.value = newValue
            el.setAttributeNode(a)
        }
        else {
            $( selector ).attr(attribute, newValue)        
            el.setAttribute(attribute, newValue)
        }
    }
}

/**
 * reveal public members
 */
Æ = æ = aeonx = {
    mix: $mix,
    fetch: $fetch
}
