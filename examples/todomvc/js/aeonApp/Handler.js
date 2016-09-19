
/**
 */
var $addTodo = function(e, msg, id, completed, skipStorage) {
  if (e) var msg = e.target[0].value;

  if (msg) {
    var newTag = document.createElement('li'); 

    // convert label to input:
    var checked = (completed)? 'checked="checked"' : '';
    var html = '<div class="view"><input class="toggle" type="checkbox" '+checked+'><input class="label" value="'+msg+'" disabled="disabled" />' +
      '<button class="destroy"></button> </div> <input class="edit" value="asdf">'

    var id = id || Math.random().toString(36).substr(2, 9);
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
 *
 */
var $delTodo = function(e) {
  var todo = e.srcElement.closest("li");  
  var id = todo.getAttribute('data-id');
  todo.parentNode.removeChild(todo);

  // remove from localStorage
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
 *
 */
var $toggleTodo = function(e) {
  var todo = e.srcElement.closest("li");  
  currentStatus = todo.getAttribute('class')
  newStatus = (currentStatus == 'completed')? '' : 'completed'
  todo.setAttribute('class', newStatus)

  // remove from localStorage
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
 *
 */
var $editTodo = function(e) {
  var target =  e.srcElement;
  target.disabled = (target.disabled == true)? false : true;
}

/**
 *
 */
var $blurTodo = function(e) {
  var target =  e.srcElement;
  target.disabled = true;
}



var $clearCompleted = function(e) {
  var elms = document.querySelectorAll( 'li.completed' ) // TODO use element.queryselectorall instead of document.qsa https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
  for( i=0; i < elms.length; i++ ) {
    elm = elms[i];
    elm.parentNode.removeChild(elm); // TODO caniuse: remove();
  }
}

Handler = {
    clearCompleted: $clearCompleted,
    addTodo: $addTodo,
    delTodo: $delTodo,
    toggleTodo: $toggleTodo,
    editTodo: $editTodo,
    blurTodo: $blurTodo
}