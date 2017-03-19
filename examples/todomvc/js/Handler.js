
/**
 * Add a list-item to our todo list
 * The list-item has a unique id added to its data-id attribute.
 * Also adds to localStorage simultaneously, unless skipStorage = true
 */
var $addTodo = function(e, msg, id, completed, skipStorage) {
  if (e) var msg = e.target[0].value;

  if (msg) {
    var newTag = document.createElement('li'); 

    // convert label to input:
    var checked = (completed)? 'checked="checked"' : '';
    var html = '<div class="view"><input class="toggle" type="checkbox" '+checked+'><input class="label" value="'+msg+'" disabled="disabled" />' +
      '<button class="destroy"></button> </div> <input class="edit" value="asdf">'

    var id = id || Math.random().toString(36).substr(2, 10); // id holds a random 10-character base-36 number
    newTag.setAttribute('data-id', id);

    newStatus = (completed)? 'completed' : '';
    newTag.setAttribute('class', newStatus)

    newTag.innerHTML = html;
    document.getElementsByClassName('todo-list')[0].appendChild(newTag);
    var elm = document.querySelector( '.new-todo' )
    elm.value = '';

    if (!skipStorage) {
      // add to localStorage
      var todos = JSON.parse(localStorage.getItem('todos')) || [];
      todos.push({id:id, msg: msg });
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }
}


/**
 * Removes the list-item from the DOM as well as localStorage
 */
var $delTodo = function(e) {
  var todo = e.srcElement.closest("li");  
  todo.parentNode.removeChild(todo);
  _removeStore(todo.getAttribute('data-id'));
}


/**
 * Toggle the complete/uncomplete of a list-item
 */
var $toggleTodo = function(e) {
  var todo = e.srcElement.closest("li");  
  currentStatus = todo.getAttribute('class')
  newStatus = (currentStatus == 'completed')? '' : 'completed'
  todo.setAttribute('class', newStatus)

  // modify localStorage
  var id = todo.getAttribute('data-id');
  var todos = JSON.parse(localStorage.getItem('todos')) || [];
  if (todos) {
    for (var i = 0; i < todos.length; i++) {
      if (todos[i] && todos[i].id == id) {
        todos[i].completed = (newStatus)? true : false; 
      }
    }
  }
  localStorage.setItem('todos', JSON.stringify(todos));

  return true
}


/**
 * Remove all completed items from both DOM and localStorage
 */
var $clearCompleted = function(e) {
  var elms = document.querySelectorAll( 'li.completed' ) 
  for( i=0; i < elms.length; i++ ) {
    elm = elms[i];
    _removeStore(elm.getAttribute('data-id'));
    elm.parentNode.removeChild(elm); 
  }
}


/**
 * Remove item from localStorage
 */
var _removeStore = function(id) {
  var todos = JSON.parse(localStorage.getItem('todos')) || [];
  if (todos) {
    for (var i = 0; i < todos.length; i++) {
      if (todos[i] && todos[i].id == id) {
        todos.splice(i, 1) 
      }
    }
  }
  localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * Module export
 */
Handler = {
    clearCompleted: $clearCompleted,
    addTodo: $addTodo,
    delTodo: $delTodo,
    toggleTodo: $toggleTodo
}