/* =====================================================================
   ESPN LIVE FEED  (no API key required)
   ---------------------------------------------------------------------
   ESPN's public scoreboard API returns live & final scores AND the match
   minute for the FIFA World Cup, with permissive CORS — so the site can
   show real in-play scores and fold finished results into the standings
   with no key and no setup.

   Populates:
     LIVE.scores[pair] = { completed, [home]:goals, [away]:goals }
     LIVE.inplay[pair] = { home, away, hs, as, clock, detail, minute }

   Fully defensive: any failure leaves the verified snapshot in place.
   ===================================================================== */
// Pull the ENTIRE group-stage date range, not ESPN's default rolling window —
// otherwise once the date advances, earlier results drop out of the feed and
// the standings lose them. The range returns every group-stage game at once.
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260627";

/* live in-play odds cached per game (the ESPN live entry is intermittent,
   so we keep the last seen line rather than flickering back to pre-match) */
const LIVE_ODDS_CACHE = {};
const _amer = ml => (ml > 0 ? "+" : "") + Math.round(ml);
const _impl = ml => ml > 0 ? 100/(ml+100) : (-ml)/((-ml)+100);
const _probToAmer = p => { p = Math.min(0.99, Math.max(0.01, p));
  return p >= 0.5 ? "-" + Math.round(p/(1-p)*100) : "+" + Math.round((1-p)/p*100); };

function espnMinute(clock, state, detail){
  if (state === "post") return 90;
  if (/half/i.test(detail||"") || /HT/i.test(clock||"")) return 45;
  const m = parseInt(clock, 10);
  return isNaN(m) ? 0 : m;
}

async function loadEspnLive(){
  LIVE.inplay = {};   // rebuilt each poll so games that ended clear out
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(ESPN_URL, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data.events)) return false;

    let any = false, live = false;
    for (const ev of data.events){
      const comp = (ev.competitions || [])[0];
      if (!comp) continue;
      const status = ev.status || {};
      const type = status.type || {};
      const state = type.state;                       // pre | in | post
      const cs = comp.competitors || [];
      const hC = cs.find(c => c.homeAway === "home") || cs[0];
      const aC = cs.find(c => c.homeAway === "away") || cs[1];
      if (!hC || !aC) continue;
      const home = normTeam(hC.team.displayName) || normTeam(hC.team.shortDisplayName) || normTeam(hC.team.name);
      const away = normTeam(aC.team.displayName) || normTeam(aC.team.shortDisplayName) || normTeam(aC.team.name);
      if (!home || !away) continue;
      const key = pairKey(home, away);
      const hs = parseInt(hC.score, 10) || 0;
      const as = parseInt(aC.score, 10) || 0;

      if (state === "post"){
        LIVE.scores[key] = { completed: true, [home]: hs, [away]: as };
        any = true;
      } else if (state === "in"){
        LIVE.scores[key] = { completed: false, [home]: hs, [away]: as };
        LIVE.inplay[key] = {
          home, away, hs, as, eventId: ev.id,
          clock: status.displayClock || type.shortDetail || "LIVE",
          detail: type.shortDetail || "",
          minute: espnMinute(status.displayClock, state, type.shortDetail)
        };
        any = true; live = true;
      }
    }
    if (any){ LIVE.status = "live"; LIVE.asof = Date.now(); }
    return any;
  } catch (_){ return false; }
}

/* For each in-play game, pull its goal events (minute + scoring team) from
   ESPN's match summary, so the win-probability timeline can be reconstructed. */
async function loadLiveTimelines(){
  if (!LIVE.inplay) return false;
  const keys = Object.keys(LIVE.inplay).filter(k => LIVE.inplay[k].eventId);
  if (!keys.length) return false;
  await Promise.all(keys.map(async key => {
    const ip = LIVE.inplay[key];
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=" + ip.eventId,
        { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!res.ok) return;
      const d = await res.json();
      const goals = [];
      for (const e of (d.keyEvents || [])){
        if (!e.scoringPlay) continue;                       // goals only
        const team = normTeam((e.team || {}).displayName);
        const min = parseInt((e.clock || {}).displayValue, 10);
        if (team && !isNaN(min)) goals.push({ minute: min, team });
      }
      goals.sort((a, b) => a.minute - b.minute);
      ip.goals = goals;

      // live in-play odds (ESPN's "DraftKings - Live Odds" provider).
      // The entry is intermittent and can ship a null leg, so accept any line
      // with ≥2 of 3 present and back out the missing leg from the over-round.
      const le = (d.odds || []).find(o => /live/i.test(((o.provider || {}).name) || ""));
      if (le){
        const raw = { h:(le.homeTeamOdds||{}).moneyLine, d:(le.drawOdds||{}).moneyLine, a:(le.awayTeamOdds||{}).moneyLine };
        const present = ["h","d","a"].filter(k => raw[k] != null);
        if (present.length >= 2){
          const imp = {}; let known = 0;
          present.forEach(k => { imp[k] = _impl(raw[k]); known += imp[k]; });
          const missing = ["h","d","a"].filter(k => raw[k] == null);
          if (missing.length){                          // share remaining book margin
            const rem = Math.max(0.02, 1.06 - known);
            missing.forEach(k => imp[k] = rem / missing.length);
          }
          const s = imp.h + imp.d + imp.a;
          const oddsStr = k => raw[k] != null ? _amer(raw[k]) : _probToAmer(imp[k]);
          LIVE_ODDS_CACHE[key] = {
            home: ip.home, away: ip.away,
            hOdds: oddsStr("h"), dOdds: oddsStr("d"), aOdds: oddsStr("a"),
            ph: imp.h/s, pd: imp.d/s, pa: imp.a/s,
            book: (((le.provider || {}).name) || "DraftKings").replace(/\s*-\s*Live Odds/i, "")
          };
        }
      }
      if (LIVE_ODDS_CACHE[key]) ip.liveOdds = LIVE_ODDS_CACHE[key];
    } catch (_){ /* leave goals/odds undefined → card falls back gracefully */ }
  }));
  return true;
}
