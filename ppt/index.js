
// 删除不支持的信息
const notSupport = document.getElementById('notSupport')
if (notSupport) {
  notSupport.parentNode.removeChild(notSupport)
}

require('./global.css')
const Grass = require('@Grass')
const Root = require('@comp/root/index')

// 语法高亮指令
Grass.directive('lighlight', dom => {
  dom.querySelectorAll('code').forEach(block => {
    hljs.highlightBlock(block)
  })
})

// 初始化组件
Root.$mount(document.getElementById('root'))
// 初始化 ppt
impress().init()