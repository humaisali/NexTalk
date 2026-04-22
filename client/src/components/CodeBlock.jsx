import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck, FiCpu } from 'react-icons/fi';

const CodeBlock = ({ content, language = 'javascript', explanation = '', onExplain, isExplaining }) => {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(!!explanation);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = () => {
    setShowExplanation(true);
    if (!explanation) onExplain?.(content, language);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-nt-border bg-[#1E1E1E] w-full max-w-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2D2D2D] border-b border-nt-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-xs text-nt-muted font-mono ml-1">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* AI Explain button */}
          <button
            onClick={handleExplain}
            disabled={isExplaining}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-nt-cyan hover:bg-nt-cyan/10 transition-colors disabled:opacity-50"
            title="AI explain this code"
          >
            <FiCpu size={11} />
            {isExplaining ? 'Explaining…' : 'Explain'}
          </button>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-nt-muted hover:text-nt-text hover:bg-nt-surface2 transition-colors"
          >
            {copied ? <FiCheck size={11} className="text-nt-success" /> : <FiCopy size={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8rem',
          lineHeight: '1.6',
          maxHeight: '300px',
          overflow: 'auto'
        }}
        showLineNumbers
        lineNumberStyle={{ color: '#4a4a4a', fontSize: '0.7rem' }}
      >
        {content}
      </SyntaxHighlighter>

      {/* AI Explanation panel */}
      {showExplanation && (
        <div className="border-t border-nt-border bg-nt-surface2/50 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <FiCpu size={12} className="text-nt-cyan" />
            <span className="text-xs font-semibold text-nt-cyan">AI Explanation</span>
          </div>
          {isExplaining || !explanation ? (
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-nt-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nt-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-nt-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
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
