// One island for every staff page. Links inside /admin/ switch the page in place (pushState), so the
// frame stays and the next page reuses the token: no full load, no flash. A full load still works on every path.
import { useEffect, useState, type ComponentType } from "react";
import { AdminIndex } from "./AdminIndex";
import { GrowthReport } from "./GrowthReport";
import { InviterReport } from "./InviterReport";
import { MessagingResearch } from "./MessagingResearch";
import { PropostaReport } from "./PropostaReport";
import { BusinessReport, ExperimentsReport, RetentionReport, UserReports, WaitlistReport } from "./OpsReports";
import { markHydrated } from "./staff-auth";
import { STAFF_CONSOLE, STAFF_INDEX, type StaffPage, type StaffPageInfo } from "./staff-pages";
import { VisitReport } from "./VisitReport";

const VIEWS: Record<StaffPage, ComponentType<Record<string, never>>> = {
  index: AdminIndex, crescimento: GrowthReport, convites: InviterReport, visitas: VisitReport, propostas: PropostaReport, experimentos: ExperimentsReport,
  espera: WaitlistReport, empresas: BusinessReport, denuncias: UserReports, lgpd: RetentionReport, pesquisa: MessagingResearch,
  // Planned pages have no path, so no link reaches them.
  problemas: AdminIndex, nomes: AdminIndex, transparencia: AdminIndex,
};

const pageAt = (path: string): StaffPage | null => {
  if (path === STAFF_INDEX) return "index";
  const hit = Object.entries(STAFF_CONSOLE as Record<string, StaffPageInfo>).find(([, p]) => p.path === path);
  return hit ? (hit[0] as StaffPage) : null;
};
const titleOf = (page: StaffPage) => (page === "index" ? "Equipe" : (STAFF_CONSOLE[page] as StaffPageInfo).title);

export function StaffApp({ page: first }: { page: StaffPage }) {
  const [page, setPage] = useState<StaffPage>(first);

  useEffect(() => {
    markHydrated();
    const show = (p: StaffPage) => { setPage(p); document.title = `${titleOf(p)} · Bipe`; };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.origin !== location.origin) return;
      const next = pageAt(a.pathname);
      if (!next) return;
      e.preventDefault();
      if (a.pathname !== location.pathname) history.pushState(null, "", a.pathname);
      show(next);
      window.scrollTo(0, 0);
    };
    const onPop = () => { const p = pageAt(location.pathname); if (p) show(p); };
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("popstate", onPop); };
  }, []);

  const View = VIEWS[page] as ComponentType;
  return <View key={page} />;
}
