// The staff console registry (bipe#372): every staff page, built or planned. It feeds the MAS redirect URIs
// (staff-auth.tsx), the routes (routes.tsx) and the index /admin/. Add a page here first.

export type StaffGroup = "Crescimento" | "Operação" | "Empresas" | "Confiança" | "Pesquisa";

export type StaffPageInfo = {
  title: string;
  group: StaffGroup;
  /** Built pages have a path. Planned pages name their issue on bipe-chat/bipe. */
  path?: `/admin/${string}/` | "/admin/";
  issue?: number;
};

export const STAFF_INDEX = "/admin/";
export const STAFF_GROUPS: StaffGroup[] = ["Crescimento", "Operação", "Empresas", "Confiança", "Pesquisa"];
/** Root of the staff breadcrumb trail and the name in the staff header. */
export const STAFF_HOME = "Equipe";
/** Tools outside the site, last in the staff nav. */
export const STAFF_LINKS = [
  { title: "Umami", href: "https://stats.bipe.chat" },
  { title: "Element Admin", href: "https://admin.bipe.net.br" },
];

export const STAFF_CONSOLE = {
  crescimento: { title: "Funil", group: "Crescimento", path: "/admin/crescimento/" },
  convites: { title: "Convites", group: "Crescimento", path: "/admin/convites/" },
  visitas: { title: "Visitas", group: "Crescimento", path: "/admin/visitas/" },
  propostas: { title: "Propostas", group: "Crescimento", path: "/admin/propostas/" },
  experimentos: { title: "Títulos", group: "Crescimento", path: "/admin/experimentos/" },
  espera: { title: "Lista de espera", group: "Operação", path: "/admin/lista-de-espera/" },
  problemas: { title: "Problemas", group: "Operação", issue: 367 },
  empresas: { title: "Empresas", group: "Empresas", path: "/admin/empresas/" },
  nomes: { title: "Nomes reservados", group: "Empresas", issue: 253 },
  denuncias: { title: "Denúncias", group: "Confiança", path: "/admin/denuncias/" },
  lgpd: { title: "LGPD", group: "Confiança", path: "/admin/lgpd/" },
  transparencia: { title: "Transparência", group: "Confiança", issue: 288 },
  pesquisa: { title: "Pesquisa e estratégia", group: "Pesquisa", path: "/admin/pesquisa/" },
} as const satisfies Record<string, StaffPageInfo>;

export type StaffPage = keyof typeof STAFF_CONSOLE | "index";

/** Path of a built page, or of the index. */
export function staffPath(page: StaffPage): string {
  if (page === "index") return STAFF_INDEX;
  const p: StaffPageInfo = STAFF_CONSOLE[page];
  if (!p.path) throw new Error(`staff page ${page} is not built`);
  return p.path;
}

/** Every built page and the index: the MAS client lists them all as redirect URIs. */
export const STAFF_PATHS: string[] = [STAFF_INDEX, ...Object.values(STAFF_CONSOLE as Record<string, StaffPageInfo>).flatMap((p) => (p.path ? [p.path] : []))];
