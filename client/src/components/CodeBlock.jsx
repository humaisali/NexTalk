import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="rounded-xl overflow-hidden w-full max-w-lg shadow-nt-card border"
         style={{ background: '#1E1E2E', borderColor: '#025A50' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ background: '#181825', borderColor: '#025A50' }}>
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: '#60D4C8' }}>{language}</span>
          <span className="text-xs" style={{ color: '#7A9E99' }}>{lines} {lines === 1 ? 'line' : 'lines'}</span>
        </div>
        <div className="flex items-center gap-1">
          {explanation ? (
            <button onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ color: '#60D4C8' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96,212,200,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Cpu size={11} /><span>Explain</span>
              {showExplanation ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          ) : (
            <button onClick={handleExplain} disabled={isExplaining}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ color: isExplaining ? '#7A9E99' : '#60D4C8' }}
              onMouseEnter={(e) => !isExplaining && (e.currentTarget.style.background = 'rgba(96,212,200,0.1)')}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Cpu size={11} /><span>{isExplaining ? 'Explaining…' : 'Explain'}</span>
            </button>
          )}
          <button onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{ color: copied ? '#4ADE80' : '#7A9E99' }}
            onMouseEnter={(e) => !copied && (e.currentTarget.style.background = 'rgba(255,239,178,0.06)')}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="max-h-64 overflow-auto">
        <SyntaxHighlighter language={language} style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.76rem', lineHeight: '1.6' }}
          showLineNumbers lineNumberStyle={{ color: '#3a3a5c', fontSize: '0.7rem', minWidth: '2.5em' }}>
          {content}
        </SyntaxHighlighter>
      </div>

      {/* Explanation panel */}
      {showExplanation && (
        <div className="border-t px-4 py-3" style={{ borderColor: '#025A50', background: 'rgba(96,212,200,0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={12} style={{ color: '#60D4C8' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#60D4C8' }}>AI Explanation</span>
          </div>
          {isExplaining || !explanation ? (
            <div className="flex items-center gap-2">
              {[0,150,300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                     style={{ background: '#60D4C8', animationDelay: `${d}ms` }} />
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
