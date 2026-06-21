/* =====================================================================
   PREDICTION ENGINE  (v2 — source-grounded)
   ---------------------------------------------------------------------
   Strength  : World Football Elo ratings (worldfootballrankings.com,
               updated 21 Jun 2026 — already reflects this WC's results).
   Home edge : host nations (MEX / CAN / USA) get +HFA Elo ONLY when the
               match is played in their own country.
   Goals     : the Elo gap sets each side's expected goals via a mapping
               CALIBRATED so win/draw/loss splits match the Opta
               supercomputer's published probabilities
               (e.g. USA ≈ 58% vs Australia; Morocco ≈ 54% vs Scotland).
   Scoreline : bivariate Poisson → most-likely exact score.
   Qual odds : Monte Carlo of all 38 remaining games (top 2 + 8 best 3rds).
   ===================================================================== */

const MODEL = (() => {

  const HFA   = 35;    // host home-field advantage, in Elo points (modest)
  const BASE  = 2.60;  // baseline total goals per match

  /* effective Elo for a side in a given match (adds host edge if at home) */
  function sideElo(team, venue){
    let e = ELO[team] || 1500;
    if (HOST_NATION[team] && venueCountry(venue) === HOST_NATION[team]) e += HFA;
    return e;
  }

  /* ---- Poisson helpers ---- */
  const _f = [1,1,2,6,24,120,720,5040,40320,362880,3628800];
  const fact = n => _f[n] !== undefined ? _f[n] : n*fact(n-1);
  const pois = (k, l) => Math.pow(l,k)*Math.exp(-l)/fact(k);

  /* canonical World Football Elo win-expectancy (points share of a side) */
  function eloExpectancy(dr){ return 1 / (Math.pow(10, -dr/400) + 1); }

  /* points-share produced by a given goal supremacy under the Poisson model */
  function winShare(S){
    const lh = Math.max(0.04, BASE/2 + S/2), la = Math.max(0.04, BASE/2 - S/2);
    let pH=0, pD=0, tot=0;
    for (let i=0;i<=9;i++){ const ph=pois(i,lh);
      for (let j=0;j<=9;j++){ const p=ph*pois(j,la); tot+=p;
        if (i>j) pH+=p; else if (i===j) pD+=p; } }
    return (pH + 0.5*pD) / tot;
  }

  /* invert: find the goal supremacy whose points-share matches the Elo expectancy.
     This anchors the model to the official Elo formula, then Poisson handles the
     draw split and exact scoreline.  (Monotonic → simple binary search.) */
  function solveSupremacy(We){
    let lo=-3.2, hi=3.2;
    for (let i=0;i<28;i++){ const mid=(lo+hi)/2;
      if (winShare(mid) < We) lo=mid; else hi=mid; }
    return (lo+hi)/2;
  }

  /* expected goals for each side, anchored to the Elo win expectancy */
  function expectedGoals(home, away, venue){
    const dr = sideElo(home, venue) - sideElo(away, venue);
    const S  = solveSupremacy(eloExpectancy(dr));
    return [ Math.max(0.12, BASE/2 + S/2), Math.max(0.12, BASE/2 - S/2) ];
  }

  /* ---- analytic W/D/L + most-likely scoreline + confidence ---- */
  function predict(home, away, venue){
    const [lh, la] = expectedGoals(home, away, venue);
    const MAX = 9;
    let pH=0, pD=0, pA=0, best=0, bh=0, ba=0;
    for (let i=0;i<=MAX;i++){
      const ph = pois(i,lh);
      for (let j=0;j<=MAX;j++){
        const p = ph * pois(j,la);
        if (i>j) pH+=p; else if (i===j) pD+=p; else pA+=p;
        if (p>best){ best=p; bh=i; ba=j; }
      }
    }
    const tot = pH+pD+pA;
    return {
      home, away,
      pHome:pH/tot, pDraw:pD/tot, pAway:pA/tot,
      scoreHome:bh, scoreAway:ba, scoreProb:best/tot,
      xgHome:lh, xgAway:la,
      eloHome:sideElo(home,venue), eloAway:sideElo(away,venue)
    };
  }

  /* ---- sample a scoreline for simulation ---- */
  function samplePoisson(l){
    const L = Math.exp(-l); let k=0, p=1;
    do { k++; p*=Math.random(); } while (p>L);
    return k-1;
  }

  /* =================================================================
     MONTE CARLO — qualification probabilities
     ================================================================= */
  // baseStandings + fixtures default to the static snapshot, but callers can
  // pass live-updated standings and the still-to-play fixtures so the odds
  // re-derive as real results come in.
  function simulate(iterations, baseStandings, fixtures){
    iterations = iterations || 15000;
    baseStandings = baseStandings || STANDINGS;
    fixtures = fixtures || FIXTURES;
    const groups = "ABCDEFGHIJKL".split("");
    const adv={}, win={}, second={}, third={};
    for (const t in TEAMS){ adv[t]=0; win[t]=0; second[t]=0; third[t]=0; }

    const fx = fixtures.map(f => {
      const [lh,la] = expectedGoals(f.home, f.away, f.venue);
      return { home:f.home, away:f.away, lh, la };
    });

    for (let it=0; it<iterations; it++){
      const tbl = {};
      for (const t in baseStandings){
        const s = baseStandings[t];
        tbl[t] = { team:t, group:TEAMS[t].group, pts:s.w*3+s.d, gf:s.gf, ga:s.ga,
                   w:s.w, d:s.d, l:s.l, pld:s.pld };
      }
      for (const f of fx){
        const hg=samplePoisson(f.lh), ag=samplePoisson(f.la);
        const H=tbl[f.home], A=tbl[f.away];
        H.gf+=hg; H.ga+=ag; A.gf+=ag; A.ga+=hg;
        if (hg>ag) H.pts+=3; else if (hg<ag) A.pts+=3; else { H.pts++; A.pts++; }
      }
      const thirds=[];
      for (const g of groups){
        const teams = Object.values(tbl).filter(t=>t.group===g).sort(cmp);
        win[teams[0].team]++; second[teams[1].team]++; third[teams[2].team]++;
        adv[teams[0].team]++; adv[teams[1].team]++;
        thirds.push(teams[2]);
      }
      thirds.sort(cmp);
      for (let i=0;i<8;i++) adv[thirds[i].team]++;
    }

    const out={};
    for (const t in TEAMS){
      out[t] = { advance:adv[t]/iterations, winGroup:win[t]/iterations,
                 second:second[t]/iterations, third:third[t]/iterations };
    }
    return out;
  }

  function cmp(a,b){
    if (b.pts!==a.pts) return b.pts-a.pts;
    const ga=a.gf-a.ga, gb=b.gf-b.ga;
    if (gb!==ga) return gb-ga;
    if (b.gf!==a.gf) return b.gf-a.gf;
    return Math.random()-0.5;
  }

  function currentTable(group, standings){
    standings = standings || STANDINGS;
    return Object.keys(TEAMS).filter(t=>TEAMS[t].group===group).map(t=>{
      const s = standings[t];
      return { team:t, ...s, gd:s.gf-s.ga, pts:s.w*3+s.d };
    }).sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.team.localeCompare(b.team));
  }

  return { predict, simulate, currentTable, expectedGoals, sideElo };
})();
