import { Button } from "@/components/ui/button";
import {
  getCurrentAudio,
  setCurrentAudio,
  subscribeAudio,
} from "@/hooks/useAudioPrefetch";
import { cn } from "@/lib/utils";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  sampleStartSec?: number;
  sampleEndSec?: number;
  compact?: boolean;
  className?: string;
}

/**
 * On-demand preview player. The <audio> element has no src until the visitor
 * taps play, so no audio bytes are fetched for off-screen or unplayed cards.
 * Only one preview plays at a time: starting a new one stops the previous via
 * the shared current-audio registry, and the element unloads on unmount.
 */
export function AudioPlayer({
  audioUrl,
  sampleStartSec = 0,
  sampleEndSec,
  compact = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(sampleStartSec);
  const [duration, setDuration] = useState(
    sampleEndSec ? sampleEndSec - sampleStartSec : 0,
  );
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // When another player starts (or the current one stops), pause this one.
  useEffect(() => {
    return subscribeAudio((url) => {
      if (url !== audioUrl) stop();
    });
  }, [audioUrl, stop]);

  // Unload the audio element on unmount so no bytes stay in memory.
  useEffect(() => {
    return () => {
      stop();
      const audio = audioRef.current;
      if (audio) {
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, [stop]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const cur = audio.currentTime;
    const end = sampleEndSec ?? audio.duration;
    const range = end - sampleStartSec;
    const elapsed = cur - sampleStartSec;
    setCurrentTime(cur);
    setProgress(range > 0 ? Math.min(elapsed / range, 1) : 0);
    if (cur >= end) {
      stop();
      if (getCurrentAudio() === audioUrl) setCurrentAudio(null);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [sampleStartSec, sampleEndSec, audioUrl, stop]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      stop();
      if (getCurrentAudio() === audioUrl) setCurrentAudio(null);
      return;
    }
    // Claim the single-player slot (stops any other preview).
    setCurrentAudio(audioUrl);
    // Load on demand — only now do we request the audio bytes.
    if (audio.getAttribute("src") !== audioUrl) {
      audio.src = audioUrl;
    }
    audio.currentTime = sampleStartSec;
    try {
      await audio.play();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // autoplay blocked — release the slot so another card can play
      if (getCurrentAudio() === audioUrl) setCurrentAudio(null);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const end = sampleEndSec ?? audio.duration;
    setDuration(end - sampleStartSec);
    audio.currentTime = sampleStartSec;
  };

  const handleEnded = () => {
    stop();
    if (getCurrentAudio() === audioUrl) setCurrentAudio(null);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        data-ocid="audio_player.compact"
      >
        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        >
          <track kind="captions" />
        </audio>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={togglePlay}
          className="w-8 h-8 p-0 rounded-full bg-primary/15 hover:bg-primary/30 flex-shrink-0"
          aria-label={playing ? "Pause" : "Play"}
          data-ocid="audio_player.play_pause_button"
        >
          {playing ? (
            <Pause size={14} className="text-primary" />
          ) : (
            <Play size={14} className="text-primary" />
          )}
        </Button>
        <div
          className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          tabIndex={0}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          data-ocid="audio_player.progress_bar"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono w-10 text-right">
          {fmt(currentTime)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} data-ocid="audio_player">
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      >
        <track kind="captions" />
      </audio>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          onClick={togglePlay}
          className="w-10 h-10 p-0 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 flex-shrink-0 shadow-md"
          aria-label={playing ? "Pause" : "Play"}
          data-ocid="audio_player.play_pause_button"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        <div className="flex-1 space-y-1">
          <div
            className="h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            tabIndex={0}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            data-ocid="audio_player.progress_bar"
          >
            <div
              className="h-full bg-gradient-primary rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span data-ocid="audio_player.current_time">
              {fmt(currentTime)}
            </span>
            <span data-ocid="audio_player.duration">
              -{fmt(Math.max(0, duration - currentTime))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
