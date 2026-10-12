import { ExternalBlob } from "@/backend";
import type { TrackInput } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useBulkAddTracks } from "@/hooks/useQueries";
import {
  MOODS,
  RECOMMENDED_USES,
  TEMPOS,
  VOCAL_TYPES,
  toSelectOptions,
} from "@/lib/filterConstants";
import { GENRE_AISLES, genreLabel, normalizeGenre } from "@/lib/genreAisles";
import { CheckCircle2, Music, Trash2, Upload, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function blobFromFile(
  file: File,
  onProgress?: (p: number) => void,
): Promise<ExternalBlob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let blob = ExternalBlob.fromBytes(bytes);
  if (onProgress) blob = blob.withUploadProgress(onProgress);
  return blob;
}

function ProgressBar({ value }: { value: number }) {
  if (value <= 0 || value >= 100) return null;
  return (
    <div className="mt-2">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Subiendo... {value}%</p>
    </div>
  );
}

/** Strips the extension, turns -/_ into spaces, and title-cases each word. */
function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derives a canonical genre from a filename by matching a known genre token
 * (case-insensitive, ignoring separators). "Trap Latino" normalizes to
 * "Reggaeton" via normalizeGenre. Returns null when no genre is recognizable.
 */
function genreFromFilename(name: string): string | null {
  const haystack = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
  // Longest tokens first so "latin pop" wins over "latin".
  const candidates = [...GENRE_AISLES.map((a) => a.value), "Trap Latino"].sort(
    (a, b) => b.length - a.length,
  );
  for (const candidate of candidates) {
    const needle = candidate.toLowerCase();
    if (haystack.includes(needle)) return normalizeGenre(candidate);
  }
  return null;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingTrack {
  id: string; // local key
  audioFile: File;
  audioUrl: string; // object URL for preview
  title: string;
  genre: string;
  coverFile: File | null;
  progress: number;
  error: string | null;
  done: boolean;
  vocalType: string;
  mood: string;
  tempo: string;
  recommendedUse: string;
}

const VOCAL_TYPE_OPTIONS = toSelectOptions(VOCAL_TYPES);
const MOOD_OPTIONS = toSelectOptions(MOODS);
const TEMPO_OPTIONS = toSelectOptions(TEMPOS);
const RECOMMENDED_USE_OPTIONS = toSelectOptions(RECOMMENDED_USES);

function MetaSelect({
  id,
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`block text-foreground ${compact ? "text-xs" : "text-sm"} font-medium mb-1`}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-input bg-background text-foreground ${compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"} focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors`}
        data-ocid={id}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PendingTrackRow
// ---------------------------------------------------------------------------

function PendingTrackRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PendingTrack;
  index: number;
  onChange: (updated: Partial<PendingTrack>) => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLanguage();

  return (
    <div
      className={`bg-card border rounded-xl p-4 transition-colors ${
        item.done
          ? "border-primary/40 bg-primary/5"
          : item.error
            ? "border-destructive/40 bg-destructive/5"
            : "border-border"
      }`}
      data-ocid={`bulk.track_row.item.${index + 1}`}
    >
      <div className="flex items-start gap-3">
        {/* Audio preview */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Music size={16} className="text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Title row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">{t("Título", "Title")}</Label>
              <Input
                value={item.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder={t("Título de la canción", "Track title")}
                className="h-8 text-sm"
                data-ocid={`bulk.track_row.title_input.${index + 1}`}
              />
            </div>
            <div>
              <Label className="text-xs">{t("Género", "Genre")}</Label>
              <select
                value={item.genre}
                onChange={(e) => onChange({ genre: e.target.value })}
                className="mt-1 w-full h-8 rounded-lg border border-input bg-background text-foreground text-sm px-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                data-ocid={`bulk.track_row.genre_select.${index + 1}`}
              >
                {GENRE_AISLES.map((aisle) => (
                  <option key={aisle.value} value={aisle.value}>
                    {genreLabel(aisle.value, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">
                {t("Imagen de portada (opcional)", "Cover image (optional)")}
              </Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  onChange({ coverFile: e.target.files?.[0] ?? null })
                }
                className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/15 file:text-primary cursor-pointer"
                data-ocid={`bulk.track_row.cover_upload.${index + 1}`}
              />
              {item.coverFile && (
                <p className="text-xs text-primary mt-1">
                  ✓ {item.coverFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Native audio preview */}
          <div>
            <Label className="text-xs text-muted-foreground">
              {t("Preview", "Preview")} — {item.audioFile.name}
            </Label>
            <audio
              src={item.audioUrl}
              controls
              preload="metadata"
              className="w-full h-8 mt-1 rounded-lg"
              style={{ accentColor: "var(--color-primary)" }}
              aria-label={t("Preview de audio", "Audio preview")}
              data-ocid={`bulk.track_row.audio_preview.${index + 1}`}
            >
              <track kind="captions" src="" label="No captions" default />
            </audio>
          </div>

          {/* Per-track metadata overrides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
            <MetaSelect
              id={`bulk.track_row.vocal_type_select.${index + 1}`}
              label={t("Tipo vocal", "Vocal Type")}
              value={item.vocalType}
              options={VOCAL_TYPE_OPTIONS}
              onChange={(v) => onChange({ vocalType: v })}
              compact
            />
            <MetaSelect
              id={`bulk.track_row.mood_select.${index + 1}`}
              label="Mood"
              value={item.mood}
              options={MOOD_OPTIONS}
              onChange={(v) => onChange({ mood: v })}
              compact
            />
            <MetaSelect
              id={`bulk.track_row.tempo_select.${index + 1}`}
              label="Tempo"
              value={item.tempo}
              options={TEMPO_OPTIONS}
              onChange={(v) => onChange({ tempo: v })}
              compact
            />
            <MetaSelect
              id={`bulk.track_row.recommended_use_select.${index + 1}`}
              label={t("Uso recomendado", "Recommended Use")}
              value={item.recommendedUse}
              options={RECOMMENDED_USE_OPTIONS}
              onChange={(v) => onChange({ recommendedUse: v })}
              compact
            />
          </div>

          {/* Progress / status */}
          {item.progress > 0 && !item.done && !item.error && (
            <ProgressBar value={item.progress} />
          )}
          {item.done && (
            <p
              className="text-xs text-primary font-medium flex items-center gap-1.5"
              data-ocid={`bulk.track_row.success_state.${index + 1}`}
            >
              <CheckCircle2 size={13} />
              {t("Subido correctamente", "Uploaded successfully")}
            </p>
          )}
          {item.error && (
            <p
              className="text-xs text-destructive flex items-center gap-1.5"
              data-ocid={`bulk.track_row.error_state.${index + 1}`}
            >
              <XCircle size={13} />
              {item.error}
            </p>
          )}
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={t("Eliminar", "Remove")}
          data-ocid={`bulk.track_row.delete_button.${index + 1}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BulkUploadPanel
// ---------------------------------------------------------------------------

interface PrefillMeta {
  vocalType: string;
  mood: string;
  tempo: string;
  recommendedUse: string;
}

export function BulkUploadPanel() {
  const { t, lang } = useLanguage();
  const bulkAddTracks = useBulkAddTracks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pending, setPending] = useState<PendingTrack[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [targetGenre, setTargetGenre] = useState<string>(GENRE_AISLES[0].value);
  const [prefill, setPrefill] = useState<PrefillMeta>({
    vocalType: "",
    mood: "",
    tempo: "",
    recommendedUse: "",
  });

  const applyPrefillToAll = (field: keyof PrefillMeta, value: string) => {
    setPrefill((prev) => ({ ...prev, [field]: value }));
    setPending((prev) => prev.map((item) => ({ ...item, [field]: value })));
  };

  // Add files to the pending list, deriving each title from its filename.
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const audioFiles = Array.from(files).filter(
        (f) =>
          f.type.startsWith("audio/") ||
          /\.(mp3|wav|aac|ogg|flac|m4a)$/i.test(f.name),
      );
      if (audioFiles.length === 0) {
        toast.error(t("Solo archivos de audio", "Audio files only"));
        return;
      }
      const newItems: PendingTrack[] = audioFiles.map((f) => ({
        id: makeId(),
        audioFile: f,
        audioUrl: URL.createObjectURL(f),
        title: titleFromFilename(f.name),
        genre: genreFromFilename(f.name) ?? targetGenre,
        coverFile: null,
        progress: 0,
        error: null,
        done: false,
        vocalType: prefill.vocalType,
        mood: prefill.mood,
        tempo: prefill.tempo,
        recommendedUse: prefill.recommendedUse,
      }));
      setPending((prev) => [...prev, ...newItems]);
      setSuccessCount(null);
    },
    [t, prefill, targetGenre],
  );

  const updateItem = (id: string, patch: Partial<PendingTrack>) => {
    setPending((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (id: string) => {
    setPending((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.audioUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    for (const item of pending) URL.revokeObjectURL(item.audioUrl);
    setPending([]);
    setSuccessCount(null);
  };

  // ---------------------------------------------------------------------------
  // Submit all
  // ---------------------------------------------------------------------------
  const uploadAll = async () => {
    const toUpload = pending.filter((item) => !item.done);
    if (toUpload.length === 0) return;

    setIsUploading(true);
    setSuccessCount(null);

    // Minimal transparent 1×1 PNG as placeholder cover
    const PLACEHOLDER_PNG = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
      0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84,
      8, 215, 99, 248, 207, 192, 0, 0, 0, 2, 0, 1, 227, 33, 188, 51, 0, 0, 0, 0,
      73, 69, 78, 68, 174, 66, 96, 130,
    ]);

    let uploadedCount = 0;
    const inputs: TrackInput[] = [];

    // Upload files sequentially with per-file progress
    for (const item of toUpload) {
      try {
        updateItem(item.id, { progress: 5, error: null });

        // Upload audio
        const audioBlob = await blobFromFile(item.audioFile, (p) =>
          updateItem(item.id, { progress: Math.round(p * 0.8) }),
        );

        // Upload cover (or use placeholder)
        let coverBlob: ExternalBlob;
        if (item.coverFile) {
          coverBlob = await blobFromFile(item.coverFile, (p) =>
            updateItem(item.id, { progress: 80 + Math.round(p * 0.15) }),
          );
        } else {
          coverBlob = ExternalBlob.fromBytes(PLACEHOLDER_PNG);
        }

        updateItem(item.id, { progress: 95 });

        inputs.push({
          title: { es: item.title, en: item.title },
          artist: "Ritmo Raíz",
          genre: item.genre,
          country: "Internacional",
          sampleStartSec: 0n,
          sampleEndSec: 25n,
          isFeatured: false,
          isNewArrival: true,
          audioFile: audioBlob,
          coverImage: coverBlob,
          vocalType: item.vocalType || undefined,
          mood: item.mood || undefined,
          tempo: item.tempo || undefined,
          recommendedUse: item.recommendedUse || undefined,
        });

        updateItem(item.id, { progress: 100, done: true });
        uploadedCount++;
      } catch {
        updateItem(item.id, {
          progress: 0,
          error: t("Error al subir archivo", "Error uploading file"),
        });
      }
    }

    // Submit all prepared inputs to backend
    if (inputs.length > 0) {
      try {
        await bulkAddTracks.mutateAsync(inputs);
        setSuccessCount(uploadedCount);
        toast.success(
          t(
            `${uploadedCount} canciones subidas al store`,
            `${uploadedCount} tracks uploaded to the store`,
          ),
        );
        // Clear the queue on success
        setPending([]);
      } catch {
        toast.error(t("Error al guardar en el store", "Error saving to store"));
        // Reset progress for items that were prepared but not saved
        setPending((prev) =>
          prev.map((item) =>
            item.done
              ? {
                  ...item,
                  done: false,
                  progress: 0,
                  error: t("Error al guardar", "Save error"),
                }
              : item,
          ),
        );
      }
    }

    setIsUploading(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div data-ocid="admin.bulk_upload_panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("Subir por Género", "Upload by Genre")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Elige un género destino y sube varias canciones a la vez. El título y el género se derivan del nombre del archivo.",
              "Pick a target genre and upload several tracks at once. The title and genre are derived from the filename.",
            )}
          </p>
        </div>
        {pending.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={isUploading}
            data-ocid="bulk.clear_all_button"
          >
            {t("Limpiar todo", "Clear all")}
          </Button>
        )}
      </div>

      {/* Target genre selector */}
      <div
        className="bg-card border border-border rounded-2xl p-5 mb-6"
        data-ocid="bulk.genre_section"
      >
        <p className="text-sm font-semibold text-foreground mb-1">
          {t("Género destino (predeterminado)", "Target genre (default)")}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {t(
            "Se usa cuando el nombre del archivo no incluye un género reconocible. Puedes ajustar el género por track.",
            "Used when the filename has no recognizable genre. You can adjust the genre per track.",
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRE_AISLES.map((aisle) => {
            const active = targetGenre === aisle.value;
            return (
              <button
                key={aisle.value}
                type="button"
                onClick={() => setTargetGenre(aisle.value)}
                disabled={isUploading}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer select-none disabled:opacity-60 ${
                  active
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
                data-ocid={`bulk.genre.${aisle.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
              >
                {genreLabel(aisle.value, lang)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pre-fill metadata section */}
      <div
        className="bg-card border border-border rounded-2xl p-5 mb-6"
        data-ocid="bulk.prefill_section"
      >
        <p className="text-sm font-semibold text-foreground mb-1">
          {t("Pre-llenar metadatos", "Pre-fill metadata")}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {t(
            "Aplica estos valores a todos los tracks en cola. Puedes sobreescribir por track.",
            "Applies these values to all queued tracks. You can override per track.",
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetaSelect
            id="bulk.prefill.vocal_type_select"
            label={t("Tipo vocal / Vocal Type", "Tipo vocal / Vocal Type")}
            value={prefill.vocalType}
            options={VOCAL_TYPE_OPTIONS}
            onChange={(v) => applyPrefillToAll("vocalType", v)}
          />
          <MetaSelect
            id="bulk.prefill.mood_select"
            label={t("Estado de ánimo / Mood", "Estado de ánimo / Mood")}
            value={prefill.mood}
            options={MOOD_OPTIONS}
            onChange={(v) => applyPrefillToAll("mood", v)}
          />
          <MetaSelect
            id="bulk.prefill.tempo_select"
            label="Tempo"
            value={prefill.tempo}
            options={TEMPO_OPTIONS}
            onChange={(v) => applyPrefillToAll("tempo", v)}
          />
          <MetaSelect
            id="bulk.prefill.recommended_use_select"
            label={t(
              "Uso recomendado / Recommended Use",
              "Uso recomendado / Recommended Use",
            )}
            value={prefill.recommendedUse}
            options={RECOMMENDED_USE_OPTIONS}
            onChange={(v) => applyPrefillToAll("recommendedUse", v)}
          />
        </div>
      </div>

      {/* Drop zone */}
      <button
        type="button"
        className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer mb-6 bg-transparent ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        aria-label={t("Seleccionar archivos de audio", "Select audio files")}
        data-ocid="bulk.dropzone"
      >
        <Upload
          size={36}
          className={`mx-auto mb-3 transition-colors ${
            isDragOver ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <p className="text-sm font-medium text-foreground">
          {isDragOver
            ? t("Suelta los archivos aquí", "Drop files here")
            : t("Arrastra MP3s / WAVs aquí", "Drag MP3s / WAVs here")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t(
            "o haz clic para seleccionar múltiples archivos",
            "or click to select multiple files",
          )}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          data-ocid="bulk.file_input"
        />
      </button>

      {/* Success banner */}
      {successCount !== null && (
        <div
          className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 flex items-center gap-3"
          data-ocid="bulk.success_state"
        >
          <CheckCircle2 size={24} className="text-primary flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              {t(
                `¡${successCount} canciones subidas con éxito!`,
                `${successCount} tracks uploaded successfully!`,
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                "Ya están disponibles en el store con su sample de 25 segundos.",
                "They are now available in the store with their 25-second sample.",
              )}
            </p>
          </div>
        </div>
      )}

      {/* Pending list */}
      {pending.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="bulk.empty_state"
        >
          <Music size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {t(
              "Selecciona archivos de audio para comenzar",
              "Select audio files to get started",
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {pending.length}
              </span>{" "}
              {t("archivo(s) en cola", "file(s) queued")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Destino", "Target")}:{" "}
              <span className="font-medium text-foreground">
                {genreLabel(targetGenre, lang)}
              </span>
            </p>
          </div>

          <div className="space-y-3 mb-6" data-ocid="bulk.track_list">
            {pending.map((item, index) => (
              <PendingTrackRow
                key={item.id}
                item={item}
                index={index}
                onChange={(patch) => updateItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Upload All button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              disabled={isUploading}
              data-ocid="bulk.cancel_button"
            >
              {t("Cancelar todo", "Cancel all")}
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground gap-2 px-6"
              onClick={uploadAll}
              disabled={
                isUploading || pending.filter((i) => !i.done).length === 0
              }
              data-ocid="bulk.upload_all_button"
            >
              <Upload size={16} />
              {isUploading
                ? t("Subiendo...", "Uploading...")
                : t(
                    `Subir Todos (${pending.filter((i) => !i.done).length})`,
                    `Upload All (${pending.filter((i) => !i.done).length})`,
                  )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
