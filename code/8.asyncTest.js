// 测试原生的 async 函数是否使用了 promise
// 鸭子模型，不要判断是不是鸭子，只要判断像不像鸭子，这里就是判断像不像 promise
const p = {
  then (resolve, reject) {
    console.log('into')
    setTimeout(() => resolve('tao'), 1000)

    // reject 会被 async 的 try catch 捕获
    // reject('err')
  }
};

(async function () {
  try {
    const v = await p
    console.log(v)
  } catch (err) {
    console.log(err)
  }
})()


// 看看 co 是在整个异步问题的解决历史上的哪个关键节点上。我们要看 co 源码了