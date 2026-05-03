import { MessageSquare } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-6"
       style={{ background: '#011F1B' }}>
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2"
           style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: 'rgba(255,239,178,0.3)' }}>
        <MessageSquare size={30} strokeWidth={2.5} style={{ color: '#013E37' }} />
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 animate-ping"
           style={{ borderColor: 'rgba(255,239,178,0.2)' }} />
    </div>
    <div className="text-center">
      <h1 className="text-2xl font-black tracking-tight" style={{ color: '#FFEFB2' }}>NexTalk</h1>
      <p className="text-xs mt-1" style={{ color: '#7A9E99' }}>Loading your workspace…</p>
    </div>
    <div className="flex gap-1.5">
      {[0, 160, 320].map((d) => (
        <div key={d} className="w-2 h-2 rounded-full animate-bounce"
             style={{ background: '#FFEFB2', opacity: 0.6, animationDelay: `${d}ms` }} />
      ))}
    </div>
  </div>
);

export default LoadingScreen;
