import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Cpu, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const CodeBlock = ({ content, language = 'javascript', explanation = '', onExplain, isExplaining }) => {
  const [copied,          setCopied]          = useState(false);
  const [showExplanation, setShowExplanation] = useState(!!explanation);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = () => {
    setShowExplanation(true);
    if (!explanation && !isExplaining) onExplain?.(content, language);
  };

  const lines = content.split('\n').length;

  return (
    <div
      className="rounded-2xl overflow-hidden w-full max-w-lg"
      style={{
        background: '#0D1117',
        border: '1px solid rgba(96,212,200,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,212,200,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'linear-gradient(90deg, rgba(13,17,23,0.95), rgba(15,20,28,0.95))',
          borderBottom: '1px solid rgba(96,212,200,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex gap-1.5">
            {['#FF5F56', '#FFBD2E', '#27C93F'].map((c) => (
              <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: '#60D4C8',
              background: 'rgba(96,212,200,0.1)',
              border: '1px solid rgba(96,212,200,0.2)',
            }}
          >
            {language}
          </span>
          <span className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>
            {lines} {lines === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {explanation ? (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all duration-150"
              style={{ color: '#60D4C8' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96,212,200,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Cpu size={11} />
              <span>Explain</span>
              {showExplanation ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          ) : (
            <button
              onClick={handleExplain}
              disabled={isExplaining}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all duration-150"
              style={{ color: isExplaining ? '#7A9E99' : '#60D4C8' }}
              onMouseEnter={(e) => !isExplaining && (e.currentTarget.style.background = 'rgba(96,212,200,0.1)')}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Cpu size={11} />
              <span>{isExplaining ? 'Explaining…' : 'Explain'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all duration-150"
            style={{ color: copied ? '#4ADE80' : '#7A9E99' }}
            onMouseEnter={(e) => !copied && (e.currentTarget.style.background = 'rgba(255,239,178,0.06)')}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="max-h-64 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.75rem',
            lineHeight: '1.7',
          }}
          showLineNumbers
          lineNumberStyle={{ color: '#2d3748', fontSize: '0.68rem', minWidth: '2.5em' }}
        >
          {content}
        </SyntaxHighlighter>
      </div>

      {/* Explanation panel */}
      {showExplanation && (
        <div
          className="px-4 py-3.5 animate-fade-in"
          style={{
            borderTop: '1px solid rgba(96,212,200,0.12)',
            background: 'rgba(96,212,200,0.03)',
          }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(96,212,200,0.1)', border: '1px solid rgba(96,212,200,0.2)' }}
            >
              <Sparkles size={11} style={{ color: '#60D4C8' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60D4C8' }}>
              AI Explanation
            </span>
          </div>
          {isExplaining || !explanation ? (
            <div className="flex items-center gap-2.5">
              {[0, 150, 300].map((d) => (
                <div
                  key={d}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#60D4C8', animationDelay: `${d}ms` }}
                />
              ))}
              <span className="text-xs" style={{ color: '#7A9E99' }}>Reading code…</span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: '#D4C98A' }}>{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
