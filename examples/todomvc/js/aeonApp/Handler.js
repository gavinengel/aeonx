

/**
 *
 */
var $testr = function(e) {
    alert('testr!');
  if (e.target) {

    console.log({'testerE':e});
  }
}


/**
 */
var $addTodo = function(e) {
  var msg = e.target[0].value
  if (msg) {
    var newTag = document.createElement('li'); 
    // before move .destory and .toggle to .aeon:
    //var html = '<div class="view"><input class="toggle" type="checkbox" onclick="return window.Handler.toggleTodo(event) || false;"><label>'+msg+'</label>' +
    //  '<button class="destroy" onclick="return window.Handler.delTodo(event) || false;"></button> </div> <input class="edit" value="asdf">'

    // after move .destroy:
    //var html = '<div class="view"><input class="toggle" type="checkbox" onclick="return window.Handler.toggleTodo(event) || false;"><label>'+msg+'</label>' +
    //  '<button someattr="" class="destroy"></button> </div> <input class="edit" value="asdf">'

    // after move .toggle:
    //var html = '<div class="view"><input class="toggle" type="checkbox"><label>'+msg+'</label>' +
    //  '<button class="destroy"></button> </div> <input class="edit" value="asdf">'

    // convert label to input:
    var html = '<div class="view"><input class="toggle" type="checkbox"><input class="label" value="'+msg+'" disabled="disabled" />' +
      '<button class="destroy"></button> </div> <input class="edit" value="asdf">'


    newTag.innerHTML = html;
    document.getElementsByClassName('todo-list')[0].appendChild(newTag);
    var elm = document.querySelector( '.new-todo' )
    elm.value = '';
  }
}


/**
 *
 */
var $delTodo = function(e) {
  console.log(e);
  console.log({currentTarget:e.currentTarget});
  var todo = e.srcElement.closest("li");  
  todo.parentNode.removeChild(todo);
}


/**
 *
 */
var $toggleTodo = function(e) {
  var todo = e.srcElement.closest("li");  
  currentStatus = todo.getAttribute('class')
  newStatus = (currentStatus == 'completed')? '' : 'completed'
  todo.setAttribute('class', newStatus)
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
/*

before:

        <ul class="todo-list"></ul>

/*

after:

    <ul class="todo-list"><li>
      <div class="view">
        <input class="toggle" type="checkbox">
        <label>asdf</label>
        <button class="destroy"></button>
      </div>
      <input class="edit" value="asdf">
    </li>
    </ul>


/*
var $destroy = function(e) {
  // get the li-id
  var id = $getNearestLiId(e.target)
  
  // remove li
  //console.log(window)
  //console.log(app)
  //var $Controller = app.Controller()
  //Model.remove(id)
  todo.controller.removeItem(id)

}



var $getNearestLiId = function(node) {
  var parent = $getParentByTagName(node, 'li')
  //console.log({parent: parent})
  return parent.getAttribute('data-id')
}

/**
 * Get parent node for given tagname
 * @param  {Object} node    DOM node
 * @param  {String} tagname HTML tagName
 * @return {Object}         Parent node
 */
/*function $getParentByTagName(node, tagname) {
  var parent;
  if (node === null || tagname === '') return;
  parent  = node.parentNode;
  tagname = tagname.toUpperCase();

  while (parent.tagName !== "HTML") {
    if (parent.tagName === tagname) {
      return parent;
    }
    parent = parent.parentNode;
  }

  return parent;
}
*/

Handler = {
    //destroy: $destroy,
    testr: $testr,
    clearCompleted: $clearCompleted,
    addTodo: $addTodo,
    delTodo: $delTodo,
    toggleTodo: $toggleTodo,
    editTodo: $editTodo,
    blurTodo: $blurTodo
}