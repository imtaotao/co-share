// 以下 demo 演示为什么需要回调
function ordinary () {
  let i = 1
  // ...
  return i
}

function callback () {
  let i = 1
  setTimeout(() => {
    return i
  })
}

// demo
const result = ordinary()
console.log(result) // 1

const resultTwo = callback()
console.log(resultTwo) // undefined

// 人们尝试理解异步函数的时候，最大的问题是程序执行的顺序，这取决异步行为，而这是一个无法预测的行为
// 也被函数式编程称呼为副作用，因为不可预测的行为，所以是大部分 bug 的来源。是需要花费很大力气解决的事情

// 疑问：回调函数带来什么样的问题