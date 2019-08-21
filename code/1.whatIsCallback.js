// 回调只是使用 js 函数的约定的名称。
// 在 js 语言中没有一种称为 "回调" 的特殊事物，它只是一种约定。使用回调的函数不需要像大多数函数那样立即返回某些结果，而是需要一些时间来产生结果。
// "异步" 这个词，只意味着 "需要一些时间" 或 "将来发生"，而不是现在

// 如何得到函数的返回值
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