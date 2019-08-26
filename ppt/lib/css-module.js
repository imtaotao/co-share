window.CssModule = (function () {
  const SINGLE_QUOTE = '\''.charCodeAt(0)
  const DOUBLE_QUOTE = '"'.charCodeAt(0)
  const BACKSLASH = '\\'.charCodeAt(0)
  const SLASH = '/'.charCodeAt(0)
  const NEWLINE = '\n'.charCodeAt(0)
  const SPACE = ' '.charCodeAt(0)
  const FEED = '\f'.charCodeAt(0)
  const TAB = '\t'.charCodeAt(0)
  const CR = '\r'.charCodeAt(0)
  const OPEN_SQUARE = '['.charCodeAt(0)
  const CLOSE_SQUARE = ']'.charCodeAt(0)
  const OPEN_PARENTHESES = '('.charCodeAt(0)
  const CLOSE_PARENTHESES = ')'.charCodeAt(0)
  const OPEN_CURLY = '{'.charCodeAt(0)
  const CLOSE_CURLY = '}'.charCodeAt(0)
  const SEMICOLON = ';'.charCodeAt(0)
  const ASTERISK = '*'.charCodeAt(0)
  const COLON = ':'.charCodeAt(0)
  const AT = '@'.charCodeAt(0)

  const CLASS_REG = /\.([^\.),"'\[\]]+)/g
  const RE_AT_END = /[ \n\t\r\f{}()'"\\;/[\]#]/g
  const RE_WORD_END = /[ \n\t\r\f(){}:;@!'"\\\][#]|\/(?=\*)/g
  const RE_BAD_BRACKET = /.[\\/("'\n]/
  const RE_HEX_ESCAPE = /[a-f0-9]/i

  function tokenizer (cssText) {
    let css = cssText.valueOf()
    let code, next, quote, lines, last, content, escape
    let nextLine, nextOffset, escaped, escapePos, prev, n, currentToken

    let length = css.length
    let offset = -1
    let line = 1
    let pos = 0
    let buffer = []
    let returned = []

    function position () {
      return pos
    }

    function unclosed (what) {
      throw new Error(`Unclosed ${what}\n\n line:${line}  column:${pos - offset}`)
    }

    function endOfFile () {
      return returned.length === 0 && pos >= length
    }

    function nextToken () {
      if (returned.length) return returned.pop()
      if (pos >= length) return

      code = css.charCodeAt(pos)
      if (
        code === NEWLINE || code === FEED ||
        (code === CR && css.charCodeAt(pos + 1) !== NEWLINE)
      ) {
        offset = pos
        line += 1
      }

      switch (code) {
        case NEWLINE:
        case SPACE:
        case TAB:
        case CR:
        case FEED:
          next = pos
          do {
            next += 1
            code = css.charCodeAt(next)
            if (code === NEWLINE) {
              offset = next
              line += 1
            }
          } while (
            code === SPACE ||
            code === NEWLINE ||
            code === TAB ||
            code === CR ||
            code === FEED
          )

          currentToken = ['space', css.slice(pos, next)]
          pos = next - 1
          break

        case OPEN_SQUARE:
        case CLOSE_SQUARE:
        case OPEN_CURLY:
        case CLOSE_CURLY:
        case COLON:
        case SEMICOLON:
        case CLOSE_PARENTHESES:
          let controlChar = String.fromCharCode(code)
          currentToken = [controlChar, controlChar, line, pos - offset]
          break

        case OPEN_PARENTHESES:
          prev = buffer.length ? buffer.pop()[1] : ''
          n = css.charCodeAt(pos + 1)
          if (
            prev === 'url' &&
            n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE &&
            n !== SPACE && n !== NEWLINE && n !== TAB &&
            n !== FEED && n !== CR
          ) {
            next = pos
            do {
              escaped = false
              next = css.indexOf(')', next + 1)
              if (next === -1) {
                unclosed('bracket')
              }
              escapePos = next
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1
                escaped = !escaped
              }
            } while (escaped)

            currentToken = ['brackets', css.slice(pos, next + 1),
              line, pos - offset,
              line, next - offset
            ]

            pos = next
          } else {
            next = css.indexOf(')', pos + 1)
            content = css.slice(pos, next + 1)

            if (next === -1 || RE_BAD_BRACKET.test(content)) {
              currentToken = ['(', '(', line, pos - offset]
            } else {
              currentToken = ['brackets', content,
                line, pos - offset,
                line, next - offset
              ]
              pos = next
            }
          }

          break

        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          quote = code === SINGLE_QUOTE ? '\'' : '"'
          next = pos
          do {
            escaped = false
            next = css.indexOf(quote, next + 1)
            if (next === -1) {
              unclosed('string')
            }
            escapePos = next
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1
              escaped = !escaped
            }
          } while (escaped)

          content = css.slice(pos, next + 1)
          lines = content.split('\n')
          last = lines.length - 1

          if (last > 0) {
            nextLine = line + last
            nextOffset = next - lines[last].length
          } else {
            nextLine = line
            nextOffset = offset
          }

          currentToken = ['string', css.slice(pos, next + 1),
            line, pos - offset,
            nextLine, next - nextOffset
          ]

          offset = nextOffset
          line = nextLine
          pos = next
          break

        case AT:
          RE_AT_END.lastIndex = pos + 1
          RE_AT_END.test(css)
          if (RE_AT_END.lastIndex === 0) {
            next = css.length - 1
          } else {
            next = RE_AT_END.lastIndex - 2
          }

          currentToken = ['at-word', css.slice(pos, next + 1),
            line, pos - offset,
            line, next - offset
          ]

          pos = next
          break

        case BACKSLASH:
          next = pos
          escape = true
          while (css.charCodeAt(next + 1) === BACKSLASH) {
            next += 1
            escape = !escape
          }
          code = css.charCodeAt(next + 1)
          if (
            escape &&
            code !== SLASH &&
            code !== SPACE &&
            code !== NEWLINE &&
            code !== TAB &&
            code !== CR &&
            code !== FEED
          ) {
            next += 1
            if (RE_HEX_ESCAPE.test(css.charAt(next))) {
              while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                next += 1
              }
              if (css.charCodeAt(next + 1) === SPACE) {
                next += 1
              }
            }
          }

          currentToken = ['word', css.slice(pos, next + 1),
            line, pos - offset,
            line, next - offset
          ]

          pos = next
          break

        default:
          if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
            next = css.indexOf('*/', pos + 2) + 1
            if (next === 0) {
              unclosed('comment')
            }

            content = css.slice(pos, next + 1)
            lines = content.split('\n')
            last = lines.length - 1

            if (last > 0) {
              nextLine = line + last
              nextOffset = next - lines[last].length
            } else {
              nextLine = line
              nextOffset = offset
            }

            currentToken = ['comment', content,
              line, pos - offset,
              nextLine, next - nextOffset
            ]

            offset = nextOffset
            line = nextLine
            pos = next
          } else {
            RE_WORD_END.lastIndex = pos + 1
            RE_WORD_END.test(css)
            if (RE_WORD_END.lastIndex === 0) {
              next = css.length - 1
            } else {
              next = RE_WORD_END.lastIndex - 2
            }

            currentToken = ['word', css.slice(pos, next + 1),
              line, pos - offset,
              line, next - offset
            ]

            buffer.push(currentToken)

            pos = next
          }

          break
      }

      pos++
      return currentToken
    }

    function back (token) {
      returned.push(token)
    }

    return {
      back,
      nextToken,
      endOfFile,
      position
    }
  }

  // Tranfer function
  function genHash(str) {
    let hash = 5381
    let i = str.length

    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i)
    }
    return hash >>> 0
  }

  function isGlobalToken (token, preToken = []) {
    const preIsGlobalToken = preToken[0] === 'word' && preToken[1] === 'global'
    return preIsGlobalToken && token[0] === 'brackets'
  }

  function genModuleStyleName (token, preToken, preFilterToken, path) {
    const styles = {}
    const isGlobal = isGlobalToken(token, preToken)

    // replace class name
    token[1] = token[1].replace(CLASS_REG, (k1, k2) => {
      const hash = '_' + genHash(path + k2)
      if (styles[k2] === undefined) {
        styles[k2] = isGlobal
          ? k2
          : k2 + hash
      }
      return isGlobal ? k1 : k1 + hash
    })

    // replace keyframe
    if (
        token[0] === 'word' &&
        token[1] !== 'global' &&
        preFilterToken[0] === 'at-word' &&
        preFilterToken[1] === '@keyframes'
    ) { token[1] += '_' + genHash(token[1]) }

    return [token, styles]
  }

  function splicingCssText (tokens) {
    let text = ''
    const isPre = t => t[0] === ':' && t[1] === ':'
    const isGlobal = t => t[0] === 'word' && t[1] === 'global'

    for (let i = 0; i < tokens.length; i++) {
      let j = 0
      let token = tokens[i]
      const nextToken = tokens[i + ++j]

      // If a global word (animate)
      if (isPre(token) && isGlobal(nextToken)) {
        do {
          token = tokens[i + ++j]
        } while (token[0] === 'space')

        const keyword = token[1].match(/[^\(\)]+/)
        if (!keyword) {
          throw new Error(`Global syntax error\n\n line:${token[2]}  column:${token[3]}`)
        }

        text += keyword[0]
        i += j
      } else {
        text += token[1]
      }
    }
    return text
  }

  function transferCssText (cssText, path) {
    let scope = []
    let preFilterToken = []
    const result = []
    const styles = {}
    const tokens = tokenizer(cssText)

    while (!tokens.endOfFile()) {
      const token = tokens.nextToken()
      const type = token[0]
      
      if (type === 'at-word' && token[1] === '@media') {
        scope.push('media')
      }

      if (type === '{') {
        if (scope[scope.length - 1] === 'media') {
          scope.pop()
          scope.push('mediaRule')
        } else {
          scope.push('normalRule')
        }
      }

      if (type === '}') {
        scope.pop()
      }

      const isAllow = () => {
        const typeIsNormal = type === 'word' || type === 'brackets' || type === 'at-word'
        // 如果是 media 需要允许编译
        return typeIsNormal && (scope.length === 0 || scope[scope.length - 1] === 'mediaRule')
      }

      if (isAllow()) {
        const [newToken, style] = genModuleStyleName(token, result[result.length - 1], preFilterToken, path)
        preFilterToken = token
        result.push(newToken)
        Object.assign(styles, style)
      } else {
        result.push(token)
      }
    }

    return [splicingCssText(result), styles]
  }

  function cssModule (cssText, path) {
    const [newCssText, styles] = transferCssText(cssText, path)

    // Append to dom tree
    const styleNode = document.createElement('style')
    styleNode.textContent = newCssText
    document.head.appendChild(styleNode)

    return styles
  }

  return res => cssModule(res.resource, res.path)
})()