import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import * as Accordion from "@radix-ui/react-accordion";
import {
  CheckCircle,
  ChevronDown,
  Copyright,
  Globe,
  Music2,
  Package,
  RefreshCw,
  Scale,
  Server,
  Shield,
  User,
} from "lucide-react";

const SECTIONS = [
  { id: "ai-disclosure", icon: Music2 },
  { id: "licensing", icon: Package },
  { id: "no-refund", icon: RefreshCw },
  { id: "copyright", icon: Copyright },
  { id: "publicity", icon: User },
  { id: "lyria-compliance", icon: CheckCircle },
  { id: "icp-hosting", icon: Server },
  { id: "warranty", icon: Shield },
  { id: "governing-law", icon: Scale },
];

type SectionData = {
  titleEs: string;
  titleEn: string;
  contentEs: React.ReactNode;
  contentEn: React.ReactNode;
};

const SECTION_DATA: SectionData[] = [
  {
    titleEs: "1. Divulgación de Música con IA",
    titleEn: "1. AI Music Disclosure",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Toda la música disponible en Ritmo Raíz es generada o asistida por
          inteligencia artificial, principalmente mediante{" "}
          <strong className="text-foreground">Google Lyria Pro 3</strong> y
          herramientas similares.
        </p>
        <p>
          Este contenido no representa composiciones humanas tradicionales según
          la definición actual de la{" "}
          <strong className="text-foreground">
            Oficina de Derechos de Autor de los Estados Unidos
          </strong>
          .
        </p>
        <p>
          Cada pista está claramente identificada con la etiqueta{" "}
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            AI-Generated
          </span>{" "}
          en toda la plataforma.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          All music available on Ritmo Raíz is generated or assisted by
          artificial intelligence, primarily through{" "}
          <strong className="text-foreground">Google Lyria Pro 3</strong> and
          similar tools.
        </p>
        <p>
          This content does not represent traditional human compositions under
          the current definition of the{" "}
          <strong className="text-foreground">
            United States Copyright Office
          </strong>
          .
        </p>
        <p>
          Each track is clearly identified with the{" "}
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            AI-Generated
          </span>{" "}
          label throughout the platform.
        </p>
      </div>
    ),
  },
  {
    titleEs: "2. Niveles de Licencia",
    titleEn: "2. Licensing Tiers",
    contentEs: (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Licencia Personal
            </span>
            <span className="text-primary font-bold text-lg">
              $4.99
              <span className="text-sm font-normal text-muted-foreground">
                /pista
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Uso individual no comercial. Ideal para proyectos personales, tareas
            escolares o contenido privado que no se monetiza. No incluye
            derechos para transmisión pública, publicidad ni distribución
            comercial.
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Licencia Comercial
            </span>
            <span className="text-primary font-bold text-lg">
              $29.99
              <span className="text-sm font-normal text-muted-foreground">
                /pista
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para empresas, creadores de contenido y profesionales que utilizan
            música en contenido monetizado o distribuido públicamente —
            incluyendo videos de YouTube, anuncios en redes sociales, podcasts,
            presentaciones corporativas y contenido en streaming. Cubre uso
            comercial para un solo proyecto.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Licencia Empresarial / Broadcast
            </span>
            <span className="text-amber-400 font-bold text-lg">
              $99.99
              <span className="text-sm font-normal text-muted-foreground">
                /pista
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Derechos completos de difusión y sincronización para uso comercial a
            gran escala — comerciales de televisión, películas, radio, call
            centers, campañas publicitarias nacionales y distribución ilimitada.
            Incluye un{" "}
            <strong className="text-foreground">
              Certificado de Licencia en PDF descargable
            </strong>{" "}
            para documentación legal. Ideal para agencias, productoras y
            corporaciones.
          </p>
        </div>
      </div>
    ),
    contentEn: (
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Personal License
            </span>
            <span className="text-primary font-bold text-lg">
              $4.99
              <span className="text-sm font-normal text-muted-foreground">
                /track
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For individual, non-commercial use only. Ideal for personal
            projects, school assignments, or private content that is not
            monetized. Does not include rights for public broadcast,
            advertising, or commercial distribution.
          </p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Commercial License
            </span>
            <span className="text-primary font-bold text-lg">
              $29.99
              <span className="text-sm font-normal text-muted-foreground">
                /track
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For businesses, content creators, and professionals using music in
            monetized or publicly distributed content — including YouTube
            videos, social media ads, podcasts, corporate presentations, and
            streaming content. Covers single-project commercial use.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">
              Enterprise / Broadcast License
            </span>
            <span className="text-amber-400 font-bold text-lg">
              $99.99
              <span className="text-sm font-normal text-muted-foreground">
                /track
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Full broadcast and sync rights for large-scale commercial use — TV
            commercials, films, radio, call centers, national advertising
            campaigns, and unlimited distribution. Includes a{" "}
            <strong className="text-foreground">
              downloadable PDF License Certificate
            </strong>{" "}
            for legal documentation. Best for agencies, production companies,
            and corporations.
          </p>
        </div>
      </div>
    ),
  },
  {
    titleEs: "3. Política de No Reembolsos",
    titleEn: "3. No-Refund Policy",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Todas las ventas son{" "}
          <strong className="text-foreground">finales e irrevocables</strong>.
          Por la naturaleza digital de nuestros productos, no se aceptan
          devoluciones ni reembolsos una vez que se ha completado la descarga
          del archivo.
        </p>
        <p>
          Se considerarán excepciones{" "}
          <strong className="text-foreground">
            únicamente en caso de error técnico documentado
          </strong>{" "}
          — por ejemplo, si el archivo descargado está corrupto o es
          inaccesible. En ese caso, aplica nuestra Garantía Limitada (Sección
          8).
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          All sales are{" "}
          <strong className="text-foreground">final and non-reversible</strong>.
          Due to the digital nature of our products, no returns or refunds are
          accepted once the file download has been completed.
        </p>
        <p>
          Exceptions will be considered{" "}
          <strong className="text-foreground">
            only in the case of a documented technical error
          </strong>{" "}
          — for example, if the downloaded file is corrupted or inaccessible. In
          that case, our Limited Warranty applies (Section 8).
        </p>
      </div>
    ),
  },
  {
    titleEs: "4. Limitación de Derechos de Autor",
    titleEn: "4. Copyright Limitation",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          La música generada por inteligencia artificial{" "}
          <strong className="text-foreground">
            no es registrable como obra de autor
          </strong>{" "}
          bajo la ley vigente de los Estados Unidos (según los criterios
          actuales de la Oficina de Derechos de Autor).
        </p>
        <p>
          Al adquirir una pista, el comprador obtiene una{" "}
          <strong className="text-foreground">licencia de uso</strong> según el
          nivel seleccionado — no la propiedad ni el copyright de la obra.
        </p>
        <p>
          Ritmo Raíz Music retiene todos los derechos sobre los archivos
          originales y los modelos utilizados para su creación.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          AI-generated music is{" "}
          <strong className="text-foreground">
            not registrable as a copyrightable work
          </strong>{" "}
          under current US law (per current US Copyright Office criteria).
        </p>
        <p>
          When purchasing a track, the buyer receives a{" "}
          <strong className="text-foreground">use license</strong> for the
          selected tier — not ownership or copyright of the work.
        </p>
        <p>
          Ritmo Raíz Music retains all rights to the original files and the
          models used in their creation.
        </p>
      </div>
    ),
  },
  {
    titleEs: "5. Derecho de Publicidad",
    titleEn: "5. Right of Publicity",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Las licencias adquiridas{" "}
          <strong className="text-foreground">no incluyen el derecho</strong> a
          asociar la música con personas reales identificables, marcas
          registradas, ni con cualquier contenido que pueda implicar un endoso o
          patrocinio.
        </p>
        <p>
          Cualquier uso que implique asociación con personas públicas o marcas
          requiere{" "}
          <strong className="text-foreground">
            autorización escrita previa
          </strong>{" "}
          de Ritmo Raíz Music y/o las partes involucradas.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Acquired licenses{" "}
          <strong className="text-foreground">do not include the right</strong>{" "}
          to associate the music with identifiable real people, registered
          trademarks, or any content that could imply an endorsement or
          sponsorship.
        </p>
        <p>
          Any use that implies association with public figures or brands
          requires{" "}
          <strong className="text-foreground">
            prior written authorization
          </strong>{" "}
          from Ritmo Raíz Music and/or the parties involved.
        </p>
      </div>
    ),
  },
  {
    titleEs: "6. Cumplimiento con Google Lyria Pro 3",
    titleEn: "6. Google Lyria Pro 3 Compliance",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          El uso comercial del contenido generado cumple con los{" "}
          <strong className="text-foreground">
            Términos de Servicio de Google Lyria Pro 3
          </strong>{" "}
          vigentes al momento de la creación.
        </p>
        <p>
          El contenido generado{" "}
          <strong className="text-foreground">no puede utilizarse</strong> para
          engañar, difamar, ni en aplicaciones de alto riesgo, incluyendo pero
          no limitado a: medicina, seguridad pública, sistemas críticos de
          infraestructura, o cualquier aplicación que pueda causar daño real a
          personas.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Commercial use of the generated content complies with the{" "}
          <strong className="text-foreground">
            Google Lyria Pro 3 Terms of Service
          </strong>{" "}
          in effect at the time of creation.
        </p>
        <p>
          Generated content{" "}
          <strong className="text-foreground">may not be used</strong> to
          deceive, defame, or in high-risk applications, including but not
          limited to: medicine, public safety, critical infrastructure systems,
          or any application that could cause real harm to people.
        </p>
      </div>
    ),
  },
  {
    titleEs: "7. Alojamiento en Internet Computer (ICP)",
    titleEn: "7. ICP Hosting Disclosure",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Este sitio está alojado en el{" "}
          <strong className="text-foreground">
            Internet Computer de DFINITY
          </strong>{" "}
          — una infraestructura blockchain descentralizada, permanente y con
          privacidad por diseño. No depende de servidores en la nube
          tradicionales (AWS, GCP, Azure, etc.).
        </p>
        <p>
          El inicio de sesión se realiza{" "}
          <strong className="text-foreground">
            exclusivamente a través de Internet Identity
          </strong>{" "}
          — sin contraseñas tradicionales ni datos personales almacenados en
          servidores centralizados.
        </p>
        <p>
          Esta arquitectura garantiza alta disponibilidad, resistencia a la
          censura y soberanía de los datos del usuario.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          This site is hosted on the{" "}
          <strong className="text-foreground">DFINITY Internet Computer</strong>{" "}
          — a decentralized, permanent blockchain infrastructure with privacy by
          design. It does not rely on traditional cloud servers (AWS, GCP,
          Azure, etc.).
        </p>
        <p>
          Login is performed{" "}
          <strong className="text-foreground">
            exclusively through Internet Identity
          </strong>{" "}
          — no traditional passwords or personal data stored on centralized
          servers.
        </p>
        <p>
          This architecture ensures high availability, censorship resistance,
          and user data sovereignty.
        </p>
      </div>
    ),
  },
  {
    titleEs: "8. Garantía Limitada",
    titleEn: "8. Limited Warranty",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Todos los archivos de audio se entregan en{" "}
          <strong className="text-foreground">
            formato MP3 de alta calidad (mínimo 320kbps)
          </strong>
          .
        </p>
        <p>
          Si un archivo descargado está corrupto, incompleto o no puede
          reproducirse correctamente, será{" "}
          <strong className="text-foreground">
            reemplazado sin costo alguno
          </strong>{" "}
          dentro de los{" "}
          <strong className="text-foreground">
            30 días posteriores a la compra
          </strong>
          , previa verificación del problema por parte de nuestro equipo.
        </p>
        <p>
          Para solicitar un reemplazo, el comprador debe conservar el
          comprobante de compra y proporcionar evidencia del error técnico.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          All audio files are delivered in{" "}
          <strong className="text-foreground">
            high-quality MP3 format (minimum 320kbps)
          </strong>
          .
        </p>
        <p>
          If a downloaded file is corrupted, incomplete, or cannot be played
          correctly, it will be{" "}
          <strong className="text-foreground">replaced at no cost</strong>{" "}
          within{" "}
          <strong className="text-foreground">30 days of purchase</strong>, upon
          verification of the issue by our team.
        </p>
        <p>
          To request a replacement, the buyer must retain proof of purchase and
          provide evidence of the technical error.
        </p>
      </div>
    ),
  },
  {
    titleEs: "9. Ley Aplicable",
    titleEn: "9. Governing Law",
    contentEs: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          Estas políticas, términos y condiciones se rigen por las leyes del{" "}
          <strong className="text-foreground">Estado de Florida, EE.UU.</strong>
          , y la legislación federal aplicable de los Estados Unidos.
        </p>
        <p>
          Esto incluye expresamente la{" "}
          <strong className="text-foreground">
            Ley de Derechos de Autor de los Estados Unidos (17 U.S.C.)
          </strong>{" "}
          y cualquier otra normativa federal relevante en materia de propiedad
          intelectual y comercio digital.
        </p>
        <p>
          Cualquier disputa derivada del uso de esta plataforma será resuelta en
          los tribunales competentes del Estado de Florida.
        </p>
      </div>
    ),
    contentEn: (
      <div className="space-y-3 text-muted-foreground leading-relaxed">
        <p>
          These policies, terms, and conditions are governed by the laws of the{" "}
          <strong className="text-foreground">State of Florida, USA</strong>,
          and applicable federal law of the United States.
        </p>
        <p>
          This expressly includes the{" "}
          <strong className="text-foreground">
            US Copyright Act (17 U.S.C.)
          </strong>{" "}
          and any other relevant federal regulations regarding intellectual
          property and digital commerce.
        </p>
        <p>
          Any dispute arising from the use of this platform shall be resolved in
          the competent courts of the State of Florida.
        </p>
      </div>
    ),
  },
];

export default function PoliciesPage() {
  const { lang, toggle, t } = useLanguage();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background" data-ocid="policies.page">
      {/* Hero header */}
      <div className="bg-card border-b border-border py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-primary/20">
            <Shield size={13} />
            {t("Políticas & Cumplimiento", "Policies & Compliance")}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {t("Políticas Legales", "Legal Policies")}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t(
              "Divulgaciones, licencias y términos de uso de Ritmo Raíz Music.",
              "Disclosures, licenses, and terms of use for Ritmo Raíz Music.",
            )}
          </p>

          {/* Language toggle */}
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggle}
              className="gap-2"
              data-ocid="policies.language_toggle"
            >
              <Globe size={15} />
              <span className="font-semibold">
                {lang === "es" ? "ES" : "EN"}
              </span>
              <span className="text-muted-foreground text-xs">
                {lang === "es" ? "→ English" : "→ Español"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Anchor navigation */}
        <nav className="mb-10" data-ocid="policies.anchor_nav">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("Ir a sección", "Jump to section")}
          </p>
          <div className="flex flex-wrap gap-2">
            {SECTION_DATA.map((section, i) => {
              const SectionIcon = SECTIONS[i].icon;
              return (
                <button
                  key={SECTIONS[i].id}
                  type="button"
                  onClick={() => scrollTo(SECTIONS[i].id)}
                  className="inline-flex items-center gap-1.5 text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors duration-200"
                  data-ocid={`policies.anchor.${SECTIONS[i].id}`}
                >
                  <SectionIcon size={11} />
                  {t(
                    section.titleEs.replace(/^\d+\.\s*/, ""),
                    section.titleEn.replace(/^\d+\.\s*/, ""),
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Accordion sections */}
        <Accordion.Root
          type="multiple"
          className="space-y-3"
          data-ocid="policies.accordion"
        >
          {SECTION_DATA.map((section, i) => {
            const SectionIcon = SECTIONS[i].icon;
            return (
              <Accordion.Item
                key={SECTIONS[i].id}
                value={SECTIONS[i].id}
                id={SECTIONS[i].id}
                className="border border-border rounded-xl overflow-hidden bg-card"
                data-ocid={`policies.section.${i + 1}`}
              >
                <Accordion.Trigger className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors duration-200 group [&[data-state=open]]:bg-muted/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <SectionIcon size={15} className="text-primary" />
                  </div>
                  <span className="flex-1 font-semibold text-foreground text-sm md:text-base">
                    {t(section.titleEs, section.titleEn)}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
                <Accordion.Content className="px-5 pb-5 pt-1 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="border-t border-border pt-4">
                    {lang === "es" ? section.contentEs : section.contentEn}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>

        {/* Bottom note */}
        <div className="mt-12 p-5 rounded-xl bg-muted/30 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t(
              "Última actualización: Mayo 2026 · Para consultas legales contacte a través de la tienda.",
              "Last updated: May 2026 · For legal inquiries contact us through the store.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
