import type { LicenseTier } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useDeleteLicenseTier,
  useLicenseTiers,
  useUpsertLicenseTier,
} from "@/hooks/useQueries";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditingTier {
  id: bigint;
  nameEs: string;
  nameEn: string;
  price: string;
  descEs: string;
  descEn: string;
  isNew: boolean;
}

export function LicensesPanel() {
  const { t } = useLanguage();
  const { data: licenses = [], isLoading } = useLicenseTiers();
  const upsertTier = useUpsertLicenseTier();
  const deleteTier = useDeleteLicenseTier();
  const [editing, setEditing] = useState<EditingTier | null>(null);

  const startEdit = (l: LicenseTier) => {
    setEditing({
      id: l.id,
      nameEs: l.name.es,
      nameEn: l.name.en,
      price: String(l.priceUsd),
      descEs: l.description.es,
      descEn: l.description.en,
      isNew: false,
    });
  };

  const startNew = () => {
    setEditing({
      id: BigInt(Date.now()),
      nameEs: "",
      nameEn: "",
      price: "",
      descEs: "",
      descEn: "",
      isNew: true,
    });
  };

  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    if (!editing.nameEs.trim()) {
      toast.error(t("Nombre ES requerido", "Name ES required"));
      return;
    }
    try {
      await upsertTier.mutateAsync({
        id: editing.id,
        name: { es: editing.nameEs, en: editing.nameEn },
        description: { es: editing.descEs, en: editing.descEn },
        priceUsd: BigInt(editing.price || "0"),
      });
      toast.success(t("Licencia guardada", "License saved"));
      setEditing(null);
    } catch {
      toast.error(t("Error al guardar", "Error saving"));
    }
  };

  const handleDelete = async (l: LicenseTier) => {
    if (!confirm(t("¿Eliminar esta licencia?", "Delete this license?"))) return;
    try {
      await deleteTier.mutateAsync(l.id);
      toast.success(t("Licencia eliminada", "License deleted"));
    } catch {
      toast.error(t("Error al eliminar", "Error deleting"));
    }
  };

  if (isLoading) {
    return (
      <Skeleton
        className="h-48 w-full rounded-2xl"
        data-ocid="admin.licenses.loading_state"
      />
    );
  }

  return (
    <div data-ocid="admin.licenses_panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("Licencias", "Licenses")}
        </h2>
        {licenses.length < 3 && (
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={startNew}
            disabled={editing?.isNew}
            data-ocid="admin.add_license_button"
          >
            <Plus size={16} />
            {t("Nueva licencia", "New license")}
          </Button>
        )}
      </div>

      {/* Edit / Add form */}
      {editing && (
        <div
          className="bg-card border border-primary/30 rounded-2xl p-5 mb-4"
          data-ocid="admin.license_edit_form"
        >
          <h3 className="font-semibold text-foreground mb-3">
            {editing.isNew
              ? t("Nueva licencia", "New license")
              : t("Editar licencia", "Edit license")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>{t("Nombre ES", "Name ES")}</Label>
              <Input
                value={editing.nameEs}
                onChange={(e) =>
                  setEditing({ ...editing, nameEs: e.target.value })
                }
                placeholder="Personal"
                data-ocid="admin.license.name_es_input"
              />
            </div>
            <div>
              <Label>{t("Nombre EN", "Name EN")}</Label>
              <Input
                value={editing.nameEn}
                onChange={(e) =>
                  setEditing({ ...editing, nameEn: e.target.value })
                }
                placeholder="Personal"
                data-ocid="admin.license.name_en_input"
              />
            </div>
            <div>
              <Label>{t("Precio USD", "Price USD")}</Label>
              <Input
                type="number"
                min="0"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: e.target.value })
                }
                placeholder="29"
                data-ocid="admin.license.price_input"
              />
            </div>
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("Descripción (ES)", "Descripción (ES)")}</Label>
                <Input
                  value={editing.descEs}
                  onChange={(e) =>
                    setEditing({ ...editing, descEs: e.target.value })
                  }
                  placeholder="Para uso personal no comercial..."
                  data-ocid="admin.license.desc_es_input"
                />
              </div>
              <div>
                <Label>{t("Description (EN)", "Description (EN)")}</Label>
                <Input
                  value={editing.descEn}
                  onChange={(e) =>
                    setEditing({ ...editing, descEn: e.target.value })
                  }
                  placeholder="For personal non-commercial use..."
                  data-ocid="admin.license.desc_en_input"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancel}
              data-ocid="admin.license_cancel_button"
            >
              {t("Cancelar", "Cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground gap-2"
              onClick={save}
              disabled={upsertTier.isPending}
              data-ocid="admin.license_save_button"
            >
              <Save size={14} />
              {t("Guardar", "Save")}
            </Button>
          </div>
        </div>
      )}

      {/* Tier list */}
      <div className="space-y-2">
        {licenses.map((l, i) => (
          <div
            key={String(l.id)}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
            data-ocid={`admin.license.item.${i + 1}`}
          >
            <div>
              <p className="font-semibold text-foreground">
                {l.name.es}
                {l.name.en && l.name.en !== l.name.es && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / {l.name.en}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                ${String(l.priceUsd)} USD
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => startEdit(l)}
                aria-label="Edit license"
                data-ocid={`admin.edit_license_button.${i + 1}`}
              >
                <Edit2 size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(l)}
                aria-label="Delete license"
                data-ocid={`admin.delete_license_button.${i + 1}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {licenses.length === 0 && (
          <p
            className="text-center py-10 text-muted-foreground"
            data-ocid="admin.licenses.empty_state"
          >
            {t("Sin licencias configuradas", "No licenses configured")}
          </p>
        )}
      </div>
    </div>
  );
}
