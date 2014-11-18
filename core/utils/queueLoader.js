module.exports = function queueLoader(stack, params, cb) {
  var myStack = stack.slice(0).reverse();
  params = params || [];
  //params.push(doNext(stack, params))
  var newParams = params.slice(0);
  newParams.push(doNext(myStack, newParams, cb))
  doNext(myStack, newParams, cb)();
}

function doNext(myStack, newParams, cb) {

 return function next() {

    if (myStack.length > 0) {
      var nextPlugin = myStack.pop();

      nextPlugin.apply(undefined, newParams);
    } else {
      if (cb) {
        cb();
      }
    }
  }
}