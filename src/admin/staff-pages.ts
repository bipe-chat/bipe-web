// The staff console registry (bipe#372): every staff page, built or planned. It feeds the MAS redirect URIs
// (staff-auth.tsx), the routes (routes.tsx) and the index /admin/. Add a page here first.

export type StaffGroup = "Crescimento" | "Operação" | "Empresas" | "Confiança";

export type StaffPageInfo = {
  title: string;
  purpose: string;
  group: StaffGroup;
  /** Built pages have a path. Planned pages name their issue on bipe-chat/bipe. */
  path?: `/admin/${string}/` | "/admin/";
  issue?: number;
};

export const STAFF_INDEX = "/admin/";

export const STAFF_CONSOLE = {
  crescimento: { title: "Crescimento", purpose: "Funil de cadastro e retenção D1, D7 e D30 por semana de cadastro.", group: "Crescimento", path: "/admin/crescimento/" },
  convites: { title: "Quem mais convida", purpose: "Pessoas que trazem mais gente, pelos convites pessoais.", group: "Crescimento", path: "/admin/convites/" },
  visitas: { title: "Visitas por estado e cidade", purpose: "Visitas ao site vindas do Brasil, pelo Umami.", group: "Crescimento", path: "/admin/visitas/" },
  experimentos: { title: "Teste de títulos", purpose: "Visitas, cliques e cadastros por versão do título.", group: "Crescimento", issue: 376 },
  espera: { title: "Lista de espera", purpose: "Tamanho por plataforma e taxa de entrada por lote liberado.", group: "Operação", issue: 374 },
  problemas: { title: "Relatos de problema", purpose: "Relatos enviados pelos apps.", group: "Operação", issue: 367 },
  empresas: { title: "Empresas", purpose: "Pedidos de CNPJ, verificação e domínios.", group: "Empresas", issue: 375 },
  nomes: { title: "Nomes reservados", purpose: "Fila de revisão de nomes e pedidos de empresas.", group: "Empresas", issue: 253 },
  transparencia: { title: "Transparência", purpose: "Contagens semestrais para o relatório de transparência.", group: "Confiança", issue: 288 },
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
