


/**
 * 
 */
var $set = function(selatts, newValue, newOperator, opts) {
    
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
    if (attribute == 'value' && tag != 'input') { 
        el.textContent = newValue
    }
    else { // attr, when a=value and tag=input
        if(el.hasAttribute( attribute ) == false) {
            var a = document.createAttribute( attribute )
            a.value = newValue
            el.setAttributeNode(a)
        }
        else {
            el.setAttribute(attribute, newValue)
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
var $get = function(attribute, differentSelector, opts) {
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