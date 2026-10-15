// Business tool scenes (bipe/docs/business-tools.md, ADRs 0104 to 0107; planned): catálogo, pedidos, orçamento,
// fila virtual. Labels come from the app strings through t(); sample data is toolsDemo in scenes.ts.
// Cards reuse the Agenda card look (Agenda.css): drawn from the API, pinned above the chat.
import { Avatar, label, who } from "../cast";
import { Bubble, Phone } from "../components/phone";
import { Icon } from "../components/ui";
import { t, type Lang } from "../shared";
import { Push } from "./AgendaParts";
import { ChatHead, TrustMark } from "./ScenePhone";
import { text, toolsDemo as demo, type CatalogItem } from "./scenes";
import "./Agenda.css";

function price(lang: Lang, x: CatalogItem) {
  if (x.onRequest) return t(lang, "bipe_catalog_price_on_request");
  return x.from ? t(lang, "bipe_catalog_price_from", x.price) : x.price;
}

function BizTitle({ lang, id, title }: { lang: Lang; id: string; title: string }) {
  const biz = who(id);
  return (
    <div className="tool-biz">
      <Avatar id={biz.id} size={40} />
      <div><strong>{label(biz)} <TrustMark lang={lang} trust={biz.trust} size={16} /></strong><span className="sub">{title}</span></div>
    </div>
  );
}

/** Catálogo: the business's list on its profile. Beat 2: the owner marks one item "esgotado hoje". */
export function CatalogView({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  return (
    <Phone lang={lang} layout="form" head={t(lang, "bipe_catalog_title")}>
      <BizTitle lang={lang} id={id} title={t(lang, "bipe_catalog_title")} />
      {demo.catalog.map((c) => (
        <div className="tool-group msg" key={text(c.category, "pt")}>
          <h4>{text(c.category, lang)}</h4>
          <div className="agenda-rows">
            {c.items.map((x) => (
              <div className={`agenda-row${x.soldOut && beat >= 2 ? " off" : ""}`} key={text(x.name, "pt")}>
                <span className="agenda-initial"><Icon name="bag" size={16} /></span>
                <div className="agenda-row-main"><strong>{text(x.name, lang)}</strong><span className="sub">{price(lang, x)}</span></div>
                {x.soldOut && beat >= 2 && <span className="tool-chip">{t(lang, "bipe_catalog_sold_out_today")}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Phone>
  );
}

const item = ([c, i]: number[]) => demo.catalog[c].items[i];
const ORDER_STATUS = ["bipe_order_status_sent", "bipe_order_status_accepted", "bipe_order_status_ready"];

function OrderCard({ lang, status }: { lang: Lang; status: number }) {
  return (
    <div className="booking">
      <div className="booking-head">
        <span><Icon name="bag" size={14} /> {t(lang, "bipe_order_card_title")}</span>
        <span className={`booking-chip${status === 0 ? " wait" : ""}`}>{t(lang, ORDER_STATUS[status])}</span>
      </div>
      {demo.order.lines.map((l) => (
        <div className="tool-line" key={l.item.join()}><span>{l.qty}× {text(item(l.item).name, lang)}</span><span>{l.total}</span></div>
      ))}
      <div className="tool-line total"><span>{t(lang, "bipe_order_total")}</span><span>{demo.order.total}</span></div>
      <div className="booking-line muted">{t(lang, "bipe_order_pickup")} · {t(lang, "bipe_order_pay_on_site")}</div>
    </div>
  );
}

/** Pedidos: build the order from the catálogo (beat 1), then the order card in the chat: sent, accepted, ready. Each change is also a push (bipe_order_push_*). */
export function OrderFlow({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const biz = who(id);
  if (beat <= 1) {
    return (
      <Phone lang={lang} layout="form" head={t(lang, "bipe_order_make")}>
        <BizTitle lang={lang} id={id} title={t(lang, "bipe_order_make")} />
        <div className="agenda-rows msg">
          {demo.order.lines.map((l) => (
            <div className="agenda-row" key={l.item.join()}>
              <div className="agenda-row-main"><strong>{text(item(l.item).name, lang)}</strong><span className="sub">{item(l.item).price}</span></div>
              <span className="tool-qty"><span>−</span>{l.qty}<span>+</span></span>
            </div>
          ))}
        </div>
        <div className="tool-toggle"><span className="on">{t(lang, "bipe_order_pickup")}</span><span>{t(lang, "bipe_order_delivery")}</span></div>
        <div className="tool-toggle"><span>{t(lang, "bipe_order_pay_pix")}</span><span className="on">{t(lang, "bipe_order_pay_on_site")}</span></div>
        <div className="tool-line total"><span>{t(lang, "bipe_order_total")}</span><span>{demo.order.total}</span></div>
        <span className="pill wide agenda-confirm">{t(lang, "bipe_order_send")}</span>
      </Phone>
    );
  }
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={biz.id} trust={biz.trust} />}>
      <div className="booking-pin msg"><OrderCard lang={lang} status={Math.min(beat - 2, 2)} /></div>
      <div className="msg"><Bubble lang={lang} out>{text(demo.order.note, lang)}</Bubble></div>
    </Phone>
  );
}

function QuoteCard({ lang, accepted }: { lang: Lang; accepted: boolean }) {
  const q = demo.quote;
  return (
    <div className="booking">
      <div className="booking-head">
        <span><Icon name="receipt" size={14} /> {t(lang, "bipe_quote_card_title")} · {t(lang, "bipe_quote_version", String(q.version))}</span>
        {accepted && <span className="booking-chip">{t(lang, "bipe_quote_status_accepted")}</span>}
      </div>
      {q.lines.map((l) => <div className="tool-line" key={l.name}><span>{l.name}</span><span>{l.price}</span></div>)}
      <div className="tool-line total"><span>{t(lang, "bipe_order_total")}</span><span>{q.total}</span></div>
      <div className="booking-line muted">{t(lang, "bipe_quote_valid_until", q.valid)}</div>
      {!accepted && (
        <div className="booking-actions">
          <span className="primary">{t(lang, "bipe_quote_accept")}</span>
          <span>{t(lang, "bipe_quote_decline")}</span>
        </div>
      )}
    </div>
  );
}

/** Orçamento: the customer describes the job in the chat; the quote card pins above it; the customer accepts. */
export function QuoteChat({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const biz = who(id);
  return (
    <Phone lang={lang} head={<ChatHead lang={lang} id={biz.id} trust={biz.trust} />}>
      {beat >= 3 && <div className="booking-pin msg"><QuoteCard lang={lang} accepted={beat >= 4} /></div>}
      {beat >= 1 && <div className="msg"><Bubble lang={lang} out>{text(demo.quote.ask, lang)}</Bubble></div>}
      {beat >= 2 && <div className="msg"><Bubble lang={lang}>{text(demo.quote.reply, lang)}</Bubble></div>}
    </Phone>
  );
}

/** Fila virtual: the customer's place (beat 1), a push with 2 people ahead (beat 2), then the call (beat 3). */
export function QueueView({ lang, id, beat }: { lang: Lang; id: string; beat: number }) {
  const biz = who(id);
  const q = demo.queue;
  const called = beat >= 3;
  return (
    <Phone lang={lang} layout="form" head={t(lang, "bipe_queue_title")}>
      <BizTitle lang={lang} id={id} title={text(q.service, lang)} />
      {beat === 2 && <Push lang={lang} id={id} body={t(lang, "bipe_queue_push_two_ahead", label(biz))} />}
      {called && <Push lang={lang} id={id} body={t(lang, "bipe_queue_push_called", label(biz))} />}
      <div className={`tool-queue msg${called ? " called" : ""}`} key={called ? "c" : "w"}>
        {called ? (
          <strong className="tool-queue-big">{t(lang, "bipe_queue_called")}</strong>
        ) : (
          <>
            <span className="sub">{t(lang, "bipe_queue_position")}</span>
            <strong className="tool-queue-big">{q.positions[beat >= 2 ? 1 : 0]}</strong>
            <span>{t(lang, "bipe_queue_wait", text(q.wait, lang))}</span>
          </>
        )}
      </div>
      {!called && <span className="tool-leave">{t(lang, "bipe_queue_leave")}</span>}
    </Phone>
  );
}
