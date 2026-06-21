/* =====================================================================
   LIVE STANDINGS — shared by the Predictions and Groups pages.
   ---------------------------------------------------------------------
   Folds any FINAL scores reported by the live feed (loadLiveScores) on
   top of the verified snapshot, so each group's table and the
   qualification odds update the moment a game goes final.

   With no API key there are no live finals, so these return the static
   snapshot unchanged — identical to the curated data.
   ===================================================================== */

/* final score for a fixture, if the live feed has marked it complete */
function liveFinalScore(f){
  if (typeof LIVE !== "undefined" && LIVE.scores && typeof pairKey === "function"){
    const s = LIVE.scores[pairKey(f.home, f.away)];
    if (s && s.completed && s[f.home] != null && s[f.away] != null)
      return { hs: s[f.home], as: s[f.away] };
  }
  return null;
}

/* snapshot standings + every fixture the feed reports as final */
function effectiveStandings(){
  const tbl = {};
  for (const t in STANDINGS){
    const s = STANDINGS[t];
    tbl[t] = { pld:s.pld, w:s.w, d:s.d, l:s.l, gf:s.gf, ga:s.ga };
  }
  FIXTURES.forEach(f => {
    const r = liveFinalScore(f);
    if (!r) return;
    const H = tbl[f.home], A = tbl[f.away];
    H.pld++; A.pld++;
    H.gf += r.hs; H.ga += r.as; A.gf += r.as; A.ga += r.hs;
    if (r.hs > r.as){ H.w++; A.l++; }
    else if (r.hs < r.as){ H.l++; A.w++; }
    else { H.d++; A.d++; }
  });
  return tbl;
}

/* fixtures still to be played (no known final result) — what the sim runs on */
function remainingForSim(){ return FIXTURES.filter(f => !liveFinalScore(f)); }

/* finals from the feed, formatted for the results strip */
function liveFinalsList(){
  const out = [];
  FIXTURES.forEach(f => {
    const r = liveFinalScore(f);
    if (r) out.push({ date:f.date, group:f.group, home:f.home, away:f.away,
                      hs:r.hs, as:r.as, venue:f.venue });
  });
  return out;
}

/* true when the live feed is actively supplying data */
function standingsAreLive(){
  return typeof LIVE !== "undefined" && LIVE.status === "live" &&
         FIXTURES.some(f => liveFinalScore(f));
}
