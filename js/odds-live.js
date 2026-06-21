/* =====================================================================
   LIVE ODDS LOADER (The Odds API)
   ---------------------------------------------------------------------
   With a key in config.js, fetches current h2h (1X2) odds for the
   FIFA World Cup, averages the implied probabilities across all US
   sportsbooks, de-vigs them, and exposes them keyed by an unordered
   team pair so app.js can orient them to each fixture.

   Fully defensive: any failure (no key, quota, network, CORS, parse)
   resolves to `false` and the UI keeps the verified snapshot.
   ===================================================================== */
const LIVE = { odds: {}, scores: {}, status: "snapshot", asof: null };

/* map The Odds API team names → the names used in this site's fixtures */
const ODDS_NAME_MAP = {
  "Turkey":"Türkiye", "Turkiye":"Türkiye",
  "Czech Republic":"Czechia",
  "South Korea":"South Korea", "Korea Republic":"South Korea",
  "USA":"United States", "United States of America":"United States",
  "Bosnia and Herzegovina":"Bosnia & Herzegovina", "Bosnia & Herzegovina":"Bosnia & Herzegovina",
  "Ivory Coast":"Ivory Coast", "Cote d'Ivoire":"Ivory Coast", "Côte d'Ivoire":"Ivory Coast",
  "DR Congo":"DR Congo", "Congo DR":"DR Congo", "Democratic Republic of the Congo":"DR Congo",
  "Cape Verde":"Cape Verde", "Cabo Verde":"Cape Verde",
  "Curacao":"Curaçao", "Curaçao":"Curaçao"
};
function normTeam(name){
  if (!name) return null;
  const n = ODDS_NAME_MAP[name] || name;
  return (typeof TEAMS !== "undefined" && TEAMS[n]) ? n : null;
}
/* unordered pair key so it matches a fixture regardless of home/away order */
function pairKey(a, b){ return [a, b].sort().join("|"); }

async function loadLiveOdds(){
  const key = (window.ODDS_API_KEY || "").trim();
  if (!key) return false;
  const url = "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds"
            + "?regions=us&markets=h2h&oddsFormat=decimal&apiKey=" + encodeURIComponent(key);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const events = await res.json();
    if (!Array.isArray(events)) return false;

    let matched = 0;
    for (const ev of events){
      const home = normTeam(ev.home_team), away = normTeam(ev.away_team);
      if (!home || !away || !Array.isArray(ev.bookmakers)) continue;
      let sh=0, sd=0, sa=0, n=0;
      for (const bk of ev.bookmakers){
        const mkt = (bk.markets || []).find(m => m.key === "h2h");
        if (!mkt) continue;
        const oh = mkt.outcomes.find(o => normTeam(o.name) === home);
        const oa = mkt.outcomes.find(o => normTeam(o.name) === away);
        const od = mkt.outcomes.find(o => o.name === "Draw");
        if (!oh || !oa || !od) continue;
        const ih = 1/oh.price, id = 1/od.price, ia = 1/oa.price, s = ih+id+ia;
        sh += ih/s; sd += id/s; sa += ia/s; n++;
      }
      if (n > 0){
        LIVE.odds[pairKey(home, away)] = {
          [home]: sh/n, [away]: sa/n, draw: sd/n, books: n
        };
        matched++;
      }
    }
    if (matched > 0){ LIVE.status = "live"; return true; }
    return false;
  } catch (_){ return false; }
}

/* Live SCORES — marks games that have actually finished (authoritative).
   Lets the site drop a match the moment it goes final, with the result. */
async function loadLiveScores(){
  const key = (window.ODDS_API_KEY || "").trim();
  if (!key) return false;
  const url = "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/scores"
            + "?daysFrom=3&apiKey=" + encodeURIComponent(key);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    const events = await res.json();
    if (!Array.isArray(events)) return false;

    let n = 0;
    for (const ev of events){
      const home = normTeam(ev.home_team), away = normTeam(ev.away_team);
      if (!home || !away) continue;
      const rec = { completed: !!ev.completed };
      if (Array.isArray(ev.scores)){
        const sh = ev.scores.find(s => normTeam(s.name) === home);
        const sa = ev.scores.find(s => normTeam(s.name) === away);
        if (sh && sa){ rec[home] = +sh.score; rec[away] = +sa.score; }
      }
      LIVE.scores[pairKey(home, away)] = rec;
      if (rec.completed) n++;
    }
    return n >= 0;
  } catch (_){ return false; }
}
