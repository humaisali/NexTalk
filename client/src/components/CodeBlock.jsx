import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck, FiCpu, FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * CodeBlock — renders a syntax-highlighted code message with:
 * - Copy button
 * - AI "Explain" button (calls onExplain)
 * - Collapsible explanation panel
 * - Auto-shows explanation when server pushes it via socket
 *
 * Props:
 *   content       — raw code string
 *   language      — e.g. 'javascript'
 *   explanation   — AI explanation string (may arrive after mount)
 *   onExplain     — fn(code, lang) triggers AI call
 *   isExplaining  — boolean
 */
const CodeBlock = ({ content, language = 'javascript', explanation = '', onExplain, isExplaining }) => {
  const [copied,          setCopied]          = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Auto-open explanation panel when it arrives from socket
  const prevExplanation = explanation;
  if (explanation && !showExplanation && prevExplanation !== explanation) {
    setShowExplanation(true);
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = () => {
    setShowExplanation(true);
    if (!explanation && !isExplaining) onExplain?.(content, language);
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="rounded-2xl overflow-hidden border border-nt-border bg-[#1E1E1E] w-full max-w-lg shadow-lg">

      {/* ── Header bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2D2D2D] border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-xs text-nt-cyan font-mono font-semibold">{language}</span>
          <span className="text-xs text-nt-muted">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Explain toggle */}
          {explanation ? (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-nt-cyan hover:bg-nt-cyan/10 transition-colors"
            >
              <FiCpu size={11} />
              <span>Explanation</span>
              {showExplanation ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
            </button>
          ) : (
            <button
              onClick={handleExplain}
              disabled={isExplaining}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-nt-muted hover:text-nt-cyan hover:bg-nt-cyan/10 transition-colors disabled:opacity-40"
            >
              <FiCpu size={11} />
              <span>{isExplaining ? 'Explaining…' : 'Explain'}</span>
            </button>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-nt-muted hover:text-nt-text hover:bg-nt-surface2 transition-colors"
          >
            {copied ? <FiCheck size={11} className="text-nt-success" /> : <FiCopy size={11} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* ── Code area ────────────────────────────────────────── */}
      <div className="max-h-72 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.78rem',
            lineHeight: '1.65'
          }}
          showLineNumbers
          lineNumberStyle={{ color: '#3a3a3a', minWidth: '2.5em', fontSize: '0.7rem', userSelect: 'none' }}
        >
          {content}
        </SyntaxHighlighter>
      </div>

      {/* ── AI Explanation panel ──────────────────────────────── */}
      {showExplanation && (
        <div className="border-t border-white/5 bg-nt-surface2/60 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <FiCpu size={12} className="text-nt-cyan" />
            <span className="text-xs font-semibold text-nt-cyan uppercase tracking-wider">AI Explanation</span>
          </div>

          {isExplaining || !explanation ? (
            /* Loading dots */
            <div className="flex items-center gap-1.5 py-1">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-nt-cyan animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
              <span className="text-xs text-nt-muted ml-1">Gemini is reading the code…</span>
            </div>
          ) : (
            <p className="text-xs text-nt-muted leading-relaxed">{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
