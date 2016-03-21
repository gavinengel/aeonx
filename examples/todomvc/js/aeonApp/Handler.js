

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


var $clearCompleted = function(e) {
  todo.controller.removeCompletedItems()
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
function $getParentByTagName(node, tagname) {
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

Handler = {
    destroy: $destroy,
    clearCompleted: $clearCompleted
}