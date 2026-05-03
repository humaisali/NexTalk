import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { EyeOff, Send } from 'lucide-react';

const CodePreview = ({ code, language, onSend, onHide }) => {
  if (!code?.trim()) return null;
  const lines = code.split('\n').length;
  return (
    <div className="rounded-xl overflow-hidden border shadow-nt-card"
         style={{ background: '#1E1E2E', borderColor: 'rgba(96,212,200,0.3)' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b"
           style={{ background: '#181825', borderColor: '#025A50' }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <span className="text-xs font-mono font-semibold" style={{ color: '#60D4C8' }}>{language}</span>
          <span className="text-xs" style={{ color: '#7A9E99' }}>{lines} {lines === 1 ? 'line' : 'lines'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onHide}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{ color: '#7A9E99' }}>
            <EyeOff size={11} /><span>Hide</span>
          </button>
          <button onClick={onSend}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{ background: '#FFEFB2', color: '#013E37' }}>
            <Send size={11} /><span>Send Code</span>
          </button>
        </div>
      </div>
      <div className="max-h-48 overflow-auto">
        <SyntaxHighlighter language={language} style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '0.75rem', background: 'transparent', fontSize: '0.75rem', lineHeight: '1.6' }}
          showLineNumbers lineNumberStyle={{ color: '#3a3a5c', fontSize: '0.7rem' }}>
          {code}
        </SyntaxHighlighter>
      </div>
      <div className="px-4 py-2 border-t" style={{ borderColor: '#025A50', background: 'rgba(96,212,200,0.04)' }}>
        <p className="text-xs" style={{ color: '#7A9E99' }}>
          <span style={{ color: '#60D4C8' }}>AI will auto-explain</span> this snippet for everyone in the room
        </p>
      </div>
    </div>
  );
};

export default CodePreview;
