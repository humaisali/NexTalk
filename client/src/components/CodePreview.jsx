import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiEye, FiEyeOff, FiSend } from 'react-icons/fi';

/**
 * CodePreview — shows a live syntax-highlighted preview of the code
 * the user is about to send. Appears above the input when toggled.
 *
 * Props:
 *   code     — string content to preview
 *   language — programming language for syntax highlighting
 *   onSend   — fn() triggered when user clicks "Send this code"
 *   onHide   — fn() to collapse the preview
 */
const CodePreview = ({ code, language, onSend, onHide }) => {
  if (!code?.trim()) return null;

  const lines = code.split('\n').length;

  return (
    <div className="rounded-2xl overflow-hidden border border-nt-cyan/40 bg-[#1E1E1E] shadow-lg shadow-nt-cyan/10">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#2D2D2D] border-b border-nt-border/60">
        <div className="flex items-center gap-3">
          {/* macOS traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-xs text-nt-cyan font-mono font-semibold">{language}</span>
          <span className="text-xs text-nt-muted">{lines} {lines === 1 ? 'line' : 'lines'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onHide}
            className="flex items-center gap-1 text-xs text-nt-muted hover:text-nt-text px-2 py-1 rounded-lg hover:bg-nt-surface2 transition-colors"
            title="Hide preview"
          >
            <FiEyeOff size={11} />
            <span>Hide</span>
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-1.5 text-xs bg-nt-blue hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            <FiSend size={11} />
            <span>Send Code</span>
          </button>
        </div>
      </div>

      {/* Syntax highlighted code */}
      <div className="max-h-52 overflow-auto">
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
          lineNumberStyle={{ color: '#3a3a3a', minWidth: '2.5em', fontSize: '0.7rem' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-[#2D2D2D]/70 border-t border-nt-border/40">
        <p className="text-xs text-nt-muted/60">
          <span className="text-nt-cyan/70">AI will auto-explain</span> this snippet for everyone in the room
        </p>
      </div>
    </div>
  );
};

export default CodePreview;
