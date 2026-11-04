// The shop on the web (bipe-shared spec loja-web, ADR 0195): the live tools of a company's page, for a person with no
// Bipe account. A first name and no phone, e-mail or location. One random token per browser per shop, from the first
// web action, is the only key to "Seus pedidos e horários". Prices and order totals come from the server.
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config";
import { t } from "../shared";

type Price = { mode: "fixed" | "from"; text: string; amount_cents?: number } | { mode: "on_request" };
type Item = { id: string; kind: "service" | "product"; name: string; price: Price; description?: string; category?: string; sold_out_today?: boolean; duration_minutes?: number };
type Slot = { start: string; end: string };
type SlotDay = { date: string; slots: Slot[] };
type Booking = { id: string; service_id: string; start: string; status: string };
type Order = { id: string; lines: { name: string; quantity: number }[]; total_amount_cents: number; status: string };
type Records = { bookings: Booking[]; orders: Order[] };
type Tools = { tools: string[]; web_booking?: boolean; web_orders?: boolean };

const POLL_MS = 20_000;
const WEEK_DAYS = 7;
const OPEN_BOOKING = ["requested", "confirmed"];
const OPEN_ORDER = ["sent", "accepted", "ready"];
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const when = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const dayName = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("pt-BR", { hour: "numeric", minute: "2-digit" });

const tokenKey = (handle: string) => `bipe.shop.${handle}`;
function readToken(handle: string): string | undefined {
  try {
    return localStorage.getItem(tokenKey(handle)) ?? undefined;
  } catch {
    return undefined;
  }
}
function saveToken(handle: string, token: string) {
  try {
    localStorage.setItem(tokenKey(handle), token);
  } catch {
    // A blocked store loses the records of this visit; the shop still receives the booking or order.
  }
}

class ShopError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function call<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    referrerPolicy: "no-referrer",
    headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...(token ? { "x-bipe-shop-token": token } : {}) },
  });
  const body = (await res.json().catch(() => undefined)) as { error?: string } | undefined;
  if (!res.ok) throw new ShopError(body?.error ?? "internal");
  return body as T;
}

const price = (p: Price) => (p.mode === "on_request" ? t("pt", "bipe_catalog_price_on_request") : p.mode === "from" ? t("pt", "bipe_catalog_price_from", p.text) : p.text);

const unitCents = (item: Item) => (item.kind === "product" && item.price.mode === "fixed" && !item.sold_out_today ? item.price.amount_cents : undefined);

/** BipeAPIError.agendaMessage and orderMessage on the phones. Never the raw API message. */
function errorText(e: unknown): string {
  const code = e instanceof ShopError ? e.code : "";
  const keys: Record<string, string> = {
    slot_taken: "bipe_agenda_error_slot_taken",
    too_many_open_bookings: "bipe_agenda_error_too_many_open",
    outside_notice: "bipe_agenda_error_outside_notice",
    outside_horizon: "bipe_agenda_error_outside_horizon",
    agenda_not_published: "bipe_agenda_error_not_published",
    cancellation_window_closed: "bipe_agenda_error_cancel_window",
    order_already_open: "bipe_order_error_already_open",
    orders_closed: "bipe_order_error_closed",
    item_unavailable: "bipe_order_error_item",
    price_not_fixed: "bipe_order_error_price",
  };
  return t("pt", keys[code] ?? "bipe_error_generic");
}

function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ShopWeb({ handle }: { handle: string }) {
  const base = `/v1/businesses/${encodeURIComponent(handle)}`;
  const [tools, setTools] = useState<Tools>();
  const [items, setItems] = useState<Item[]>([]);
  const [services, setServices] = useState<Item[]>([]);
  const [token, setToken] = useState<string>();
  const [records, setRecords] = useState<Records>();
  const [open, setOpen] = useState<"book" | "order">();

  useEffect(() => {
    setToken(readToken(handle));
    call<Tools>(`${base}/tools`).then(setTools).catch(() => {});
  }, [base, handle]);

  const live = (id: string) => tools?.tools.includes(id) ?? false;
  useEffect(() => {
    if (!tools) return;
    if (tools.tools.includes("catalog") || tools.tools.includes("orders")) {
      call<{ items: Item[] }>(`${base}/catalog`).then((r) => setItems(r.items)).catch(() => {});
    }
    if (tools.tools.includes("agenda")) {
      call<{ services: Item[] }>(`${base}/agenda/services`).then((r) => setServices(r.services)).catch(() => {});
    }
  }, [base, tools]);

  const refresh = useCallback(() => {
    if (!token) return;
    call<Records>(`${base}/web/records`, undefined, token).then(setRecords).catch(() => {});
  }, [base, token]);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const remember = (fresh?: string) => {
    if (fresh) {
      saveToken(handle, fresh);
      setToken(fresh);
    }
    setOpen(undefined);
    refresh();
  };

  if (!tools || tools.tools.length === 0) return null;
  const products = items.filter((i) => unitCents(i) !== undefined);
  return (
    <div className="shop">
      <div className="shop-actions">
        {live("agenda") && services.length > 0 && (tools.web_booking ? (
          <button type="button" className="button primary" onClick={() => setOpen("book")}>{t("pt", "bipe_agenda_book")}</button>
        ) : (
          <p className="small muted">{t("pt", "bipe_agenda_book")}: {t("pt", "bipe_loja_app_only")}</p>
        ))}
        {live("orders") && products.length > 0 && (tools.web_orders ? (
          <button type="button" className="button primary" onClick={() => setOpen("order")}>{t("pt", "bipe_order_make")}</button>
        ) : (
          <p className="small muted">{t("pt", "bipe_order_make")}: {t("pt", "bipe_loja_app_only")}</p>
        ))}
      </div>
      {open === "book" && <BookForm base={base} token={token} services={services} onDone={remember} />}
      {open === "order" && <OrderForm base={base} token={token} products={products} onDone={remember} />}
      {records && (records.bookings.length > 0 || records.orders.length > 0) && (
        <RecordList handle={handle} base={base} token={token!} records={records} services={services} onChange={refresh} />
      )}
      {live("catalog") && items.length > 0 && (
        <div className="shop-catalog">
          <h2 className="sub">{t("pt", "bipe_catalog_title")}</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span><strong>{item.name}</strong>{item.description && <span className="shop-text small muted">{item.description}</span>}</span>
                <span className="small">{item.sold_out_today ? t("pt", "bipe_catalog_sold_out_today") : price(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="shop-field">
      <span className="small">{t("pt", "bipe_loja_your_name")}</span>
      <input type="text" autoComplete="given-name" maxLength={40} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function BookForm({ base, token, services, onDone }: { base: string; token?: string; services: Item[]; onDone: (fresh?: string) => void }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [days, setDays] = useState<SlotDay[]>();
  const [date, setDate] = useState<string>();
  const [start, setStart] = useState<string>();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setDays(undefined);
    setStart(undefined);
    const from = new Date();
    const to = new Date(from.getTime() + (WEEK_DAYS - 1) * 86_400_000);
    const q = new URLSearchParams({ service_id: serviceId, agenda_id: "any", date_from: localDate(from), date_to: localDate(to) });
    call<{ days: SlotDay[] }>(`${base}/agenda/slots?${q}`).then((r) => {
      setDays(r.days);
      setDate(r.days.find((d) => d.slots.length > 0)?.date);
    }, (e: unknown) => {
      setDays([]);
      setError(errorText(e));
    });
  }, [base, serviceId]);

  const shown = days?.find((d) => d.date === date);
  return (
    <form
      className="shop-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!start || !name.trim()) return;
        setBusy(true);
        setError(undefined);
        call<{ token?: string }>(`${base}/web/bookings`, { method: "POST", body: JSON.stringify({ name: name.trim(), service_id: serviceId, agenda_id: "any", start }) }, token)
          .then((r) => onDone(r.token), (err: unknown) => setError(errorText(err)))
          .finally(() => setBusy(false));
      }}
    >
      <label className="shop-field">
        <span className="small">{t("pt", "bipe_agenda_pick_service")}</span>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} · {price(s.price)}</option>)}
        </select>
      </label>
      <div className="shop-chips">
        {days?.map((d) => (
          <button key={d.date} type="button" className={d.date === date ? "chip on" : "chip"} disabled={d.slots.length === 0} onClick={() => setDate(d.date)}>
            {dayName.format(Date.parse(`${d.date}T12:00:00Z`))}
          </button>
        ))}
      </div>
      {days && (shown && shown.slots.length > 0 ? (
        <div className="shop-chips">
          {shown.slots.map((s) => (
            <button key={s.start} type="button" className={s.start === start ? "chip on" : "chip"} onClick={() => setStart(s.start)}>
              {clock.format(Date.parse(s.start))}
            </button>
          ))}
        </div>
      ) : <p className="small muted">{t("pt", "bipe_agenda_no_slots")}</p>)}
      <NameField value={name} onChange={setName} />
      {error && <p className="small" role="alert">{error}</p>}
      <button type="submit" className="button primary" disabled={busy || !start || !name.trim()}>{t("pt", "bipe_loja_send")}</button>
    </form>
  );
}

function OrderForm({ base, token, products, onDone }: { base: string; token?: string; products: Item[]; onDone: (fresh?: string) => void }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const lines = products.filter((p) => (cart[p.id] ?? 0) > 0);
  const total = lines.reduce((sum, p) => sum + (unitCents(p) ?? 0) * cart[p.id]!, 0);
  return (
    <form
      className="shop-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (lines.length === 0 || !name.trim()) return;
        setBusy(true);
        setError(undefined);
        call<{ token?: string }>(`${base}/web/orders`, { method: "POST", body: JSON.stringify({ name: name.trim(), lines: lines.map((p) => ({ item_id: p.id, quantity: cart[p.id] })) }) }, token)
          .then((r) => onDone(r.token), (err: unknown) => setError(errorText(err)))
          .finally(() => setBusy(false));
      }}
    >
      {products.map((p) => (
        <label key={p.id} className="shop-line">
          <span>{p.name}<span className="shop-text small muted">{price(p.price)}</span></span>
          <input
            type="number" min={0} max={999} inputMode="numeric" aria-label={`${t("pt", "bipe_order_quantity")}: ${p.name}`}
            value={cart[p.id] ?? 0}
            onChange={(e) => setCart((c) => ({ ...c, [p.id]: Math.min(999, Math.max(0, Math.trunc(Number(e.target.value)) || 0)) }))}
          />
        </label>
      ))}
      <p className="small">{t("pt", "bipe_loja_pickup")} · {t("pt", "bipe_loja_pay_at_pickup")}</p>
      <p><strong>{t("pt", "bipe_order_total")}: {money.format(total / 100)}</strong></p>
      <NameField value={name} onChange={setName} />
      {error && <p className="small" role="alert">{error}</p>}
      <button type="submit" className="button primary" disabled={busy || lines.length === 0 || !name.trim()}>{t("pt", "bipe_loja_send")}</button>
    </form>
  );
}

function RecordList({ handle, base, token, records, services, onChange }: { handle: string; base: string; token: string; records: Records; services: Item[]; onChange: () => void }) {
  const [error, setError] = useState<string>();
  const cancel = (path: string) => {
    setError(undefined);
    call(path, { method: "POST", body: "{}" }, token).then(onChange, (e: unknown) => setError(errorText(e)));
  };
  const bookingStatus = (s: string) => (s === "requested" ? t("pt", "bipe_loja_waiting") : t("pt", `bipe_agenda_status_${s}`));
  // The fragment never reaches a server. The app reads it and claims the records into the account (ADR 0195 point 7).
  // www: a universal link opens the app only when it leaves the current host; www redirects here without the app.
  const claimLink = `https://www.bipe.chat/@${handle}#claim=${encodeURIComponent(token)}`;
  return (
    <div className="shop-records">
      <h2 className="sub">{t("pt", "bipe_loja_records_title")}</h2>
      {error && <p className="small" role="alert">{error}</p>}
      <ul>
        {records.bookings.map((b) => (
          <li key={b.id}>
            <span>
              <strong>{services.find((s) => s.id === b.service_id)?.name ?? t("pt", "bipe_agenda_card_title")}</strong>
              <span className="shop-text small">{when.format(Date.parse(b.start))}</span>
              <span className="shop-text small muted">{bookingStatus(b.status)}</span>
            </span>
            {OPEN_BOOKING.includes(b.status) && <button type="button" className="link" onClick={() => cancel(`${base}/web/bookings/${encodeURIComponent(b.id)}/cancel`)}>{t("pt", "bipe_agenda_cancel")}</button>}
          </li>
        ))}
        {records.orders.map((o) => (
          <li key={o.id}>
            <span>
              <strong>{o.lines.map((l) => t("pt", "bipe_order_line", String(l.quantity), l.name)).join(", ")}</strong>
              <span className="shop-text small">{money.format(o.total_amount_cents / 100)} · {t("pt", "bipe_loja_pickup")}</span>
              <span className="shop-text small muted">{t("pt", `bipe_order_status_${o.status}`)}</span>
            </span>
            {OPEN_ORDER.includes(o.status) && <button type="button" className="link" onClick={() => cancel(`${base}/web/orders/${encodeURIComponent(o.id)}/cancel`)}>{t("pt", "bipe_order_cancel")}</button>}
          </li>
        ))}
      </ul>
      <p><a className="button" href={claimLink}>{t("pt", "bipe_loja_get_alerts")}</a></p>
    </div>
  );
}
