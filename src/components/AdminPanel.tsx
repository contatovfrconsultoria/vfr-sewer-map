import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deleteGeoportal, saveGeoportal, isAdmin, type Geoportal } from "@/lib/geoportais";

const empty = { city_name: "", state: "", thumbnail_url: "", portal_url: "", display_order: 0 };

export function AdminPanel({ items }: { items: Geoportal[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [editing, setEditing] = useState<(typeof empty & { id?: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["geoportais"] });

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (signup) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.");
        setSignup(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("E-mail ou senha incorretos");
      if (await isAdmin()) setUnlocked(true);
      else {
        await supabase.auth.signOut();
        toast.error("Esta conta não tem permissão de administrador");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await saveGeoportal(editing);
      toast.success("Geoportal salvo");
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function del(g: Geoportal) {
    if (!confirm(`Excluir ${g.city_name}?`)) return;
    try {
      await deleteGeoportal(g.id);
      toast.success("Geoportal excluído");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Settings className="mr-1 h-4 w-4" /> Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar geoportais</DialogTitle>
        </DialogHeader>

        {!unlocked ? (
          <form onSubmit={unlock} className="space-y-3">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{signup ? "Criar conta" : "Entrar"}</Button>
            <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setSignup(!signup)}>
              {signup ? "Já tenho conta" : "Primeiro acesso? Criar conta de administrador"}
            </button>
          </form>
        ) : editing ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div>
                <Label>Cidade</Label>
                <Input required value={editing.city_name} onChange={(e) => setEditing({ ...editing, city_name: e.target.value })} />
              </div>
              <div>
                <Label>UF</Label>
                <Input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Link do geoportal</Label>
              <Input required type="url" value={editing.portal_url} onChange={(e) => setEditing({ ...editing, portal_url: e.target.value })} />
            </div>
            <div>
              <Label>Link da imagem (miniatura do mapa)</Label>
              <Input type="url" value={editing.thumbnail_url} onChange={(e) => setEditing({ ...editing, thumbnail_url: e.target.value })} />
            </div>
            <div>
              <Label>Ordem de exibição</Label>
              <Input type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={busy}>Salvar</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <Button onClick={() => setEditing({ ...empty, display_order: items.length + 1 })}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar geoportal
            </Button>
            <ul className="divide-y rounded-md border">
              {items.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{g.city_name}{g.state && ` - ${g.state}`}</p>
                    <p className="truncate text-xs text-muted-foreground">{g.portal_url}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditing({ ...g })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => del(g)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
