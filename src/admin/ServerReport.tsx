// Staff page /admin/servidor/ (ADR 0285, bipe#1315): the capacity of the node from /v1/admin/capacity.
// Data only. Accounts of 1 or 2 arrive as null (bipe#371).
import { useState } from "react";
import { fmtDate, num, Periods, Section, small, StaffShell, Tiles } from "./staff-ui";

type Capacity = {
  min_cell: number;
  last: {
    taken_at: string; accounts: number | null; cpu_pct: number; memory_pct: number; disk_pct: number;
    cpu_allocatable_m: number; memory_allocatable: number; fs_capacity: number;
    volumes: { name: string; used: number; capacity: number; pct: number }[];
    pods: { name: string; memory: number }[];
  } | null;
  days: { day: string; accounts: number | null; cpu_pct: number; memory_pct: number; disk_pct: number; volume_pct: number; oom_kills: number }[];
  accounts_per_gb: number | null;
  accounts_per_vcpu: number | null;
};

const PERIODS = [30, 90, 365] as const;
const gb = (b: number) => `${(b / 2 ** 30).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
const pctText = (n: number) => `${n}%`;
// Alert limits of bipe-api (ADR 0285): memory 75%, disk 80%, CPU 80%.
const LIMIT = { memory: 75, disk: 80, cpu: 80 };

export function ServerReport(_: Record<string, never>) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(90);
  return (
    <StaffShell<Capacity> page="servidor" api={`/v1/admin/capacity?days=${days}`} title="Servidor"
      tools={<Periods options={PERIODS} value={days} onChange={setDays} />}>
      {(d) => <Report d={d} />}
    </StaffShell>
  );
}

function Report({ d }: { d: Capacity }) {
  const l = d.last;
  return (
    <>
      <Section title="Agora" aside={l ? <span className="small muted">{new Date(l.taken_at).toLocaleString("pt-BR")}</span> : undefined}>
        <Tiles items={[
          { label: "Memória", value: l ? pctText(l.memory_pct) : "-", sub: l ? gb(l.memory_allocatable) : undefined, warn: !!l && l.memory_pct > LIMIT.memory },
          { label: "Disco", value: l ? pctText(l.disk_pct) : "-", sub: l ? gb(l.fs_capacity) : undefined, warn: !!l && l.disk_pct > LIMIT.disk },
          { label: "CPU", value: l ? pctText(l.cpu_pct) : "-", sub: l ? `${num(l.cpu_allocatable_m / 1000)} vCPU` : undefined, warn: !!l && l.cpu_pct > LIMIT.cpu },
          { label: "Contas", value: l ? small(l.accounts) : "-" },
          { label: "Contas por GB", value: num(d.accounts_per_gb), sub: "pico do último dia" },
          { label: "Contas por vCPU", value: num(d.accounts_per_vcpu), sub: "pico do último dia" },
        ]} />
      </Section>

      {l && l.volumes.length > 0 && (
        <Section title="Volumes">
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Volume</th><th className="num">Usado</th><th className="num">Tamanho</th><th className="num">Uso</th></tr></thead>
              <tbody>
                {l.volumes.map((v) => (
                  <tr key={v.name} className={v.pct > LIMIT.disk ? "warn" : undefined}>
                    <td className="mono small">{v.name}</td>
                    <td className="num">{gb(v.used)}</td>
                    <td className="num">{gb(v.capacity)}</td>
                    <td className="num"><strong>{pctText(v.pct)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {l && l.pods.length > 0 && (
        <Section title="Memória por pod">
          <div className="staff-scroll">
            <table className="staff-table">
              <thead><tr><th>Pod</th><th className="num">Memória</th></tr></thead>
              <tbody>
                {l.pods.map((p) => (
                  <tr key={p.name}><td className="mono small">{p.name}</td><td className="num">{gb(p.memory)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Picos por dia">
        <div className="staff-scroll">
          <table className="staff-table">
            <thead><tr><th>Dia</th><th className="num">Contas</th><th className="num">Memória</th><th className="num">Disco</th><th className="num">Volume</th><th className="num">CPU</th><th className="num">OOM</th></tr></thead>
            <tbody>
              {[...d.days].reverse().map((r) => (
                <tr key={r.day} className={r.oom_kills > 0 || r.memory_pct > LIMIT.memory || r.disk_pct > LIMIT.disk ? "warn" : undefined}>
                  <td>{fmtDate(r.day)}</td>
                  <td className="num">{small(r.accounts)}</td>
                  <td className="num">{pctText(r.memory_pct)}</td>
                  <td className="num">{pctText(r.disk_pct)}</td>
                  <td className="num">{pctText(r.volume_pct)}</td>
                  <td className="num">{pctText(r.cpu_pct)}</td>
                  <td className="num">{r.oom_kills}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
