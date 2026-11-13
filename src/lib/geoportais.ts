import { supabase } from "@/integrations/supabase/client";

export type Geoportal = {
  id: string;
  city_name: string;
  state: string;
  thumbnail_url: string;
  portal_url: string;
  display_order: number;
};

export async function listGeoportais(): Promise<Geoportal[]> {
  const { data, error } = await supabase
    .from("geoportais")
    .select("id, city_name, state, thumbnail_url, portal_url, display_order")
    .order("display_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Geoportal[];
}

export async function saveGeoportal(item: Omit<Geoportal, "id"> & { id?: string }) {
  const { id, ...f } = item;
  const row = {
    city_name: String(f.city_name).trim().slice(0, 120),
    state: String(f.state ?? "").trim().slice(0, 10),
    thumbnail_url: String(f.thumbnail_url ?? "").trim().slice(0, 1000),
    portal_url: String(f.portal_url).trim().slice(0, 1000),
    display_order: Number(f.display_order) || 0,
  };
  if (!row.city_name || !row.portal_url) throw new Error("Cidade e link são obrigatórios");
  const { error } = id
    ? await supabase.from("geoportais").update(row).eq("id", id)
    : await supabase.from("geoportais").insert(row);
  if (error) throw new Error("Sem permissão ou erro ao salvar: " + error.message);
}

export async function deleteGeoportal(id: string) {
  const { error } = await supabase.from("geoportais").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function isAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin");
  return (data?.length ?? 0) > 0;
}
