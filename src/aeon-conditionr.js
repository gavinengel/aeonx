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

                if (!$compare(e[cnd.lft], cnd.oper, cnd.rgt)) foundFail = true
            }    
            else {
                if ($debug) console.log('1 part condition found', {e:e, eData: eData})

                if (!e[cnd.lft]) foundFail = true
            }
        }
    }

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