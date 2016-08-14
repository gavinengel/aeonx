
/**
 *
 */
var $fetch = function (path, success, error) {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success) success(xhr.responseText)
            } else {
                if (error) error(xhr)
            }
        }
    }
    xhr.open("GET", path, true)
    xhr.send()
}


module.exports = {
    fetch: $fetch
};