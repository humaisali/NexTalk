import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

const VoicePlayer = ({ src, isOwn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}${url}`;
  };

  const audioUrl = getFullUrl(src);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    // If audio is already loaded/cached
    if (audio.readyState >= 1 && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Audio play failed:', err);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekValue = parseFloat(e.target.value);
    audio.currentTime = seekValue;
    setCurrentTime(seekValue);
  };

  const formatTime = (timeInSecs) => {
    if (isNaN(timeInSecs) || !isFinite(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If duration is still 0/Infinity and audio is playing or has some currentTime, estimate or fallback
  const displayDuration = duration || currentTime || 0;

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-xl border max-w-xs md:max-w-sm transition-all shadow-sm ${
      isOwn 
        ? 'bg-sec-light/40 border-nt-border2 text-[#FFEFB2]' 
        : 'bg-white dark:bg-nt-bg3 border-gray-200 dark:border-nt-border text-gray-800 dark:text-nt-text'
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Trigger */}
      <button 
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
          isOwn 
            ? 'bg-[#FFEFB2] text-sec-dark hover:bg-white' 
            : 'bg-blue-600 dark:bg-nt-teal text-white dark:text-nt-bg hover:bg-blue-700 dark:hover:bg-[#50c2b7]'
        }`}
      >
        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Progress Track */}
      <div className="flex-1 flex flex-col gap-0.5 min-w-[120px] md:min-w-[150px]">
        <input 
          type="range"
          min={0}
          max={displayDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          className={`w-full h-1 rounded-lg appearance-none cursor-pointer outline-none transition-all ${
            isOwn 
              ? 'bg-sec-dark/50 accent-[#FFEFB2] dark:accent-[#FFEFB2]' 
              : 'bg-gray-200 dark:bg-nt-bg2 accent-blue-600 dark:accent-nt-teal'
          }`}
          style={{
            background: isOwn 
              ? `linear-gradient(to right, #FFEFB2 0%, #FFEFB2 ${(currentTime / (displayDuration || 1)) * 100}%, rgba(1, 43, 38, 0.5) ${(currentTime / (displayDuration || 1)) * 100}%, rgba(1, 43, 38, 0.5) 100%)`
              : `linear-gradient(to right, var(--accent-blue) 0%, var(--accent-blue) ${(currentTime / (displayDuration || 1)) * 100}%, var(--border-light) ${(currentTime / (displayDuration || 1)) * 100}%, var(--border-light) 100%)`
          }}
        />
        <div className="flex justify-between text-[10px] opacity-75 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      <Volume2 size={14} className="opacity-60 flex-shrink-0" />
    </div>
  );
};

export default VoicePlayer;
