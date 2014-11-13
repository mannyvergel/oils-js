module.exports = function stackLoader(stack, params) {
  var myStack = stack.slice(0);
  params = params || [];
  //params.push(doNext(stack, params))
  var newParams = params.slice(0);
  newParams.push(doNext(myStack, newParams))
  doNext(myStack, newParams)();
}

function doNext(myStack, newParams) {

 return function next() {

    if (myStack.length > 0) {
      var nextPlugin = myStack.pop();

      nextPlugin.apply(undefined, newParams);
    }
  }
}