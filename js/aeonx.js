/**
 * aeonx.js
 * `Controller for DOM Events and Attributes` 
 * example usage: aeonx.fetch('/aeon.json', aeonx.mix)
 * Public methods:
 * - fetch
 * - mix
 */
window.aeonx = {
    ver: '0.1.0',
    debug: false,
    condOper: ['!=', '>=', '<=', '>', '<', '='], // add single char conditions at end of array
    ext: {},
    // these internal *will* change names frequently, and without notice... 
    priv: {
        mixxers: {},
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
aeonx.fetch = function (path, success, error) {
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
aeonx.mix = function(O, p, opts) {
    if (p) { aeonx.priv.selectors.push(p); }

    for (var property in O) {
        var value      = O[property]

        aeonx.proc.opts = opts
        aeonx.proc.src.attr = value
        aeonx.proc.tar.attr = property

        // Array?
        if (Array.isArray(value)) {
            aeonx.priv.mixxers.mixArray(property, value)
        }
    
        // String?
        else if (typeof value === 'string' || value instanceof String) {
            aeonx.priv.set(property, aeonx.priv.unstring(value))
        }
    
        // Function?
        else if (typeof value === 'function') {
            aeonx.priv.set(property, value)    
        }

        // Plain Object?
        else if (typeof value == 'object' && value.constructor == Object) {
            aeonx.priv.mixxers.mixObject(property, value)
        }
        else if (typeof value === 'boolean' || typeof value === 'number') {
            aeonx.priv.set(property, value)    
        }
        else {
            console.error('invalid value', value)
        }
    }
    aeonx.priv.selectors.pop()
}

/**
 *
 */
aeonx.priv.compare = function(lft, oper, rgt, typecast) {
    result = false

    if (aeonx.debug) console.log({lft:lft, oper:oper, rgt:rgt})


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

    if (aeonx.debug) console.log({lft:lft, oper:oper, rgt:rgt, result:result})

    return result
}


/**
 *
 */
aeonx.priv.mixxers.mixObject = function(property, value) {
    if (property.charAt(0) == '@') {
        aeonx.priv.mixxers.mixRule(property, value)
    }
    else if (Object.keys(value).length > 0) {
        aeonx.mix(value, property, aeonx.proc.opts);    
    }
}

/**
 *
 */
aeonx.priv.mixxers.mixArray = function(property, value) {
    newValue = aeonx.priv.unstring(value[1], aeonx.proc.opts)
    newOperator = value[0]
    aeonx.priv.set(property, newValue, newOperator)
}

/**
 *
 */
aeonx.priv.mixxers.mixRule = function(property, value) {
    var selector = aeonx.priv.selectors.join(' ')
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
            eventCond = aeonx.priv.parseCondition(wholeCond)
            if (!eventCond.oper) {
                eventCond = { lft: 'type' , oper: '=' , rgt: eventCond.lft }
            }

            eventConds.push(eventCond)
        }

    }

    if (rule.substr(0, 2) == 'on') {
        aeonx.priv.mixxers.mixOnRule(selector, value, rule, wholeConds, eventConds)
    }
    else if (rule == 'if') {
        aeonx.priv.mixxers.mixIfRule(property, value)
    }
    else if (rule == 'else') {
        aeonx.priv.mixxers.mixElseRule(value)
    }
    else {
        console.error('bad rule', {rule: rule}); debugger
    }
}

/**
 *
 */
aeonx.priv.mixxers.mixOnRule = function (selector, value, rule, wholeConds, eventConds){
    
    if (rule != 'on') {
        // is @onEvent rule.
        eventConds.push({ eventType: rule.slice(2) })
    }

    for( i=0; i < eventConds.length; i++ ) {
        eventType = eventConds[i].eventType || eventConds[i].rgt
        aeonx.priv.addListeners(eventType, eventConds[i], selector, value)
    }
}


/**
 *
 */
aeonx.priv.mixxers.mixIfRule = function (property, value) {
// obtain the the left, op, and right from the condition
        var pieces = property.split('(')
        var pieces = pieces[1].split(')')
        aeonx.proc.cond.raw = pieces[0].trim()
        if ( aeonx.priv.evalIf( aeonx.proc.cond.raw ) ) { 
            aeonx.mix(value, null, aeonx.proc.opts)
        }
}

/**
 *
 */
aeonx.priv.mixxers.mixElseRule = function (value) {
    // obtain the the left, op, and right from the condition
    if (aeonx.proc.cond.result === false) {
        aeonx.mix(value, null, aeonx.proc.opts)
    }
    aeonx.proc.cond.result = null
}


/**
 *
 */
aeonx.priv.addListeners = function (eventType, eventCond, selector, value) {
    // we must add a listener for the current selector + this onEvent.
    var els = document.querySelectorAll( selector )

    for (var i=0; i < els.length; i++ ) {
        newMix = {}
        newMix[selector] = value

        // stash the event data for later use (by saving key to new element attribute)
        var a = document.createAttribute( 'data-' + eventType + '-eid'  )
        var eId = ++aeonx.proc.eId
        aeonx.proc.eData[ eId ] = { aeon: newMix, condition: eventCond }
        a.value = eId
        els[i].setAttributeNode( a )

        els[i].addEventListener(eventType, function(e){
            if (aeonx.debug) console.log(e)
            eAttr = 'data-' + e.type + '-eid'
            eId = e.target.getAttribute( eAttr )
            eData = aeonx.proc.eData[ eId ]

            var condResult = true
            if (eData.condition.lft) { 
                if (eData.condition.oper && eData.condition.rgt) {
                    if (aeonx.debug) console.log('3 part condition found', {e:e, eData: eData})

                    condResult = aeonx.priv.compare(e[eData.condition.lft], eData.condition.oper, eData.condition.rgt)
                }    
                else {
                    if (aeonx.debug) console.log('1 part condition found', {e:e, eData: eData})

                    if (!e[eData.condition.lft]) condResult = false
                }
            }
            else {
                if (aeonx.debug) console.log('no event condition', eventCond)

            }
            
            if (condResult) { 
                if (aeonx.debug) console.log('condition passed', {e:e, eData: eData})
                aeonx.mix(eData.aeon, null, {el: e.target, e: e})

            }
            else {
                if (aeonx.debug) console.log('condition failed', {e:e, eData: eData})
            }
        })
    }
}

/**
 *
 */
aeonx.priv.evalIf = function (expression) {
    result = false; // aka: aeonx.proc.cond.result

    var withoutSel = aeonx.proc.cond.attr = expression
                    
    // is extension-exec?
    if (withoutSel.charAt(0) == '$') {
        // extension-exec
        aeonx.proc.cond.ext = withoutSel.substr(1)    
        // execute it
        var ext = aeonx.ext[ aeonx.proc.cond.ext ]
        var e = {}
        if (aeonx.proc.opts && aeonx.proc.opts.hasOwnProperty('e')) {
            e = aeonx.proc.opts.e
        }

        aeonx.proc.cond.extReturn = ext(e)
        if (aeonx.proc.cond.extReturn === true) aeonx.proc.cond.result = true
    }
    else {
        // not extension-exec
        if (aeonx.proc.cond.raw.indexOf('&') != -1) {
            pieces = aeonx.proc.cond.raw.split('&')
            aeonx.proc.cond.sel = pieces[0].trim()
            aeonx.proc.cond.attr = withoutSel = pieces[1].trim()
        }    

        var trio = aeonx.priv.parseCondition(withoutSel)

        aeonx.proc.cond.lft = aeonx.priv.get(aeonx.proc.cond.attr, aeonx.proc.cond.sel)

        console.log('get cond result from:', aeonx.proc.cond)
        if (aeonx.proc.cond.oper) {
            aeonx.proc.cond.result = aeonx.priv.compare(aeonx.proc.cond.lft, aeonx.proc.cond.oper, aeonx.proc.cond.rgt)
        }
        else if (aeonx.proc.cond.lft) {
            aeonx.proc.cond.result = true
        }

        result = aeonx.proc.cond.result
    }

    return result
}

/**
 *
 */
aeonx.priv.parseCondition = function (condition) {
    var trio = {
        lft: condition,
        oper: '',
        rgt: '',
    }

    for (var i=0; i < aeonx.condOper.length; i++ ) {
        if (condition.indexOf( aeonx.condOper[i] ) != -1) {
            if (aeonx.debug) console.log('found a conditional operator:', aeonx.condOper[i])
            trio.oper = aeonx.proc.cond.oper = aeonx.condOper[i]
            pieces = condition.split( aeonx.proc.cond.oper )
            trio.lft = aeonx.proc.cond.attr = pieces[0].trim()
            trio.rgt = aeonx.proc.cond.rgt = pieces[1].trim()
            break
        }
    }

    return trio
}

/**
 * 
 */
aeonx.priv.unstring = function(value, opts) {
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

            parent = {}
            parentName = ''
            if (typeof aeonx.ext[value] != 'undefined') {
                parent = aeonx.ext
                parentName = 'aeonx.ext'
            }
            else if (typeof window[value] != 'undefined') {
                parent = window
                parentName = 'window'
            }
            else {
                console.error('invalid value:', value); debugger
            }

            // if: extension-link
            if (aeonx.proc.tar.attr.slice(0, 2) == 'on') {
                value = 'return ' + parentName + '.' + value + '(event);'
            }
            // else: extension-exec or extension-value
            else {

                if (typeof parent[value] === 'function') {
                    ext = parent[value]
            
                    var e = {}
                    if (opts && opts.hasOwnProperty('e')) {
                        e = opts.e
                    }

                    value = ext(e)
                }
                // ... or if simple variable, get it
                else {
                    value = parent[value]
                }

            }
        }

        // b) new sel & attribute:     #foo .bar & data-foo
        else if (value.indexOf('&') != -1) {
            var values = value.split('&')

            aeonx.proc.src.attr = values[1]
            aeonx.proc.src.sel = values[0]

            value = aeonx.priv.get(values[1], values[0], opts) 
        }
        // c) empty or attribute from same selector:         data-foo
        else {
            if (value.length) {
                value = aeonx.priv.get(value, null, opts)    
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
aeonx.priv.get = function(attribute, differentSelector, opts) {
    var result = ''

    if (differentSelector) {
        selector = differentSelector
    }
    else {
        selector = aeonx.priv.selectors.join(' ')    
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
        if (attribute == 'value' && aeonx.priv.valuables.indexOf(tag) === -1) { // use textcontent
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
aeonx.priv.operate = function (selector, attribute, newOperator, newValue) {
    var existingValue = aeonx.priv.get(attribute, selector)
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
            newValue = 'return aeonx.ext.' + newValue + '(event);'
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
aeonx.priv.set = function(selatts, newValue, newOperator, opts) {
    
    // if a javascript element...
    if (selatts.charAt(0) == '$') {
        rawTarget = selatts.substr(1)
        // split on dot
        pieces = rawTarget.split('.')

        // first, search in aenic.ext
        extLink = aeonx.ext
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
                    newValue = aeonx.priv.operate(selector, attribute, newOperator, newValue)
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
            selector = aeonx.priv.selectors.join(' ')
            attribute = selatts
        }

        /// determine final `value`
        if (newOperator) {
            newValue = aeonx.priv.operate(selector, attribute, newOperator, newValue)
        }

        if (!selector) debugger

        /// modify all elements
        var els = document.querySelectorAll( selector )
        var i = 0
        for( i=0; i < els.length; i++ ) {
            aeonx.priv.setAttribute(els[i], attribute, newValue)
        }

    }
    
}

/**
 *
 */
aeonx.priv.setAttribute = function(el, attribute, newValue) {
    tag = el.tagName.toLowerCase()
    if (attribute == 'value' && aeonx.priv.valuables.indexOf(tag) === -1) { 
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
