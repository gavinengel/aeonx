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