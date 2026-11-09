import { Avatar, who } from "../cast";
import { t, type AccountModel, type Lang } from "../shared";

// How a work account fits together (bipe ADR 0287): one person, a personal account and a work account,
// the people who answer for it, Interno, and what the customer sees. Words come from
// business.accountModel in bipe-shared product.json; people and the company from the cast.
const OWNER = "antonio";
const ATTENDANT = "fernanda";
const COMPANY = "padaria";
const CUSTOMER = "joana";

export function WorkAccountFigure({ lang, model }: { lang: Lang; model: AccountModel }) {
  const [person, personal, work, answers, interno] = model.terms;
  const owner = who(OWNER);
  const attendant = who(ATTENDANT);
  const company = who(COMPANY);
  return (
    <div className="stage wa">
      <div className="wa-tree" lang={lang}>
        <div className="wa-node wa-person">
          <Avatar id={OWNER} size={36} />
          <div><div className="wa-kind">{person?.name}</div><div className="wa-name">{model.you}</div></div>
        </div>
        <div className="wa-branches">
          <div className="wa-col">
            <div className="wa-node wa-personal">
              <div className="wa-kind">{personal?.name}</div>
              <div className="wa-name">{owner.name}</div>
              <div className="wa-handle">@{owner.handle}</div>
            </div>
          </div>
          <div className="wa-col">
            <div className="wa-node wa-work">
              <div className="wa-head">
                <Avatar id={COMPANY} size={32} />
                <div>
                  <div className="wa-kind">{work?.name}</div>
                  <div className="wa-name">{company.name}</div>
                  <div className="wa-handle">@{company.handle}</div>
                </div>
              </div>
              <div className="wa-inner">
                <div className="wa-kind">{answers?.name}</div>
                <ul className="wa-people">
                  <li><Avatar id={OWNER} size={24} /><span>{model.you}</span><em>{t(lang, "bipe_team_role_owner")}</em></li>
                  <li><Avatar id={ATTENDANT} size={24} /><span>{(attendant.name ?? "").split(" ")[0]}</span><em>{t(lang, "bipe_team_role_attendant")}</em></li>
                </ul>
              </div>
              <div className="wa-inner wa-interno">
                <div className="wa-kind">{interno?.name}</div>
                <div className="wa-faces"><Avatar id={OWNER} size={20} /><Avatar id={ATTENDANT} size={20} /></div>
              </div>
            </div>
            <div className="wa-node wa-customer">
              <Avatar id={CUSTOMER} size={24} />
              <span>{model.customerSees}</span>
              <strong>{company.name}</strong>
            </div>
          </div>
        </div>
      </div>
      <p className="caption">{model.caption}</p>
    </div>
  );
}

/** The terms under the figure, in the same order as the figure. */
export function WorkAccountTerms({ model }: { model: AccountModel }) {
  return (
    <dl className="wa-terms">
      {model.terms.map((term) => (
        <div key={term.name}><dt>{term.name}</dt><dd>{term.what}</dd></div>
      ))}
    </dl>
  );
}
