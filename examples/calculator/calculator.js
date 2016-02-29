var _priv = 'this is private';
var pub = 'this is public';

neww = {
	pub: pub
}


// TODO: fix `0 bug`.  to replicate: 1-1, 0 is on screen.  then click and num.

// TODO: 2 ifs fails:
/*

		".num": {
			"@onclick": {
				"@if(.screen & value != 0)": {
					".screen & value": ["&", "`value`"]
				},
				"@if(.screen & value = 0)": {
					".screen & value": "`value`"
				}
			}
		},

*/


//TODO 3.2 -3 = ?????

var operators = ['+', '-', 'x', '%']

onClickEqFilter = function(e) {
	var newValue = ''

	// Get the input and button values
	var input = document.querySelector('.screen')
	// If eval key is pressed, calculate and display the result
	var equation = input.innerHTML
	var lastChar = equation[equation.length - 1]
		
	// Replace all instances of x and % with * and / respectively. This can be done easily using regex and the 'g' tag which will replace all instances of the matched character/substring
	equation = equation.replace(/x/g, '*').replace(/%/g, '/')
		
	// Final thing left to do is checking the last character of the equation. If it's an operator or a decimal, remove it
	if(operators.indexOf(lastChar) > -1 || lastChar == '.')
		equation = equation.replace(/.$/, '')
		
	if(equation)
		newValue = eval(equation)

	return newValue
}

onClickDecimal = function(e) {
	result = ''

	if(document.querySelector('.screen').innerHTML.indexOf('.') == -1) {
		result = '.'
	}

	return result
}

onClickOperatorFilter = function(e) {
	newOp = e.target.innerHTML

	var screenEL = document.querySelector('.screen')
	var screenVal = screenEL.innerHTML
	var lastChar = screenVal[screenVal.length - 1]
	
	// prevent ops on empty screen.
	if (!screenVal && newOp != '-') {
		newOp = ''
	}
	
	// remove the last operator (if exists) from screen 
	else if(operators.indexOf(lastChar) > -1 && screenVal.length > 1) {
		// Here, '.' matches any character while $ denotes the end of string, 
		// so anything (will be an operator in this case) at the end of string will get replaced by new operator
		screenEL.innerHTML = screenVal.slice(0, -1);

	}

	return newOp
}
