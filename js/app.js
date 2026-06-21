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

  /* ---------------- finished-game detection (auto-remove) ---------------- */
  // A game is "finished" when (1) the live scores feed marks it complete
  // (exact, needs an API key) or (2) — with no key — 2.5 hours have elapsed
  // since its kick-off, by which point any group game is certainly over.
  const FT_BUFFER_MS = 150 * 60 * 1000; // 2h30m after kick-off
  function isFinished(f){
    if (typeof LIVE !== "undefined" && LIVE.scores && typeof pairKey === "function"){
      const s = LIVE.scores[pairKey(f.home, f.away)];
      if (s && s.completed) return true;
    }
    if (f.ko){ return Date.now() > Date.parse(f.ko) + FT_BUFFER_MS; }
    // last-ditch fallback for any game missing a kick-off time
    const p = f.date.split("-").map(Number);
    return Date.now() > Date.UTC(p[0], p[1]-1, p[2]+1, 5, 0, 0);
  }
  // in-play record for a fixture (from the live feed), else null
  function liveOf(f){
    return (typeof LIVE !== "undefined" && LIVE.inplay && typeof pairKey === "function")
      ? LIVE.inplay[pairKey(f.home, f.away)] : null;
  }
  // upcoming = not finished and not currently live (live games show in their own section)
  function upcomingFixtures(){ return FIXTURES.filter(f => !isFinished(f) && !liveOf(f)); }
  function liveFixtures(){ return FIXTURES.filter(f => liveOf(f) && !isFinished(f)); }

  /* ---------------- live now ---------------- */
  function renderLiveNow(){
    const box = $("#live-now"), sec = $("#live-section");
    if (!box) return;
    const games = liveFixtures();
    if (sec) sec.style.display = games.length ? "" : "none";
    box.innerHTML = games.map(liveCard).join("");
  }

  function liveCard(f){
    const lv = liveOf(f);
    // orient the feed's home/away to THIS fixture's home/away
    const hScore = (f.home === lv.home) ? lv.hs : lv.as;
    const aScore = (f.home === lv.home) ? lv.as : lv.hs;
    const lp = MODEL.liveProbability(f.home, f.away, f.venue, hScore, aScore, lv.minute);
    const ph=pct(lp.pHome), pd=pct(lp.pDraw), pa=pct(lp.pAway);
    const mk = getMarket(f);   // live odds if a key is set, else the pre-match line
    return `<div class="match live">
      <div class="match-top">
        <span class="grp-pill">Group ${f.group}</span>
        <span class="live-chip"><span class="lpulse"></span>LIVE · ${lv.clock}</span>
      </div>
      <div class="teams">
        <div class="team-side"><span class="fl">${fl(f.home)}</span><span class="tn">${f.home}</span></div>
        <div class="pscore"><span class="ps-val">${hScore}<span class="dash">–</span>${aScore}</span><span class="ps-lbl">${lv.detail||'Live'}</span></div>
        <div class="team-side"><span class="fl">${fl(f.away)}</span><span class="tn">${f.away}</span></div>
      </div>
      <div class="probbar">
        <div class="seg h" style="width:${ph}%">${ph>=11?`<span>${ph}%</span>`:''}</div>
        <div class="seg d" style="width:${pd}%">${pd>=11?`<span>${pd}%</span>`:''}</div>
        <div class="seg a" style="width:${pa}%">${pa>=11?`<span>${pa}%</span>`:''}</div>
      </div>
      <div class="prob-key">
        <span><b>${ph}%</b> ${shortName(f.home)}</span>
        <span><b>${pd}%</b> Draw</span>
        <span>${shortName(f.away)} <b>${pa}%</b></span>
      </div>
      ${wpChart(f, lv, hScore, aScore)}
      <div class="verdict"><span class="chip">Live win probability</span>· updates with the score &amp; clock</div>
      ${mk ? marketBlock(f, mk, true) : ``}
    </div>`;
  }

  // Win-probability timeline: replay the goals minute-by-minute and plot the
  // model's W/D/L at each point as a stacked area (home green / draw gold / away blue).
  function wpChart(f, lv, hNow, aNow){
    const goals = (lv.goals || []).slice().sort((a,b)=>a.minute-b.minute);
    const now = Math.max(1, lv.minute || 1);
    const maxX = Math.max(90, now);
    const W = 320, H = 64;
    const pts = [];
    let hs=0, as=0, gi=0;
    for (let t=0; t<=now; t++){
      while (gi<goals.length && goals[gi].minute<=t){
        if (goals[gi].team===f.home) hs++; else if (goals[gi].team===f.away) as++; gi++;
      }
      const p = MODEL.liveProbability(f.home, f.away, f.venue, hs, as, t);
      pts.push({ t, cH:p.pHome, cHD:p.pHome+p.pDraw });
    }
    if (pts.length < 2) return "";
    const x = t => (t/maxX*W).toFixed(1);
    const y = v => (H*(1-v)).toFixed(1);
    const band = (loKey, hiKey, lo0) => {
      const up = pts.map(p => `${x(p.t)} ${y(p[hiKey])}`);
      const lo = pts.slice().reverse().map(p => `${x(p.t)} ${y(lo0!==undefined?lo0:p[loKey])}`);
      return `M ${up.join(" L ")} L ${lo.join(" L ")} Z`;
    };
    const homeArea = band(null, "cH", 0);
    const drawArea = band("cH", "cHD");
    const awayArea = (function(){
      const up = pts.map(p => `${x(p.t)} 0`);
      const lo = pts.slice().reverse().map(p => `${x(p.t)} ${y(p.cHD)}`);
      return `M ${up.join(" L ")} L ${lo.join(" L ")} Z`;
    })();
    const nowX = x(now);
    const marks = goals.map(g => `<circle cx="${x(Math.min(g.minute,maxX))}" cy="${H-3}" r="2.6" fill="${g.team===f.home?'var(--green)':'#7d92cf'}" stroke="#0a0e1a" stroke-width="1"/>`).join("");
    return `<div class="wpchart">
      <div class="wpc-head"><span>📈 Win-probability timeline</span><span class="wpc-now">⚽ ${goals.length} ${goals.length===1?'goal':'goals'}</span></div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="wpc-svg">
        <path d="${homeArea}" fill="var(--green)" opacity="0.9"/>
        <path d="${drawArea}" fill="var(--draw)" opacity="0.85"/>
        <path d="${awayArea}" fill="#5b6b95" opacity="0.85"/>
        <line x1="50%" y1="0" x2="50%" y2="${H}" stroke="rgba(255,255,255,.15)" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="${nowX}" y1="0" x2="${nowX}" y2="${H}" stroke="#fff" stroke-width="1.5" opacity="0.65"/>
        ${marks}
      </svg>
      <div class="wpc-axis"><span>0'</span><span>45'</span><span>90'</span></div>
    </div>`;
  }

  /* ---------------- stat strip ---------------- */
  function renderStats(){
    const played = RESULTS.length ? 34 : 34; // verified: 34 group games played
    $("#stat-remaining").textContent = upcomingFixtures().length;
    $("#stat-today").textContent = liveFixtures().length;
    $("#stat-groups").textContent = 12;
    $("#stat-teams").textContent = 48;
  }

  /* ---------------- results strip ---------------- */
  function renderResults(){
    const box = $("#results");
    // merge any live-feed finals (deduped) ahead of the curated results
    const seen = new Set(RESULTS.map(r=>r.home+"|"+r.away));
    const merged = liveFinalsList().filter(r=>!seen.has(r.home+"|"+r.away)).concat(RESULTS);
    box.innerHTML = merged.map(r=>{
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
    // group fixtures by date — finished games are auto-removed
    const byDate = {};
    upcomingFixtures().forEach(f=>{ (byDate[f.date] = byDate[f.date]||[]).push(f); });
    const dates = Object.keys(byDate).sort();
    if (!dates.length){ box.innerHTML = `<div class="loading">All group-stage games are complete. 🏁</div>`; return; }

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
    const mk = getMarket(f);   // live odds if available, else verified snapshot
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

  // resolve market odds for a fixture: live (unordered pair) first, else snapshot
  function getMarket(f){
    if (typeof LIVE !== "undefined" && LIVE.odds && typeof pairKey === "function"){
      const lv = LIVE.odds[pairKey(f.home, f.away)];
      if (lv) return { ph:lv[f.home], pd:lv.draw, pa:lv[f.away], book:`live · avg of ${lv.books} books`, live:true };
    }
    const s = MARKET[`${f.home}|${f.away}`];
    return s ? Object.assign({ live:false }, s) : null;
  }

  function marketBlock(f, mk, gameLive){
    const m = x => Math.round(x*100);
    const cell = (team, odds, p) =>
      `<div class="mcell"><span class="mteam">${team}</span>${odds?`<b>${odds}</b>`:``}<span class="mpc">${m(p)}%</span></div>`;
    const right = mk.live
      ? `<span class="mlive">● LIVE · ${mk.book.replace('live · ','')}</span>`
      : gameLive
        ? `<span class="book">pre-match · ${mk.book}${mk.est?'*':''}</span>`
        : `<span class="book">${mk.book}${mk.est?'*':''} · ${MARKET_ASOF}</span>`;
    const title = (!mk.live && gameLive) ? "📈 Pre-match market" : "📈 Betting market";
    return `<div class="market">
      <div class="market-top"><span>${title}</span>${right}</div>
      <div class="market-cells">
        ${cell(shortName(f.home), mk.h, mk.ph)}
        ${cell('Draw', mk.d, mk.pd)}
        ${cell(shortName(f.away), mk.a, mk.pa)}
      </div>
    </div>`;
  }
  function shortName(t){ return t.length>11 ? t.split(" ")[0] : t; }

  /* ---------------- group tables ---------------- */
  function renderGroups(odds, standings){
    const box = $("#groups");
    const groups = "ABCDEFGHIJKL".split("");
    box.innerHTML = groups.map(g=>{
      const rows = MODEL.currentTable(g, standings);
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
  function updateOddsStatus(){
    const el = $("#odds-status");
    if (!el) return;
    const up = upcomingFixtures();
    const n = up.filter(f => getMarket(f)).length;
    const live = (typeof LIVE !== "undefined" && LIVE.status === "live");
    el.innerHTML = live
      ? `<span class="mlive">● LIVE odds</span> The Odds API · all ${up.length} upcoming games`
      : `Market snapshot · ${MARKET_ASOF} · ${n} of ${up.length} upcoming games`;
  }

  // standings + qualification odds, rebuilt from any live final scores
  function refreshGroups(){
    const standings = effectiveStandings();
    const odds = MODEL.simulate(15000, standings, remainingForSim());
    renderGroups(odds, standings);
    const ld = $("#groups-loading"); if (ld) ld.style.display = "none";
  }

  // signature of which games are final — lets us re-run the heavy sim only
  // when a result actually changes, not on every poll
  let lastSig = "";
  function finishedSig(){
    if (typeof LIVE === "undefined" || !LIVE.scores) return "";
    return FIXTURES.filter(f => { const s = LIVE.scores[pairKey(f.home,f.away)]; return s && s.completed; })
                   .map(f => f.home).sort().join(",");
  }

  function boot(){
    renderStats();
    renderResults();
    renderLiveNow();
    renderPredictions();
    updateOddsStatus();
    // simulation is heavier — defer so it doesn't block first paint
    setTimeout(refreshGroups, 50);

    // ESPN live feed (no key): live scores + minutes + real results → standings.
    // Poll every 45s so scores, the clock and the tables stay current.
    if (typeof loadEspnLive === "function"){
      const tick = () => loadEspnLive().then(async ok => {
        if (!ok){ renderLiveNow(); return; }
        if (typeof loadLiveTimelines === "function") await loadLiveTimelines();  // goal events → WP chart
        renderLiveNow(); renderResults(); renderStats(); renderPredictions(); updateOddsStatus();
        const sig = finishedSig();
        if (sig !== lastSig){ lastSig = sig; refreshGroups(); }  // a game went final → re-sim
      });
      tick();
      setInterval(tick, 45000);
    }
    // The Odds API live odds (optional key) — real in-play bookmaker lines
    if (typeof loadLiveOdds === "function"){
      loadLiveOdds().then(ok => { if (ok){ renderPredictions(); updateOddsStatus(); } });
    }
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
