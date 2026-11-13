import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, MapPinned } from "lucide-react";
import { listGeoportais, type Geoportal } from "@/lib/geoportais";
import { AdminPanel } from "@/components/AdminPanel";

const geoQuery = queryOptions({ queryKey: ["geoportais"], queryFn: () => listGeoportais() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geoportais Rede de Esgoto | VFR Mapeamento" },
      { name: "description", content: "Acesse os geoportais de rede de esgoto por cidade, mapeados pela VFR Mapeamento." },
      { property: "og:title", content: "Geoportais Rede de Esgoto | VFR Mapeamento" },
      { property: "og:description", content: "Acesse os geoportais de rede de esgoto por cidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(geoQuery),
  component: Index,
});

function Thumb({ g }: { g: Geoportal }) {
  const [failed, setFailed] = useState(false);
  if (!g.thumbnail_url || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <MapPinned className="h-12 w-12 text-accent" />
      </div>
    );
  }
  return (
    <img
      src={g.thumbnail_url}
      alt={`Mapa de ${g.city_name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

function Index() {
  const { data } = useSuspenseQuery(geoQuery);
  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-bold tracking-wide">
            VFR <span className="text-accent">Mapeamento</span>
          </span>
          <AdminPanel items={data} />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">Saneamento · Cadastro técnico</p>
          <h1 className="font-display text-4xl font-bold md:text-5xl">Geoportais Rede de Esgoto</h1>
          <p className="mt-3 max-w-xl text-primary-foreground/80">Selecione a cidade para abrir o geoportal correspondente.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhum geoportal cadastrado ainda.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((g) => (
              <a
                key={g.id}
                href={g.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[5/3] overflow-hidden bg-muted">
                  <Thumb g={g} />
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <h2 className="font-display text-lg font-semibold text-card-foreground">
                    {g.city_name}
                    {g.state && <span className="text-muted-foreground"> - {g.state}</span>}
                  </h2>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
                    Acessar <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} VFR Mapeamento
      </footer>
    </div>
  );
}
