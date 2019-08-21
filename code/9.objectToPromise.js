function isPromise(obj) {
  return 'function' == typeof obj.then;
}
function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}
function isObject(val) {
  return Object == val.constructor;
}
function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    
    // 如果是 promise
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  // 对所有包装的 item 调用 promise.all
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // 预定义结果中的键，js 引擎喜欢稳定的对象
    results[key] = undefined;
    // 往数组种添加 promise
    // [1, 2, 3, promise, promise]
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

objectToPromise({
  a: 1,
  b: [2, 3],
  c: new Promise(resolve => {
    setTimeout(() => resolve(1), 500)
  })
}).then(res => {
  console.log(res);
})