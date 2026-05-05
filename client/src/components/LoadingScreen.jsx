import { MessageSquare } from 'lucide-react';

const LoadingScreen = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center gap-8 relative overflow-hidden"
    style={{ background: '#080E0D' }}
  >
    {/* Ambient background */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 70% 60% at 50% 40%, rgba(2,90,80,0.1) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 30% 70%, rgba(255,239,178,0.04) 0%, transparent 60%)
        `,
      }}
    />

    {/* Logo */}
    <div className="relative animate-float">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #FFEFB2 0%, #F5DC6E 50%, #E8C94A 100%)',
          boxShadow: '0 0 60px rgba(255,239,178,0.25), 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <MessageSquare size={36} strokeWidth={2.5} style={{ color: '#013E37' }} />
      </div>
      {/* Pulse ring */}
      <div
        className="absolute inset-0 rounded-3xl animate-ping"
        style={{ border: '2px solid rgba(255,239,178,0.15)', animationDuration: '2s' }}
      />
    </div>

    {/* Brand */}
    <div className="text-center relative z-10">
      <h1 className="text-3xl font-black tracking-tight text-gradient mb-2">NexTalk</h1>
      <p className="text-sm" style={{ color: 'rgba(122,158,153,0.6)' }}>Loading your workspace…</p>
    </div>

    {/* Elegant loading dots */}
    <div className="flex gap-2 relative z-10">
      {[0, 160, 320].map((d, i) => (
        <div
          key={d}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{
            background: i === 0 ? '#FFEFB2' : i === 1 ? 'rgba(255,239,178,0.6)' : 'rgba(255,239,178,0.3)',
            animationDelay: `${d}ms`,
            boxShadow: i === 0 ? '0 0 8px rgba(255,239,178,0.4)' : 'none',
          }}
        />
      ))}
    </div>

    {/* Bottom bar */}
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs"
      style={{ color: 'rgba(122,158,153,0.3)' }}
    >
      AI-Powered Real-Time Chat · Built by Humais Ali
    </div>
  </div>
);

export default LoadingScreen;
