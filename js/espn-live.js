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
const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

function espnMinute(clock, state, detail){
  if (state === "post") return 90;
  if (/half/i.test(detail||"") || /HT/i.test(clock||"")) return 45;
  const m = parseInt(clock, 10);
  return isNaN(m) ? 0 : m;
}

async function loadEspnLive(){
  if (!LIVE.inplay) LIVE.inplay = {};
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
          home, away, hs, as,
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
