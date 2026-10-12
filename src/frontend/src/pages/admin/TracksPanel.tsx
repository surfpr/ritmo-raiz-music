import { ExternalBlob } from "@/backend";
import type { Track, TrackInput } from "@/backend";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useAddTrack,
  useBulkAddTracks,
  useDeleteTrack,
  useTracks,
  useUpdateTrack,
} from "@/hooks/useQueries";
import {
  MOODS,
  RECOMMENDED_USES,
  TEMPOS,
  VOCAL_TYPES,
  toSelectOptions,
} from "@/lib/filterConstants";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Music,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface TrackForm {
  titleEs: string;
  titleEn: string;
  artist: string;
  genre: string;
  country: string;
  sampleStartSec: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  vocalType: string;
  mood: string;
  tempo: string;
  recommendedUse: string;
}

function blank(): TrackForm {
  return {
    titleEs: "",
    titleEn: "",
    artist: "",
    genre: "",
    country: "",
    sampleStartSec: "0",
    isFeatured: false,
    isNewArrival: false,
    vocalType: "",
    mood: "",
    tempo: "",
    recommendedUse: "",
  };
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
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
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

function sampleEnd(start: string) {
  return Math.max(0, Number(start)) + 25;
}

async function blobFromFile(
  file: File,
  onProgress?: (p: number) => void,
): Promise<ExternalBlob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let blob = ExternalBlob.fromBytes(bytes);
  if (onProgress) blob = blob.withUploadProgress(onProgress);
  return blob;
}

function FormFields({
  form,
  onChange,
  audioFile,
  coverFile,
  onAudioChange,
  onCoverChange,
  idPrefix,
  isEdit = false,
}: {
  form: TrackForm;
  onChange: (f: TrackForm) => void;
  audioFile: File | null;
  coverFile: File | null;
  onAudioChange: (f: File | null) => void;
  onCoverChange: (f: File | null) => void;
  idPrefix: string;
  isEdit?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>{t("Título ES", "Title ES")}</Label>
        <Input
          value={form.titleEs}
          onChange={(e) => onChange({ ...form, titleEs: e.target.value })}
          placeholder="Título en español"
          data-ocid={`${idPrefix}.title_es_input`}
        />
      </div>
      <div>
        <Label>{t("Título EN", "Title EN")}</Label>
        <Input
          value={form.titleEn}
          onChange={(e) => onChange({ ...form, titleEn: e.target.value })}
          placeholder="Title in English"
          data-ocid={`${idPrefix}.title_en_input`}
        />
      </div>
      <div>
        <Label>{t("Artista", "Artist")}</Label>
        <Input
          value={form.artist}
          onChange={(e) => onChange({ ...form, artist: e.target.value })}
          placeholder="Artista"
          data-ocid={`${idPrefix}.artist_input`}
        />
      </div>
      <div>
        <Label>{t("Género", "Genre")}</Label>
        <Input
          value={form.genre}
          onChange={(e) => onChange({ ...form, genre: e.target.value })}
          placeholder="Salsa, Reggaeton..."
          data-ocid={`${idPrefix}.genre_input`}
        />
      </div>
      <div>
        <Label>{t("País", "Country")}</Label>
        <Input
          value={form.country}
          onChange={(e) => onChange({ ...form, country: e.target.value })}
          placeholder="México, Colombia..."
          data-ocid={`${idPrefix}.country_input`}
        />
      </div>
      <div>
        <Label>{t("Sample inicio (seg)", "Sample start (s)")}</Label>
        <Input
          type="number"
          min="0"
          value={form.sampleStartSec}
          onChange={(e) =>
            onChange({ ...form, sampleStartSec: e.target.value })
          }
          data-ocid={`${idPrefix}.sample_start_input`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {t("Fin:", "End:")} {sampleEnd(form.sampleStartSec)}s (25s{" "}
          {t("fijos", "fixed")})
        </p>
      </div>
      <div>
        <Label>
          {isEdit
            ? t(
                "Nuevo audio (dejar vacío para mantener)",
                "New audio (leave empty to keep)",
              )
            : t("Archivo de audio (MP3)", "Audio file (MP3)")}
        </Label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => onAudioChange(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary/15 file:text-primary cursor-pointer"
          data-ocid={`${idPrefix}.audio_upload`}
        />
        {audioFile && (
          <p className="text-xs text-primary mt-1">✓ {audioFile.name}</p>
        )}
      </div>
      <div>
        <Label>
          {isEdit
            ? t(
                "Nueva imagen (dejar vacío para mantener)",
                "New cover (leave empty to keep)",
              )
            : t("Imagen de portada", "Cover image")}
        </Label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onCoverChange(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary/15 file:text-primary cursor-pointer"
          data-ocid={`${idPrefix}.cover_upload`}
        />
        {coverFile && (
          <p className="text-xs text-primary mt-1">✓ {coverFile.name}</p>
        )}
      </div>
      <div className="flex gap-4 md:col-span-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) =>
              onChange({ ...form, isFeatured: e.target.checked })
            }
            data-ocid={`${idPrefix}.featured_checkbox`}
          />
          <span className="text-sm text-foreground">
            {t("Destacado", "Featured")}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isNewArrival}
            onChange={(e) =>
              onChange({ ...form, isNewArrival: e.target.checked })
            }
            data-ocid={`${idPrefix}.new_arrival_checkbox`}
          />
          <span className="text-sm text-foreground">
            {t("Recién llegado", "New arrival")}
          </span>
        </label>
      </div>

      {/* Metadata fields */}
      <div className="md:col-span-2 border-t border-border/50 pt-4 mt-2">
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
          {t("Metadatos opcionales", "Optional metadata")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetaSelect
            id={`${idPrefix}.vocal_type_select`}
            label={t("Tipo vocal / Vocal Type", "Tipo vocal / Vocal Type")}
            value={form.vocalType}
            options={VOCAL_TYPE_OPTIONS}
            onChange={(v) => onChange({ ...form, vocalType: v })}
          />
          <MetaSelect
            id={`${idPrefix}.mood_select`}
            label={t("Estado de ánimo / Mood", "Estado de ánimo / Mood")}
            value={form.mood}
            options={MOOD_OPTIONS}
            onChange={(v) => onChange({ ...form, mood: v })}
          />
          <MetaSelect
            id={`${idPrefix}.tempo_select`}
            label="Tempo"
            value={form.tempo}
            options={TEMPO_OPTIONS}
            onChange={(v) => onChange({ ...form, tempo: v })}
          />
          <MetaSelect
            id={`${idPrefix}.recommended_use_select`}
            label={t(
              "Uso recomendado / Recommended Use",
              "Uso recomendado / Recommended Use",
            )}
            value={form.recommendedUse}
            options={RECOMMENDED_USE_OPTIONS}
            onChange={(v) => onChange({ ...form, recommendedUse: v })}
          />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  if (value <= 0 || value >= 100) return null;
  return (
    <div className="mt-3">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Subiendo... {value}%</p>
    </div>
  );
}

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { t } = useLanguage();
  const deleteTrack = useDeleteTrack();
  const updateTrack = useUpdateTrack();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TrackForm>(blank());
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setForm({
      titleEs: track.title.es,
      titleEn: track.title.en,
      artist: track.artist,
      genre: track.genre,
      country: track.country,
      sampleStartSec: String(Number(track.sampleStartSec)),
      isFeatured: track.isFeatured,
      isNewArrival: track.isNewArrival,
      vocalType: track.vocalType ?? "",
      mood: track.mood ?? "",
      tempo: track.tempo ?? "",
      recommendedUse: track.recommendedUse ?? "",
    });
    setAudioFile(null);
    setCoverFile(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!form.titleEs.trim()) {
      toast.error(t("Título ES requerido", "Title ES required"));
      return;
    }
    setSaving(true);
    try {
      // coverImage: upload new if selected, otherwise keep existing
      let coverImage = track.coverImage;
      if (coverFile) {
        coverImage = await blobFromFile(coverFile, setProgress);
      }

      const input: TrackInput = {
        title: { es: form.titleEs, en: form.titleEn },
        artist: form.artist,
        genre: form.genre,
        country: form.country,
        sampleStartSec: BigInt(form.sampleStartSec || "0"),
        sampleEndSec: BigInt(sampleEnd(form.sampleStartSec)),
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        coverImage,
        vocalType: form.vocalType || undefined,
        mood: form.mood || undefined,
        tempo: form.tempo || undefined,
        recommendedUse: form.recommendedUse || undefined,
        // Only include audioFile if a new file was selected
        ...(audioFile
          ? { audioFile: await blobFromFile(audioFile, setProgress) }
          : {}),
      };

      await updateTrack.mutateAsync({ id: track.id, input });
      toast.success(t("Track actualizado", "Track updated"));
      setEditing(false);
    } catch {
      toast.error(t("Error al guardar", "Error saving"));
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("¿Eliminar este track?", "Delete this track?"))) return;
    await deleteTrack.mutateAsync(track.id);
    toast.success(t("Track eliminado", "Track deleted"));
  };

  const audioUrl = track.audioFile.getDirectURL();
  const coverUrl = track.coverImage.getDirectURL();

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-hidden"
      data-ocid={`admin.track.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 p-3">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={track.title.es}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        {!coverUrl && (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Music size={20} className="text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {track.title.es}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist} · {track.genre} · {track.country}
          </p>
          <AudioPlayer
            audioUrl={audioUrl}
            sampleStartSec={Number(track.sampleStartSec)}
            sampleEndSec={Number(track.sampleEndSec)}
            compact
            className="mt-1"
          />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {track.isFeatured && (
            <Badge variant="secondary" className="text-xs">
              {t("Dest.", "Feat.")}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => (editing ? setEditing(false) : openEdit())}
            aria-label={editing ? "Close editor" : "Edit track"}
            data-ocid={`admin.edit_track_button.${index + 1}`}
          >
            {editing ? <ChevronUp size={14} /> : <Edit2 size={14} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
            aria-label="Delete track"
            data-ocid={`admin.delete_track_button.${index + 1}`}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-border p-4 bg-background/50">
          <FormFields
            form={form}
            onChange={setForm}
            audioFile={audioFile}
            coverFile={coverFile}
            onAudioChange={setAudioFile}
            onCoverChange={setCoverFile}
            idPrefix={`admin.track_edit.${index + 1}`}
            isEdit
          />
          <ProgressBar value={progress} />
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              data-ocid={`admin.track_edit_cancel.${index + 1}`}
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground"
              onClick={saveEdit}
              disabled={saving}
              data-ocid={`admin.track_edit_save.${index + 1}`}
            >
              {saving ? t("Guardando...", "Saving...") : t("Guardar", "Save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TracksPanel() {
  const { t } = useLanguage();
  const { data: tracks = [], isLoading } = useTracks();
  const addTrack = useAddTrack();
  const bulkAddTracks = useBulkAddTracks();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<TrackForm>(blank());
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isBulking, setIsBulking] = useState(false);

  const filtered = tracks.filter(
    (tr) =>
      tr.title.es.toLowerCase().includes(search.toLowerCase()) ||
      tr.title.en.toLowerCase().includes(search.toLowerCase()) ||
      tr.artist.toLowerCase().includes(search.toLowerCase()) ||
      tr.genre.toLowerCase().includes(search.toLowerCase()),
  );

  const submitAdd = async () => {
    if (!form.titleEs.trim()) {
      toast.error(t("Título ES requerido", "Title ES required"));
      return;
    }
    if (!audioFile) {
      toast.error(t("Selecciona un archivo de audio", "Select an audio file"));
      return;
    }
    if (!coverFile) {
      toast.error(
        t("Selecciona una imagen de portada", "Select a cover image"),
      );
      return;
    }
    setSaving(true);
    try {
      const [audioBlob, coverBlob] = await Promise.all([
        blobFromFile(audioFile, setProgress),
        blobFromFile(coverFile),
      ]);
      const input: TrackInput = {
        title: { es: form.titleEs, en: form.titleEn },
        artist: form.artist,
        genre: form.genre,
        country: form.country,
        sampleStartSec: BigInt(form.sampleStartSec || "0"),
        sampleEndSec: BigInt(sampleEnd(form.sampleStartSec)),
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        audioFile: audioBlob,
        coverImage: coverBlob,
        vocalType: form.vocalType || undefined,
        mood: form.mood || undefined,
        tempo: form.tempo || undefined,
        recommendedUse: form.recommendedUse || undefined,
      };
      await addTrack.mutateAsync(input);
      toast.success(t("Track añadido", "Track added"));
      setForm(blank());
      setAudioFile(null);
      setCoverFile(null);
      setShowAdd(false);
    } catch {
      toast.error(t("Error al añadir track", "Error adding track"));
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  const handleBulkFiles = useCallback(
    async (files: FileList) => {
      const audioFiles = Array.from(files).filter((f) =>
        f.type.startsWith("audio/"),
      );
      if (audioFiles.length === 0) {
        toast.error(t("Solo archivos de audio", "Audio files only"));
        return;
      }
      setIsBulking(true);
      setBulkProgress(0);
      try {
        const inputs: TrackInput[] = [];
        for (let i = 0; i < audioFiles.length; i++) {
          const f = audioFiles[i];
          const bytes = new Uint8Array(await f.arrayBuffer());
          const audioBlob = ExternalBlob.fromBytes(bytes);
          const name = f.name.replace(/\.[^.]+$/, "");
          // Use a 1x1 placeholder cover (transparent PNG)
          const placeholder = ExternalBlob.fromBytes(
            new Uint8Array([
              137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0,
              0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0,
              12, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 0, 0, 0, 2, 0, 1,
              227, 33, 188, 51, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
            ]),
          );
          inputs.push({
            title: { es: name, en: name },
            artist: "Ritmo Raíz",
            genre: "Latino",
            country: "Latino",
            sampleStartSec: 0n,
            sampleEndSec: 25n,
            isFeatured: false,
            isNewArrival: true,
            audioFile: audioBlob,
            coverImage: placeholder,
          });
          setBulkProgress(Math.round(((i + 1) / audioFiles.length) * 80));
        }
        await bulkAddTracks.mutateAsync(inputs);
        toast.success(
          t(
            `${audioFiles.length} tracks subidos`,
            `${audioFiles.length} tracks uploaded`,
          ),
        );
        setBulkProgress(100);
      } catch {
        toast.error(t("Error en carga masiva", "Bulk upload error"));
      } finally {
        setIsBulking(false);
        setTimeout(() => setBulkProgress(0), 2000);
      }
    },
    [bulkAddTracks, t],
  );

  return (
    <div data-ocid="admin.tracks_panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("Canciones", "Tracks")}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({tracks.length})
          </span>
        </h2>
        <Button
          type="button"
          className="bg-primary text-primary-foreground gap-2"
          onClick={() => setShowAdd((s) => !s)}
          data-ocid="admin.add_track_button"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? t("Cancelar", "Cancel") : t("Añadir track", "Add track")}
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="bg-card border border-primary/30 rounded-2xl p-5 mb-6"
          data-ocid="admin.add_track_form"
        >
          <h3 className="font-semibold text-foreground mb-4">
            {t("Nuevo track", "New track")}
          </h3>
          <FormFields
            form={form}
            onChange={setForm}
            audioFile={audioFile}
            coverFile={coverFile}
            onAudioChange={setAudioFile}
            onCoverChange={setCoverFile}
            idPrefix="admin.add_track"
          />
          <ProgressBar value={progress} />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAdd(false);
                setForm(blank());
              }}
              data-ocid="admin.add_track_cancel_button"
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground"
              onClick={submitAdd}
              disabled={saving}
              data-ocid="admin.add_track_submit_button"
            >
              {saving
                ? t("Subiendo...", "Uploading...")
                : t("Guardar track", "Save track")}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk upload */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 mb-6 text-center transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files.length > 0)
            handleBulkFiles(e.dataTransfer.files);
        }}
        data-ocid="admin.bulk_upload_dropzone"
      >
        <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t(
            "Arrastra MP3s aquí para carga masiva",
            "Drop MP3s here for bulk upload",
          )}
        </p>
        <button
          type="button"
          className="text-xs text-primary mt-1 underline"
          onClick={() => bulkInputRef.current?.click()}
          data-ocid="admin.bulk_upload_button"
        >
          {t("o haz clic para seleccionar", "or click to select")}
        </button>
        <input
          ref={bulkInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleBulkFiles(e.target.files)}
        />
        {isBulking && (
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bulkProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Buscar canciones...", "Search tracks...")}
          className="pl-9"
          data-ocid="admin.tracks_search_input"
        />
      </div>

      {/* Track list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="admin.tracks.loading_state">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p
          className="text-center py-16 text-muted-foreground"
          data-ocid="admin.tracks.empty_state"
        >
          {search
            ? t("Sin resultados", "No results")
            : t("Sin canciones aún", "No tracks yet")}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((tr, i) => (
            <TrackRow key={String(tr.id)} track={tr} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
