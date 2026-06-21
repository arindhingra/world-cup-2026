/* =====================================================================
   GROUPS PAGE RENDERER
   ---------------------------------------------------------------------
   Full standings + qualification odds for all 12 groups, rebuilt from
   live final scores whenever the feed updates (so the rankings move as
   each game finishes). Shares the standings/sim logic with the
   Predictions page via standings.js + model.js.
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const fl = t => TEAMS[t].flag;
  const pct = x => Math.round(x * 100);
  const groups = "ABCDEFGHIJKL".split("");

  function render(odds, standings){
    $("#groups-full").innerHTML = groups.map(g => {
      const rows = MODEL.currentTable(g, standings);
      const trs = rows.map((r, i) => {
        const o = odds[r.team];
        const adv = pct(o.advance), wg = pct(o.winGroup);
        const qcls = i===0 ? "q1" : i===1 ? "q2" : i===2 ? "q3" : "";
        const tag = adv >= 99.5 ? `<span class="qtag in" title="Qualified">Q</span>`
                  : adv <= 0.5  ? `<span class="qtag out" title="Eliminated">×</span>` : "";
        return `<tr class="${qcls}">
          <td class="l"><div class="tcell"><span class="pos">${i+1}</span><span class="fl">${fl(r.team)}</span><span class="tnm">${r.team}</span>${tag}</div></td>
          <td>${r.pld}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
          <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd>0?'+':''}${r.gd}</td>
          <td class="pts">${r.pts}</td>
          <td class="adv"><div class="adv-bar"><i style="width:${Math.max(adv,2)}%"></i><b>${adv}%</b></div></td>
          <td class="wg">${wg}%</td>
        </tr>`;
      }).join("");
      return `<div class="gcard">
        <h3><span class="gl">${g}</span> Group ${g}</h3>
        <div class="gt-scroll"><table class="gt gt-full">
          <thead><tr>
            <th class="l">Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Advance</th><th title="Win the group">1st</th>
          </tr></thead>
          <tbody>${trs}</tbody>
        </table></div>
        <div class="gfoot">
          <span><i style="background:var(--green)"></i>1st</span>
          <span><i style="background:var(--cyan)"></i>2nd</span>
          <span><i style="background:var(--gold)"></i>3rd (8 best advance)</span>
        </div>
      </div>`;
    }).join("");
  }

  function updateLiveTag(){
    const el = $("#groups-live");
    if (!el) return;
    el.innerHTML = (typeof standingsAreLive === "function" && standingsAreLive())
      ? `<span><span class="mlive">● LIVE</span> tables updating from real results &amp; in-play games</span>`
      : `<span>📡 Loading live scores… standings update as games go final</span>`;
  }

  function refresh(){
    const standings = effectiveStandings();
    const odds = MODEL.simulate(15000, standings, remainingForSim());
    render(odds, standings);
    const ld = $("#groups-loading"); if (ld) ld.style.display = "none";
    updateLiveTag();
  }

  let lastSig = "";
  function finishedSig(){
    if (typeof LIVE === "undefined" || !LIVE.scores || typeof pairKey !== "function") return "";
    return FIXTURES.filter(f => { const s = LIVE.scores[pairKey(f.home,f.away)]; return s && s.completed; })
                   .map(f => f.home).sort().join(",");
  }

  function boot(){
    updateLiveTag();
    setTimeout(() => { refresh(); lastSig = finishedSig(); }, 50);
    // ESPN live feed (no key): fold real results into the tables, poll for more
    if (typeof loadEspnLive === "function"){
      const tick = () => loadEspnLive().then(ok => {
        if (!ok) return;
        updateLiveTag();
        const sig = finishedSig();
        if (sig !== lastSig){ lastSig = sig; refresh(); }  // a result changed → re-sim
      });
      tick();
      setInterval(tick, 45000);
    }
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
