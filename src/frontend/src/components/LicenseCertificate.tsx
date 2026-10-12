import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { Download, FileText } from "lucide-react";
import { useState } from "react";

interface CertificateItem {
  trackTitle: string;
  licenseType: string;
}

interface LicenseCertificateProps {
  open: boolean;
  onClose: () => void;
  items: CertificateItem[];
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function generateCertificatePDF(
  buyerName: string,
  items: CertificateItem[],
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 20;
  const contentW = pageW - margin * 2;

  // Background
  doc.setFillColor(15, 10, 30);
  doc.rect(0, 0, pageW, pageH, "F");

  // Decorative top bar
  doc.setFillColor(180, 100, 255);
  doc.rect(0, 0, pageW, 4, "F");

  // Decorative bottom bar
  doc.rect(0, pageH - 4, pageW, 4, "F");

  // Side accents
  doc.setFillColor(120, 60, 200);
  doc.rect(margin - 4, 20, 2, pageH - 40, "F");
  doc.rect(pageW - margin + 2, 20, 2, pageH - 40, "F");

  // Logo / brand name
  doc.setTextColor(180, 100, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Ritmo Raíz Music V2", pageW / 2, 28, { align: "center" });

  // Certificate title
  doc.setTextColor(240, 235, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ENTERPRISE / BROADCAST LICENSE CERTIFICATE", pageW / 2, 42, {
    align: "center",
  });

  // Divider
  doc.setDrawColor(180, 100, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, 50, pageW - margin, 50);

  // Section: Certificate of License
  doc.setTextColor(180, 100, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF LICENSE", margin, 62);

  doc.setTextColor(210, 200, 240);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This document certifies that the following Enterprise / Broadcast License has",
    margin,
    70,
  );
  doc.text(
    "been duly purchased and grants the rights specified herein.",
    margin,
    76,
  );

  // Details table
  const labelX = margin;
  const valueX = margin + 52;
  let y = 92;
  const lineH = 9;

  const details: [string, string][] = [
    ["Licensee (Buyer):", buyerName || "—"],
    ["Purchase Date:", formatDate(new Date())],
    ["License Type:", "Enterprise / Broadcast License"],
    ["License Number:", generateUUID().toUpperCase()],
  ];

  for (const [label, value] of details) {
    doc.setTextColor(180, 100, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, labelX, y);
    doc.setTextColor(240, 235, 255);
    doc.setFont("helvetica", "normal");
    doc.text(value, valueX, y);
    y += lineH;
  }

  // Track section
  y += 6;
  doc.setDrawColor(80, 50, 120);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  doc.setTextColor(180, 100, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LICENSED TRACK(S)", margin, y);
  y += 10;

  for (let i = 0; i < items.length; i++) {
    doc.setTextColor(240, 235, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${i + 1}. ${items[i].trackTitle}`, margin + 4, y);
    y += 7;
  }

  // Rights section
  y += 8;
  doc.setDrawColor(80, 50, 120);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  doc.setTextColor(180, 100, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RIGHTS GRANTED", margin, y);
  y += 9;

  const rights = [
    "Full broadcast and sync rights for large-scale commercial use.",
    "TV commercials, films, radio, call centers, and national advertising campaigns.",
    "Unlimited distribution — this license is never re-published from our end.",
    "Single-licensee use only — not transferable.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(210, 200, 240);
  for (const right of rights) {
    doc.text(`• ${right}`, margin + 3, y, {
      maxWidth: contentW - 6,
    });
    y += 7;
  }

  // Footer
  doc.setDrawColor(180, 100, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, pageH - 30, pageW - margin, pageH - 30);

  doc.setTextColor(140, 110, 200);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text(
    "Ritmo Raíz Music V2 · AI-generated Latin Music · caffeine.ai",
    pageW / 2,
    pageH - 22,
    { align: "center" },
  );
  doc.text(
    `Certificate issued: ${formatDate(new Date())}`,
    pageW / 2,
    pageH - 15,
    { align: "center" },
  );

  doc.save("RitmoRaiz-Enterprise-License.pdf");
}

export function LicenseCertificate({
  open,
  onClose,
  items,
}: LicenseCertificateProps) {
  const { t } = useLanguage();
  const [buyerName, setBuyerName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateCertificatePDF(buyerName, items);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md"
        data-ocid="license_certificate.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="text-primary" size={20} />
            <DialogTitle className="font-display text-xl">
              {t(
                "Certificado de Licencia Enterprise",
                "Enterprise License Certificate",
              )}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            {t(
              "Tu compra incluye un Certificado PDF de Licencia Enterprise / Broadcast. Ingresa tu nombre para generarlo.",
              "Your purchase includes a PDF Enterprise / Broadcast License Certificate. Enter your name to generate it.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="buyer-name" className="text-sm font-medium">
              {t("Tu nombre completo", "Your full name")}
            </Label>
            <Input
              id="buyer-name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder={t("Nombre y apellido", "First and last name")}
              className="mt-1.5"
              data-ocid="license_certificate.buyer_name_input"
              onKeyDown={(e) => e.key === "Enter" && handleDownload()}
            />
          </div>

          {items.length > 0 && (
            <div className="bg-muted/40 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("Tracks incluidos", "Included tracks")}
              </p>
              {items.map((item) => (
                <p key={item.trackTitle} className="text-sm text-foreground">
                  {item.trackTitle}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            data-ocid="license_certificate.cancel_button"
          >
            {t("Cancelar", "Cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-primary text-primary-foreground gap-2"
            onClick={handleDownload}
            disabled={isGenerating}
            data-ocid="license_certificate.download_button"
          >
            <Download size={14} />
            {isGenerating
              ? t("Generando...", "Generating...")
              : t("Descargar PDF", "Download PDF")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
