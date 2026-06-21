/* =====================================================================
   MAIN PAGE RENDERER
   ===================================================================== */
(function () {
  const $ = sel => document.querySelector(sel);
  const fl = t => TEAMS[t].flag;
  const pct = x => Math.round(x * 100);
  const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function fmtDate(iso){
    const [y,m,d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m-1, d));
    return { dow: DOW[dt.getUTCDay()], label: `${MON[m-1]} ${d}`, full:`${DOW[dt.getUTCDay()]}, ${MON[m-1]} ${d}` };
  }

  /* ---------------- stat strip ---------------- */
  function renderStats(){
    const played = RESULTS.length ? 34 : 34; // verified: 34 group games played
    $("#stat-remaining").textContent = FIXTURES.length;
    $("#stat-today").textContent = RESULTS.filter(r=>r.date==="2026-06-20").length;
    $("#stat-groups").textContent = 12;
    $("#stat-teams").textContent = 48;
  }

  /* ---------------- results strip ---------------- */
  function renderResults(){
    const box = $("#results");
    box.innerHTML = RESULTS.map(r=>{
      const today = r.date==="2026-06-20";
      const hw = r.hs>r.as, aw = r.as>r.hs;
      const dd = fmtDate(r.date);
      return `<div class="res-card ${today?'today':''}">
        <div class="res-meta"><span class="grp">Group ${r.group}</span><span>${today?'● TODAY':dd.label}</span></div>
        <div class="res-line ${hw?'win':''}">
          <span class="nm"><span class="fl">${fl(r.home)}</span><em>${r.home}</em></span>
          <span class="sc">${r.hs}</span>
        </div>
        <div class="res-line ${aw?'win':''}">
          <span class="nm"><span class="fl">${fl(r.away)}</span><em>${r.away}</em></span>
          <span class="sc">${r.as}</span>
        </div>
      </div>`;
    }).join("");
  }

  /* ---------------- predictions ---------------- */
  function renderPredictions(){
    const box = $("#predictions");
    // group fixtures by date
    const byDate = {};
    FIXTURES.forEach(f=>{ (byDate[f.date] = byDate[f.date]||[]).push(f); });
    const dates = Object.keys(byDate).sort();

    box.innerHTML = dates.map(date=>{
      const dd = fmtDate(date);
      const cards = byDate[date].map(f=>matchCard(f)).join("");
      return `<div class="daygroup">
        <div class="dayhdr">
          <span class="d-date">${dd.full}</span>
          <span class="d-badge">${date==="2026-06-20"?"● Today":date==="2026-06-21"?"Up next":matchdayLabel(byDate[date])}</span>
          <span class="d-line"></span>
          <span class="d-count">${byDate[date].length} matches</span>
        </div>
        <div class="match-grid">${cards}</div>
      </div>`;
    }).join("");
  }

  function matchdayLabel(list){
    // final round groups (Matchday 3) vs second round
    const md3 = list.some(f=>{
      return STANDINGS[f.home].pld>=2; // already played 2 -> this is their 3rd
    });
    return md3 ? "Matchday 3 · Finale" : "Matchday 2";
  }

  function matchCard(f){
    const p = MODEL.predict(f.home, f.away, f.venue);
    const ph=pct(p.pHome), pd=pct(p.pDraw), pa=pct(p.pAway);
    // verdict text
    let verdict;
    const mx = Math.max(p.pHome,p.pDraw,p.pAway);
    if(mx===p.pHome){ verdict=`${f.home} favoured`; }
    else if(mx===p.pAway){ verdict=`${f.away} favoured`; }
    else { verdict="Too close to call"; }
    const conf = mx>0.55?"Strong lean":mx>0.42?"Slight edge":"Coin-flip";
    const eh = Math.round(p.eloHome), ea = Math.round(p.eloAway);

    // ---- model favourite, underdog risk, market cross-check ----
    const mk = MARKET[`${f.home}|${f.away}`];
    const sideOf = (h,dr,a) => (h>=a && h>=dr) ? 'H' : (a>=h && a>=dr) ? 'A' : 'D';
    const modelFav = sideOf(p.pHome, p.pDraw, p.pAway);
    const homeStronger = p.eloHome >= p.eloAway;
    const favWin   = homeStronger ? p.pHome : p.pAway;   // favourite's win chance
    const eloGap   = Math.abs(p.eloHome - p.eloAway);

    let badge = "";
    if (mk){
      const mktFav = sideOf(mk.ph, mk.pd, mk.pa);
      if (mktFav !== modelFav && mktFav !== 'D' && modelFav !== 'D')
        badge = `<span class="alert split" title="The model and the betting market favour different teams">⚡ Model ⇄ Market split</span>`;
    }
    // a clear favourite (Elo gap ≥ 120) held under 60% — a genuine banana skin
    if (!badge && eloGap >= 120 && favWin <= 0.60)
      badge = `<span class="alert upset" title="A clear favourite, but the underdog has a real chance">⚠ Upset alert</span>`;

    return `<div class="match${badge?' flagged':''}">
      <div class="match-top">
        <span class="grp-pill">Group ${f.group}</span>
        ${badge || `<span class="match-venue">${f.venue}</span>`}
      </div>
      ${badge ? `<div class="venue-sub">${f.venue}</div>` : ``}
      <div class="teams">
        <div class="team-side">
          <span class="fl">${fl(f.home)}</span>
          <span class="tn">${f.home}</span>
          <span class="pw">Elo ${eh}</span>
        </div>
        <div class="pscore">
          <span class="ps-val">${p.scoreHome}–${p.scoreAway}</span>
          <span class="ps-lbl">Most likely · ${pct(p.scoreProb)}%</span>
        </div>
        <div class="team-side">
          <span class="fl">${fl(f.away)}</span>
          <span class="tn">${f.away}</span>
          <span class="pw">Elo ${ea}</span>
        </div>
      </div>
      <div class="probbar">
        <div class="seg h" style="width:${ph}%" title="${f.home} win">${ph>=11?`<span>${ph}%</span>`:''}</div>
        <div class="seg d" style="width:${pd}%" title="Draw">${pd>=11?`<span>${pd}%</span>`:''}</div>
        <div class="seg a" style="width:${pa}%" title="${f.away} win">${pa>=11?`<span>${pa}%</span>`:''}</div>
      </div>
      <div class="prob-key">
        <span><b>${ph}%</b> ${shortName(f.home)}</span>
        <span><b>${pd}%</b> Draw</span>
        <span>${shortName(f.away)} <b>${pa}%</b></span>
      </div>
      <div class="verdict">
        <span class="chip">${verdict}</span>· ${conf}
        <span class="xg">xG ${p.xgHome.toFixed(1)}–${p.xgAway.toFixed(1)}</span>
      </div>
      ${mk ? marketBlock(f, mk) : ``}
    </div>`;
  }

  function marketBlock(f, mk){
    const m = x => Math.round(x*100);
    return `<div class="market">
      <div class="market-top"><span>📈 Betting market</span><span class="book">${mk.book} · de-vigged</span></div>
      <div class="market-cells">
        <div class="mcell"><span class="mteam">${shortName(f.home)}</span><b>${mk.h}</b><span class="mpc">${m(mk.ph)}%</span></div>
        <div class="mcell"><span class="mteam">Draw</span><b>${mk.d}</b><span class="mpc">${m(mk.pd)}%</span></div>
        <div class="mcell"><span class="mteam">${shortName(f.away)}</span><b>${mk.a}</b><span class="mpc">${m(mk.pa)}%</span></div>
      </div>
    </div>`;
  }
  function shortName(t){ return t.length>11 ? t.split(" ")[0] : t; }

  /* ---------------- group tables ---------------- */
  function renderGroups(odds){
    const box = $("#groups");
    const groups = "ABCDEFGHIJKL".split("");
    box.innerHTML = groups.map(g=>{
      const rows = MODEL.currentTable(g);
      const trs = rows.map((r,i)=>{
        const o = odds[r.team];
        const adv = pct(o.advance);
        const qcls = i===0?"q1":i===1?"q2":i===2?"q3":"";
        return `<tr class="${qcls}">
          <td class="l"><div class="tcell"><span class="pos">${i+1}</span><span class="fl">${fl(r.team)}</span>${r.team}</div></td>
          <td>${r.pld}</td><td>${r.w}-${r.d}-${r.l}</td>
          <td>${r.gd>0?'+':''}${r.gd}</td>
          <td class="pts">${r.pts}</td>
          <td class="adv"><div class="adv-bar"><i style="width:${Math.max(adv,2)}%"></i><b>${adv}%</b></div></td>
        </tr>`;
      }).join("");
      return `<div class="gcard">
        <h3><span class="gl">${g}</span> Group ${g}</h3>
        <table class="gt">
          <thead><tr><th class="l">Team</th><th>P</th><th>W-D-L</th><th>GD</th><th>Pts</th><th>Advance</th></tr></thead>
          <tbody>${trs}</tbody>
        </table>
        <div class="gfoot">
          <span><i style="background:var(--green)"></i>1st</span>
          <span><i style="background:var(--cyan)"></i>2nd</span>
          <span><i style="background:var(--gold)"></i>3rd (8 best advance)</span>
        </div>
      </div>`;
    }).join("");
  }

  /* ---------------- boot ---------------- */
  function boot(){
    renderStats();
    renderResults();
    renderPredictions();
    // simulation is heavier — run after first paint
    requestAnimationFrame(()=>{
      setTimeout(()=>{
        const odds = MODEL.simulate(15000);
        renderGroups(odds);
        $("#groups-loading").style.display="none";
      }, 30);
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
