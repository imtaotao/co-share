var slice = Array.prototype.slice;
// module.exports = co['default'] = co.co = co;

// const wrap = co.wrap(function * () {})
// const gen = wrap()

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

function co(gen) {
  // 保证正确的 this 指向
  var ctx = this;
  var args = slice.call(arguments, 1);

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    // 调用传入进来的函数，gen 也有可能本身就是一个 generator 对象
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    // 如果是个普通对象就返回
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    // 调用 next
    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
      return null;
    }

    // 出现错误后调用 throw 方法，以便以让 generator 函数中的 try catch 捕获到
    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        // 如果连 generator 函数重点 catch 中都报错了就需要传到最外面去了
        return reject(e);
      }
      next(ret);
    }

    function next(ret) {
      // done 了直接结束整个执行器
      if (ret.done) return resolve(ret.value);

      // 转换成 promise
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);

      // co 只能支持 function promise generator array object  这几种类型，这和 async 函数有点不一样
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

function toPromise(obj) {
  // 这条语句会让上面的判断报 TypeError 错误
  if (!obj) return obj;

  // 判断是否是一个 promise（包括鸭子类型）
  if (isPromise(obj)) return obj;

  // 如果是一个 generator 调用 co, co 会返回一个 promise
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  
  // 进行包装
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);

  // 类似 array 的处理
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

function arrayToPromise(obj) {
  // 对每个元素包装成 promise
  return Promise.all(obj.map(toPromise, this));
}

// 对 对象的每个元素进行包装
function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    
    // 如果是 promise，就放到 promise 数组中去，等待 promise.all 调用
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

// promise theable 所以只需要判读是否有 then 函数（鸭子类型）
function isPromise(obj) {
  return 'function' == typeof obj.then;
}

// 只要你部署了遍历器接口，需要 throw 是因为要 try/catch 捕捉到
function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

 
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

// 只处理 {}
function isObject(val) {
  return Object == val.constructor;
}