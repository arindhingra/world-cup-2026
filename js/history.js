/* =====================================================================
   PAST CHAMPIONS PAGE RENDERER
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);

  /* ---- aggregate titles for the "Hall of Champions" cards ---- */
  function renderLegends(){
    const tally = {};
    WINNERS.forEach(w=>{
      const key = w.winner==="West Germany" ? "Germany" : w.winner;
      const flag = (w.winner==="West Germany") ? "🇩🇪" : w.wflag;
      if(!tally[key]) tally[key] = { name:key, flag, years:[] };
      tally[key].years.push(w.year);
    });
    const list = Object.values(tally).sort((a,b)=> b.years.length - a.years.length || a.years[0]-b.years[0]);
    $("#legends").innerHTML = list.map(t=>`
      <div class="legend">
        <div class="lf">${t.flag}</div>
        <div class="lt">${t.name}</div>
        <div class="lc">${t.years.length} ${t.years.length>1?'titles':'title'}</div>
        <div class="stars">${'★'.repeat(t.years.length)}</div>
        <div class="lc" style="margin-top:6px;font-size:11px">${t.years.join(' · ')}</div>
      </div>`).join("");
    $("#stat-tournaments").textContent = WINNERS.length;
    $("#stat-nations").textContent = list.length;
    $("#stat-top").textContent = `${list[0].flag} ${list[0].years.length}`;
  }

  /* ---- chronological timeline of every final ---- */
  function renderTimeline(){
    const rows = [...WINNERS].sort((a,b)=> b.year - a.year); // newest first
    $("#timeline").innerHTML = rows.map(w=>`
      <div class="tl-row">
        <div class="tl-year">${w.year}<small>${w.host}</small></div>
        <div class="tl-card">
          <div class="tl-win">
            <span class="tf">${w.wflag}</span>
            <span class="wt">${w.winner}<small>CHAMPIONS</small></span>
          </div>
          <span class="tl-vs">beat</span>
          <div class="tl-run"><span class="rf">${w.rflag}</span>${w.runner}</div>
          <span class="tl-score">${w.score}</span>
          <span class="tl-host">🏟️ Hosted by ${w.host}</span>
        </div>
      </div>`).join("");
  }

  document.addEventListener("DOMContentLoaded", ()=>{ renderLegends(); renderTimeline(); });
})();
