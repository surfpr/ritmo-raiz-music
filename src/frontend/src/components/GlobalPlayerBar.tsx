import { useGlobalPlayer } from "@/hooks/useGlobalPlayer";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "@tanstack/react-router";
import {
  Music2,
  Pause,
  Play,
  ShoppingBag,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback } from "react";

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * Persistent fixed-bottom global player bar. Rendered inside Layout so it
 * appears on every page and survives route navigation. Uses the player-* CSS
 * classes from index.css and the eq-bounce keyframe from tailwind.config.js.
 */
export function GlobalPlayerBar() {
  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    volume,
    muted,
    progress,
    currentTime,
    duration,
    toggle,
    skip,
    setVolume,
    toggleMute,
    seek,
  } = useGlobalPlayer();

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const frac = (e.clientX - rect.left) / rect.width;
      seek(frac);
    },
    [seek],
  );

  const handleProgressKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(progress + 0.05, 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(progress - 0.05, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        seek(0);
      } else if (e.key === "End") {
        e.preventDefault();
        seek(1);
      }
    },
    [seek, progress],
  );

  const title = currentTrack
    ? t(currentTrack.title.es, currentTrack.title.en)
    : t("Ritmo Raíz", "Ritmo Raíz");
  const artist = currentTrack
    ? currentTrack.artist
    : t("Selecciona una canción", "Pick a track");
  const cover = currentTrack?.coverImageUrl;

  return (
    <div className="player-bar" data-ocid="global_player.bar">
      <div className="player-inner flex-col sm:flex-row">
        {/* Cover + track info + transport controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="player-cover" data-ocid="global_player.cover">
            {cover ? (
              <img
                src={cover}
                alt={t("Portada de la canción", "Track cover")}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                <Music2 size={20} className="text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 sm:flex-none sm:w-44">
            <div className="player-track-title" data-ocid="global_player.title">
              {title}
            </div>
            <div
              className="player-track-artist"
              data-ocid="global_player.artist"
            >
              {artist}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="player-control"
              onClick={toggle}
              aria-label={
                isPlaying ? t("Pausar", "Pause") : t("Reproducir", "Play")
              }
              data-ocid="global_player.play_pause_button"
            >
              {isPlaying ? (
                <div className="player-eq" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <Play size={20} className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              className="player-skip"
              onClick={skip}
              aria-label={t("Siguiente canción", "Next track")}
              data-ocid="global_player.skip_button"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Progress + time + volume + store CTA */}
        <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
          <div
            className="player-progress"
            onClick={handleProgressClick}
            onKeyDown={handleProgressKeyDown}
            role="slider"
            tabIndex={0}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("Progreso de la muestra", "Sample progress")}
            data-ocid="global_player.progress_bar"
          >
            <div
              className="player-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="player-progress-knob"
              style={{ left: `${progress * 100}%` }}
            />
          </div>

          <span
            className="player-time hidden sm:inline"
            data-ocid="global_player.time"
          >
            {formatTime(
              currentTime -
                (currentTrack ? Number(currentTrack.sampleStartSec) : 0),
            )}{" "}
            / {formatTime(duration)}
          </span>

          <div className="player-volume">
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:text-foreground transition-smooth"
              aria-label={
                muted ? t("Activar sonido", "Unmute") : t("Silenciar", "Mute")
              }
              data-ocid="global_player.mute_button"
            >
              {muted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={t("Volumen", "Volume")}
              data-ocid="global_player.volume_slider"
            />
          </div>

          <Link
            to="/store"
            className="player-cta"
            data-ocid="global_player.store_cta"
          >
            <ShoppingBag size={16} />
            {t("Tienda", "Store")}
          </Link>
        </div>
      </div>
    </div>
  );
}
