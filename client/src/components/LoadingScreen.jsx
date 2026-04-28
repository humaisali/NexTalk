/**
 * LoadingScreen — shown while AuthContext verifies the JWT on app mount.
 * Prevents the login page from flashing for already-authenticated users.
 */
const LoadingScreen = () => (
  <div className="min-h-screen bg-nt-bg flex flex-col items-center justify-center gap-5">
    {/* Animated logo */}
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nt-blue to-nt-cyan flex items-center justify-center shadow-2xl shadow-nt-blue/30">
        <span className="text-white text-2xl font-black">N</span>
      </div>
      {/* Orbit ring */}
      <div className="absolute inset-0 rounded-2xl border-2 border-nt-blue/30 animate-ping" />
    </div>

    {/* Brand */}
    <div className="text-center">
      <h1 className="text-2xl font-bold text-nt-text tracking-tight">
        Nex<span className="text-nt-blue">Talk</span>
      </h1>
      <p className="text-nt-muted text-sm mt-1">Loading your workspace…</p>
    </div>

    {/* Dot loader */}
    <div className="flex gap-1.5">
      {[0, 160, 320].map((delay) => (
        <div
          key={delay}
          className="w-2 h-2 rounded-full bg-nt-blue/60 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
);

export default LoadingScreen;
