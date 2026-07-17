// Minimal formatter for Engineering Tutor answers.
//
// Deliberately NOT a full markdown library (no react-markdown/remark/katex
// added — this project keeps its dependency list short on purpose). The
// backend prompt (see backend/app/tutor/prompt_builder.py) only ever asks
// Gemini for: **bold** key terms, "- " bullet steps, "1. " numbered steps,
// `inline code`, and standalone equation lines. This covers exactly that,
// nothing more — so a plain answer with none of that syntax still renders
// as plain prose, unchanged.
//
// Equation lines get the same amber "data face" mono treatment already
// used for formulas in HandbookEntry / ContextPanel, so a formula the tutor
// states reads as the same kind of object as a formula in the Handbook.

const EQUATION_HINT = /[=×√≤≥≠π]|\b(FLC|HP|kW|MPCB)\b.*[=]/

function isEquationLine(line) {
  const trimmed = line.trim()
  if (trimmed.length > 90) return false // too long to be a single formula
  if (!trimmed.includes('=')) return false
  return EQUATION_HINT.test(trimmed)
}

function renderInline(text, keyPrefix) {
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  const nodes = []
  let lastIndex = 0
  let match
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="text-text font-semibold">
          {token.slice(2, -2)}
        </strong>
      )
    } else {
      nodes.push(
        <code key={`${keyPrefix}-c${i}`} className="font-mono text-[0.82em] bg-inset border border-steel rounded px-1 py-0.5 text-copper">
          {token.slice(1, -1)}
        </code>
      )
    }
    i += 1
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function parseBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = null // { type: 'ul' | 'ol', items: [] }
  let i = 0

  const flushParagraph = () => {
    if (paragraph.length) {
      const text = paragraph.join(' ').trim()
      if (text) blocks.push({ type: 'p', text })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) { blocks.push(list); list = null }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') { flushParagraph(); flushList(); i += 1; continue }

    const bullet = /^[-•]\s+(.*)/.exec(trimmed)
    const numbered = /^\d+[.)]\s+(.*)/.exec(trimmed)

    if (isEquationLine(trimmed)) {
      flushParagraph(); flushList()
      blocks.push({ type: 'equation', text: trimmed })
      i += 1; continue
    }
    if (bullet) {
      flushParagraph()
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] } }
      list.items.push(bullet[1])
      i += 1; continue
    }
    if (numbered) {
      flushParagraph()
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] } }
      list.items.push(numbered[1])
      i += 1; continue
    }
    flushList()
    paragraph.push(trimmed)
    i += 1
  }
  flushParagraph(); flushList()
  return blocks
}

function Block({ block, index }) {
  if (block.type === 'p') {
    return <p key={index} className="text-sm leading-relaxed">{renderInline(block.text, `p${index}`)}</p>
  }
  if (block.type === 'equation') {
    return (
      <div key={index} className="font-mono text-xs text-amber bg-inset border border-steel rounded-md px-2.5 py-1.5 overflow-x-auto">
        {block.text}
      </div>
    )
  }
  if (block.type === 'ul') {
    return (
      <ul key={index} className="space-y-1">
        {block.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="mt-[0.5rem] w-1 h-1 rounded-full bg-copper shrink-0" />
            <span>{renderInline(item, `ul${index}-${j}`)}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (block.type === 'ol') {
    return (
      <ol key={index} className="space-y-1.5">
        {block.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-copper/15 border border-copper/40 text-copper text-[0.6rem] font-mono flex items-center justify-center">
              {j + 1}
            </span>
            <span>{renderInline(item, `ol${index}-${j}`)}</span>
          </li>
        ))}
      </ol>
    )
  }
  return null
}

export default function TutorMarkdown({ content }) {
  if (!content) return null
  const blocks = parseBlocks(content)
  if (blocks.length === 0) return null
  return <div className="space-y-2">{blocks.map((b, i) => <Block key={i} block={b} index={i} />)}</div>
}
