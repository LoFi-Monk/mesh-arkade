import type {
  DatHeader,
  DatGame,
  DatRom,
  DatParseResult,
  DatParseError,
} from './types.js'

type TokenType = 'identifier' | 'literal' | 'open' | 'close'

interface Token {
  type: TokenType
  value: string
  line: number
}

/**
 * @intent   Tokenize CLRMamePro format content into a stream of tokens.
 * @guarantee On return, contains an array of tokens with type, value, and line number.
 */
export function tokenize(content: string): Token[] {
  const normalized = content.replace(/\r\n/g, '\n')
  const tokens: Token[] = []
  let i = 0
  let line = 1
  let inQuotes = false

  while (i < normalized.length) {
    const char = normalized[i]

    if (char === '\n') {
      line++
      i++
      continue
    }

    if (inQuotes) {
      if (char === '"') {
        tokens.push({ type: 'literal', value: '', line })
        inQuotes = false
        i++
        continue
      }
      let value = ''
      while (i < normalized.length) {
        const c = normalized[i]
        if (c === '\n') {
          line++
        }
        if (c === '"') {
          i++
          inQuotes = false
          break
        }
        value += c
        i++
      }
      tokens.push({ type: 'literal', value, line })
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'open', value: '(', line })
      i++
      continue
    }

    if (char === ')') {
      tokens.push({ type: 'close', value: ')', line })
      i++
      continue
    }

    if (char === ' ' || char === '\t' || char === '\r') {
      i++
      continue
    }

    let value = ''
    const startLine = line
    while (i < normalized.length) {
      const c = normalized[i]
      if (c === ' ' || c === '\t' || c === '\n' || c === '(' || c === ')') {
        break
      }
      value += c
      i++
    }

    if (value.length > 0) {
      tokens.push({ type: 'identifier', value, line: startLine })
    }
  }

  return tokens
}

interface ParseContext {
  type: 'root' | 'header' | 'clrmamepro' | 'game' | 'rom' | 'skip'
  fields: Map<string, string>
  children: ParseContext[]
  parent?: ParseContext
}

const BLOCK_TYPES = new Set(['clrmamepro', 'header', 'game', 'rom'])

function isBlockStart(token: Token, nextToken: Token | undefined): boolean {
  if (!nextToken || nextToken.type !== 'open') return false
  return BLOCK_TYPES.has(token.value)
}

function parseTokens(tokens: Token[]): DatParseResult | DatParseError {
  const root: ParseContext = {
    type: 'root',
    fields: new Map(),
    children: [],
  }

  const stack: ParseContext[] = [root]
  let parenDepth = 0
  let lastOpenLine = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue

    if (token.type === 'identifier') {
      const nextToken = tokens[i + 1]
      if (isBlockStart(token, nextToken)) {
        parenDepth++
        lastOpenLine = token.line
        const context: ParseContext = {
          type: token.value as 'header' | 'clrmamepro' | 'game' | 'rom',
          fields: new Map(),
          children: [],
        }
        const parent = stack[stack.length - 1]
        if (parent) {
          parent.children.push(context)
        }
        stack.push(context)
        i++
        continue
      }

      if (nextToken && nextToken.type === 'open') {
        parenDepth++
        lastOpenLine = token.line
        const context: ParseContext = {
          type: 'skip',
          fields: new Map(),
          children: [],
        }
        const parent = stack[stack.length - 1]
        if (parent) {
          parent.children.push(context)
        }
        stack.push(context)
        i++
        continue
      }

      const peekToken = tokens[i + 1]
      if (peekToken && (peekToken.type === 'identifier' || peekToken.type === 'literal')) {
        const key = token.value
        const value = peekToken.value
        const current = stack[stack.length - 1]
        if (current) {
          current.fields.set(key, value)
        }
        i++
        continue
      }
    }

    if (token.type === 'close') {
      parenDepth--
      if (stack.length > 1) {
        stack.pop()
      }
    }
  }

  if (parenDepth > 0) {
    return {
      ok: false,
      error: {
        type: 'parse-error',
        message: 'Unmatched opening parenthesis',
        line: lastOpenLine,
      },
    }
  }

  if (parenDepth < 0) {
    return {
      ok: false,
      error: {
        type: 'parse-error',
        message: 'Unmatched closing parenthesis',
      },
    }
  }

  let header: DatHeader = {
    name: '',
  }
  const games: DatGame[] = []

  for (const child of root.children) {
    if (child.type === 'header' || child.type === 'clrmamepro') {
      header = extractHeader(child.fields)
    } else if (child.type === 'game') {
      const game = extractGame(child)
      if (game) {
        games.push(game)
      }
    }
  }

  if (!header.name) {
    return {
      ok: false,
      error: {
        type: 'parse-error',
        message: 'Missing required header name',
      },
    }
  }

  return {
    ok: true,
    dat: {
      header,
      games,
    },
  }
}

function extractHeader(fields: Map<string, string>): DatHeader {
  const header: DatHeader = {
    name: fields.get('name') || '',
  }

  const description = fields.get('description')
  if (description !== undefined) header.description = description

  const version = fields.get('version')
  if (version !== undefined) header.version = version

  const author = fields.get('author')
  if (author !== undefined) header.author = author

  const homepage = fields.get('homepage')
  if (homepage !== undefined) header.homepage = homepage

  const url = fields.get('url')
  if (url !== undefined) header.url = url

  return header
}

function extractGame(context: ParseContext): DatGame | null {
  const name = context.fields.get('name')
  if (!name) return null

  const game: DatGame = {
    name,
    roms: [],
  }

  const description = context.fields.get('description')
  if (description !== undefined) game.description = description

  const comment = context.fields.get('comment')
  if (comment !== undefined) game.comment = comment

  for (const child of context.children) {
    if (child.type === 'rom') {
      const rom = extractRom(child.fields)
      game.roms.push(rom)
    }
  }

  return game
}

function extractRom(fields: Map<string, string>): DatRom {
  const name = fields.get('name') || ''
  const sizeStr = fields.get('size') || '0'
  const size = parseInt(sizeStr, 10)

  const rom: DatRom = {
    name,
    size: isNaN(size) ? 0 : size,
  }

  const crc = fields.get('crc')
  if (crc) rom.crc = crc.toUpperCase()

  const md5 = fields.get('md5')
  if (md5) rom.md5 = md5.toUpperCase()

  const sha1 = fields.get('sha1')
  if (sha1) rom.sha1 = sha1.toUpperCase()

  const serial = fields.get('serial')
  if (serial) rom.serial = serial

  return rom
}

/**
 * @intent   Parse CLRMamePro format DAT content into typed DatFile structures.
 * @guarantee On return, contains either a parsed DatFile or a typed error with line number context.
 * @constraint Input must be valid CLRMamePro format string. Unknown fields are silently ignored.
 */
export function parseDat(content: string): DatParseResult | DatParseError {
  if (!content || content.trim().length === 0) {
    return {
      ok: false,
      error: {
        type: 'parse-error',
        message: 'Empty input',
      },
    }
  }

  const tokens = tokenize(content)
  return parseTokens(tokens)
}
