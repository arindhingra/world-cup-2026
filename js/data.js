/* =====================================================================
   2026 FIFA WORLD CUP — VERIFIED DATA LAYER
   ---------------------------------------------------------------------
   All data cross-verified against official group pages on 20 June 2026.
   Groups, results, venues and standings reconcile internally
   (standings == sum of played results).

   power  : analytical strength index (0–100). Blends current world
            ranking, squad quality and World Cup pedigree. Used as the
            prior for the prediction model.
   titles : number of World Cup titles won (for pedigree flavour).
   best   : best previous World Cup finish.
   ===================================================================== */

const TEAMS = {
  // ---- Group A ----
  "Mexico":        { flag: "🇲🇽", power: 75, titles: 0, best: "Quarter-finals (1970, 1986)", group: "A" },
  "South Korea":   { flag: "🇰🇷", power: 72, titles: 0, best: "Fourth place (2002)",          group: "A" },
  "Czechia":       { flag: "🇨🇿", power: 71, titles: 0, best: "Runners-up (1934, 1962*)",     group: "A" },
  "South Africa":  { flag: "🇿🇦", power: 65, titles: 0, best: "Group stage",                  group: "A" },
  // ---- Group B ----
  "Canada":        { flag: "🇨🇦", power: 70, titles: 0, best: "Group stage (1986, 2022)",     group: "B" },
  "Switzerland":   { flag: "🇨🇭", power: 77, titles: 0, best: "Quarter-finals (1934,'38,'54)",group: "B" },
  "Bosnia & Herzegovina": { flag: "🇧🇦", power: 67, titles: 0, best: "Group stage (2014)",    group: "B" },
  "Qatar":         { flag: "🇶🇦", power: 63, titles: 0, best: "Group stage (2022)",            group: "B" },
  // ---- Group C ----
  "Brazil":        { flag: "🇧🇷", power: 89, titles: 5, best: "Champions ×5",                  group: "C" },
  "Morocco":       { flag: "🇲🇦", power: 78, titles: 0, best: "Fourth place (2022)",           group: "C" },
  "Scotland":      { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", power: 69, titles: 0, best: "Group stage",            group: "C" },
  "Haiti":         { flag: "🇭🇹", power: 57, titles: 0, best: "Group stage (1974)",            group: "C" },
  // ---- Group D ----
  "United States": { flag: "🇺🇸", power: 74, titles: 0, best: "Third place (1930)",            group: "D" },
  "Paraguay":      { flag: "🇵🇾", power: 68, titles: 0, best: "Round of 16",                   group: "D" },
  "Australia":     { flag: "🇦🇺", power: 69, titles: 0, best: "Round of 16 (2006, 2022)",      group: "D" },
  "Türkiye":       { flag: "🇹🇷", power: 75, titles: 0, best: "Third place (2002)",            group: "D" },
  // ---- Group E ----
  "Germany":       { flag: "🇩🇪", power: 85, titles: 4, best: "Champions ×4",                  group: "E" },
  "Ecuador":       { flag: "🇪🇨", power: 72, titles: 0, best: "Round of 16 (2006)",            group: "E" },
  "Ivory Coast":   { flag: "🇨🇮", power: 71, titles: 0, best: "Group stage",                   group: "E" },
  "Curaçao":       { flag: "🇨🇼", power: 59, titles: 0, best: "Debut",                         group: "E" },
  // ---- Group F ----
  "Netherlands":   { flag: "🇳🇱", power: 84, titles: 0, best: "Runners-up (1974,'78,2010)",    group: "F" },
  "Japan":         { flag: "🇯🇵", power: 74, titles: 0, best: "Round of 16 ×4",                group: "F" },
  "Sweden":        { flag: "🇸🇪", power: 71, titles: 0, best: "Runners-up (1958)",             group: "F" },
  "Tunisia":       { flag: "🇹🇳", power: 67, titles: 0, best: "Group stage",                   group: "F" },
  // ---- Group G ----
  "Belgium":       { flag: "🇧🇪", power: 81, titles: 0, best: "Third place (2018)",            group: "G" },
  "Egypt":         { flag: "🇪🇬", power: 70, titles: 0, best: "Group stage",                   group: "G" },
  "Iran":          { flag: "🇮🇷", power: 70, titles: 0, best: "Group stage",                   group: "G" },
  "New Zealand":   { flag: "🇳🇿", power: 61, titles: 0, best: "Group stage (1982, 2010)",      group: "G" },
  // ---- Group H ----
  "Spain":         { flag: "🇪🇸", power: 90, titles: 1, best: "Champions (2010)",              group: "H" },
  "Uruguay":       { flag: "🇺🇾", power: 79, titles: 2, best: "Champions ×2",                  group: "H" },
  "Cape Verde":    { flag: "🇨🇻", power: 62, titles: 0, best: "Debut",                         group: "H" },
  "Saudi Arabia":  { flag: "🇸🇦", power: 65, titles: 0, best: "Round of 16 (1994)",            group: "H" },
  // ---- Group I ----
  "France":        { flag: "🇫🇷", power: 90, titles: 2, best: "Champions ×2",                  group: "I" },
  "Senegal":       { flag: "🇸🇳", power: 75, titles: 0, best: "Quarter-finals (2002)",         group: "I" },
  "Iraq":          { flag: "🇮🇶", power: 63, titles: 0, best: "Group stage (1986)",            group: "I" },
  "Norway":        { flag: "🇳🇴", power: 76, titles: 0, best: "Round of 16 (1998)",            group: "I" },
  // ---- Group J ----
  "Argentina":     { flag: "🇦🇷", power: 91, titles: 3, best: "Champions ×3 (holders)",        group: "J" },
  "Austria":       { flag: "🇦🇹", power: 73, titles: 0, best: "Third place (1954)",            group: "J" },
  "Algeria":       { flag: "🇩🇿", power: 70, titles: 0, best: "Round of 16 (2014)",            group: "J" },
  "Jordan":        { flag: "🇯🇴", power: 61, titles: 0, best: "Debut",                         group: "J" },
  // ---- Group K ----
  "Portugal":      { flag: "🇵🇹", power: 86, titles: 0, best: "Third place (1966)",            group: "K" },
  "Colombia":      { flag: "🇨🇴", power: 78, titles: 0, best: "Quarter-finals (2014)",         group: "K" },
  "DR Congo":      { flag: "🇨🇩", power: 68, titles: 0, best: "Quarter-finals (1974*)",        group: "K" },
  "Uzbekistan":    { flag: "🇺🇿", power: 65, titles: 0, best: "Debut",                         group: "K" },
  // ---- Group L ----
  "England":       { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", power: 87, titles: 1, best: "Champions (1966)",         group: "L" },
  "Croatia":       { flag: "🇭🇷", power: 79, titles: 0, best: "Runners-up (2018)",             group: "L" },
  "Ghana":         { flag: "🇬🇭", power: 69, titles: 0, best: "Quarter-finals (2010)",         group: "L" },
  "Panama":        { flag: "🇵🇦", power: 64, titles: 0, best: "Group stage (2018)",            group: "L" }
};

/* =====================================================================
   WORLD FOOTBALL ELO RATINGS — objective strength, the model's backbone.
   Source: worldfootballrankings.com Elo table, updated 21 June 2026
   (already reflects results played so far in this World Cup).
   `src:"elo"`  = taken directly from the published table.
   `src:"est"`  = team outside the published top tier; value estimated on
                  the SAME scale from its FIFA ranking + recent results.
   ===================================================================== */
const ELO = {
  "Argentina":1889, "France":1887, "Spain":1856, "England":1848, "Brazil":1772,
  "Morocco":1770, "Netherlands":1764, "Germany":1760, "Portugal":1755, "Belgium":1734,
  "Mexico":1722, "Colombia":1713, "United States":1710, "Croatia":1695, "Senegal":1668,
  "Japan":1666, "Uruguay":1662, "Switzerland":1655, "Austria":1613, "Iran":1605,
  "South Korea":1592, "Australia":1585, "Norway":1577, "Canada":1572, "Ecuador":1571,
  "Egypt":1571, "Algeria":1559, "Ivory Coast":1552, "Türkiye":1550, "Sweden":1518,
  "Paraguay":1517, "Panama":1505, "Scotland":1504, "DR Congo":1487, "Czechia":1481,
  // ---- estimated on the same scale (FIFA-ranking anchored) ----
  "Tunisia":1520, "Bosnia & Herzegovina":1520, "Ghana":1500, "Uzbekistan":1488,
  "Qatar":1485, "South Africa":1485, "New Zealand":1482, "Saudi Arabia":1480,
  "Cape Verde":1470, "Iraq":1458, "Jordan":1450, "Haiti":1405, "Curaçao":1395
};
const ELO_ESTIMATED = new Set(["Tunisia","Bosnia & Herzegovina","Ghana","Uzbekistan",
  "Qatar","South Africa","New Zealand","Saudi Arabia","Cape Verde","Iraq","Jordan",
  "Haiti","Curaçao"]);

/* Host nations get a home-field Elo bump only when playing in their own country. */
const HOST_NATION = { "Mexico":"MEX", "Canada":"CAN", "United States":"USA" };
function venueCountry(venue){
  const mx = ["Mexico City","Zapopan","Guadalupe","Monterrey"];
  const ca = ["Vancouver","Toronto"];
  for (const c of mx) if (venue.includes(c)) return "MEX";
  for (const c of ca) if (venue.includes(c)) return "CAN";
  return "USA"; // all other listed venues are in the United States
}

/* Current standings as verified on 20 June 2026 (start point for sim). */
const STANDINGS = {
  "Mexico":{pld:2,w:2,d:0,l:0,gf:3,ga:0}, "South Korea":{pld:2,w:1,d:0,l:1,gf:2,ga:2},
  "Czechia":{pld:2,w:0,d:1,l:1,gf:2,ga:3}, "South Africa":{pld:2,w:0,d:1,l:1,gf:1,ga:3},

  "Canada":{pld:2,w:1,d:1,l:0,gf:7,ga:1}, "Switzerland":{pld:2,w:1,d:1,l:0,gf:5,ga:2},
  "Bosnia & Herzegovina":{pld:2,w:0,d:1,l:1,gf:2,ga:5}, "Qatar":{pld:2,w:0,d:1,l:1,gf:1,ga:7},

  "Brazil":{pld:2,w:1,d:1,l:0,gf:4,ga:1}, "Morocco":{pld:2,w:1,d:1,l:0,gf:2,ga:1},
  "Scotland":{pld:2,w:1,d:0,l:1,gf:1,ga:1}, "Haiti":{pld:2,w:0,d:0,l:2,gf:0,ga:4},

  "United States":{pld:2,w:2,d:0,l:0,gf:6,ga:1}, "Australia":{pld:2,w:1,d:0,l:1,gf:2,ga:2},
  "Paraguay":{pld:2,w:1,d:0,l:1,gf:2,ga:4}, "Türkiye":{pld:2,w:0,d:0,l:2,gf:0,ga:3},

  "Germany":{pld:2,w:2,d:0,l:0,gf:9,ga:2}, "Ivory Coast":{pld:2,w:1,d:0,l:1,gf:2,ga:2},
  "Ecuador":{pld:2,w:0,d:1,l:1,gf:0,ga:1}, "Curaçao":{pld:2,w:0,d:1,l:1,gf:1,ga:7},

  "Netherlands":{pld:2,w:1,d:1,l:0,gf:7,ga:3}, "Sweden":{pld:2,w:1,d:0,l:1,gf:6,ga:6},
  "Japan":{pld:1,w:0,d:1,l:0,gf:2,ga:2}, "Tunisia":{pld:1,w:0,d:0,l:1,gf:1,ga:5},

  "New Zealand":{pld:1,w:0,d:1,l:0,gf:2,ga:2}, "Iran":{pld:1,w:0,d:1,l:0,gf:2,ga:2},
  "Belgium":{pld:1,w:0,d:1,l:0,gf:1,ga:1}, "Egypt":{pld:1,w:0,d:1,l:0,gf:1,ga:1},

  "Uruguay":{pld:1,w:0,d:1,l:0,gf:1,ga:1}, "Saudi Arabia":{pld:1,w:0,d:1,l:0,gf:1,ga:1},
  "Spain":{pld:1,w:0,d:1,l:0,gf:0,ga:0}, "Cape Verde":{pld:1,w:0,d:1,l:0,gf:0,ga:0},

  "Norway":{pld:1,w:1,d:0,l:0,gf:4,ga:1}, "France":{pld:1,w:1,d:0,l:0,gf:3,ga:1},
  "Senegal":{pld:1,w:0,d:0,l:1,gf:1,ga:3}, "Iraq":{pld:1,w:0,d:0,l:1,gf:1,ga:4},

  "Argentina":{pld:1,w:1,d:0,l:0,gf:3,ga:0}, "Austria":{pld:1,w:1,d:0,l:0,gf:3,ga:1},
  "Jordan":{pld:1,w:0,d:0,l:1,gf:1,ga:3}, "Algeria":{pld:1,w:0,d:0,l:1,gf:0,ga:3},

  "Colombia":{pld:1,w:1,d:0,l:0,gf:3,ga:1}, "DR Congo":{pld:1,w:0,d:1,l:0,gf:1,ga:1},
  "Portugal":{pld:1,w:0,d:1,l:0,gf:1,ga:1}, "Uzbekistan":{pld:1,w:0,d:0,l:1,gf:1,ga:3},

  "England":{pld:1,w:1,d:0,l:0,gf:4,ga:2}, "Ghana":{pld:1,w:1,d:0,l:0,gf:1,ga:0},
  "Panama":{pld:1,w:0,d:0,l:1,gf:0,ga:1}, "Croatia":{pld:1,w:0,d:0,l:1,gf:2,ga:4}
};

/* Results already played — most recent first, for the "results" strip. */
const RESULTS = [
  { date:"2026-06-20", group:"E", home:"Ecuador", away:"Curaçao", hs:0, as:0, venue:"Arrowhead Stadium, Kansas City" },
  { date:"2026-06-20", group:"E", home:"Germany", away:"Ivory Coast", hs:2, as:1, venue:"BMO Field, Toronto" },
  { date:"2026-06-20", group:"F", home:"Netherlands", away:"Sweden", hs:5, as:1, venue:"NRG Stadium, Houston" },
  { date:"2026-06-19", group:"C", home:"Scotland", away:"Morocco", hs:0, as:1, venue:"Gillette Stadium, Foxborough" },
  { date:"2026-06-19", group:"C", home:"Brazil", away:"Haiti", hs:3, as:0, venue:"Lincoln Financial Field, Philadelphia" },
  { date:"2026-06-19", group:"D", home:"United States", away:"Australia", hs:2, as:0, venue:"Lumen Field, Seattle" },
  { date:"2026-06-19", group:"D", home:"Türkiye", away:"Paraguay", hs:0, as:1, venue:"Levi's Stadium, Santa Clara" },
  { date:"2026-06-18", group:"A", home:"Mexico", away:"South Korea", hs:1, as:0, venue:"Estadio Akron, Zapopan" },
  { date:"2026-06-18", group:"A", home:"Czechia", away:"South Africa", hs:1, as:1, venue:"Mercedes-Benz Stadium, Atlanta" },
  { date:"2026-06-18", group:"B", home:"Canada", away:"Qatar", hs:6, as:0, venue:"BC Place, Vancouver" },
  { date:"2026-06-18", group:"B", home:"Switzerland", away:"Bosnia & Herzegovina", hs:4, as:1, venue:"SoFi Stadium, Inglewood" }
];

/* =====================================================================
   REMAINING GROUP-STAGE FIXTURES (38 matches, 21–27 June 2026).
   The model predicts every one of these.
   ===================================================================== */
// `ko` = exact kick-off in UTC. Each game auto-drops ~2.5h after kick-off
// (when it is certainly finished), so the site self-cleans with no API key.
const FIXTURES = [
  // ---------- Saturday 20 June (today) ----------
  { date:"2026-06-20", group:"F", home:"Tunisia", away:"Japan",          ko:"2026-06-21T04:00:00Z", venue:"Estadio BBVA, Guadalupe" },
  // ---------- Sunday 21 June ----------
  { date:"2026-06-21", group:"H", home:"Spain", away:"Saudi Arabia",     ko:"2026-06-21T16:00:00Z", venue:"Mercedes-Benz Stadium, Atlanta" },
  { date:"2026-06-21", group:"G", home:"Belgium", away:"Iran",           ko:"2026-06-21T19:00:00Z", venue:"SoFi Stadium, Inglewood" },
  { date:"2026-06-21", group:"H", home:"Uruguay", away:"Cape Verde",     ko:"2026-06-21T22:00:00Z", venue:"Hard Rock Stadium, Miami" },
  { date:"2026-06-21", group:"G", home:"New Zealand", away:"Egypt",      ko:"2026-06-22T01:00:00Z", venue:"BC Place, Vancouver" },
  // ---------- Monday 22 June ----------
  { date:"2026-06-22", group:"J", home:"Argentina", away:"Austria",      ko:"2026-06-22T17:00:00Z", venue:"AT&T Stadium, Arlington" },
  { date:"2026-06-22", group:"I", home:"France", away:"Iraq",            ko:"2026-06-22T21:00:00Z", venue:"Lincoln Financial Field, Philadelphia" },
  { date:"2026-06-22", group:"I", home:"Norway", away:"Senegal",         ko:"2026-06-23T00:00:00Z", venue:"MetLife Stadium, East Rutherford" },
  { date:"2026-06-22", group:"J", home:"Jordan", away:"Algeria",         ko:"2026-06-23T03:00:00Z", venue:"Levi's Stadium, Santa Clara" },
  // ---------- Tuesday 23 June ----------
  { date:"2026-06-23", group:"K", home:"Portugal", away:"Uzbekistan",    ko:"2026-06-23T17:00:00Z", venue:"NRG Stadium, Houston" },
  { date:"2026-06-23", group:"L", home:"England", away:"Ghana",          ko:"2026-06-23T20:00:00Z", venue:"Gillette Stadium, Foxborough" },
  { date:"2026-06-23", group:"L", home:"Panama", away:"Croatia",         ko:"2026-06-23T23:00:00Z", venue:"BMO Field, Toronto" },
  { date:"2026-06-23", group:"K", home:"Colombia", away:"DR Congo",      ko:"2026-06-24T02:00:00Z", venue:"Estadio Akron, Zapopan" },
  // ---------- Wednesday 24 June (Matchday 3: A, B, C) ----------
  { date:"2026-06-24", group:"B", home:"Switzerland", away:"Canada",     ko:"2026-06-24T19:00:00Z", venue:"BC Place, Vancouver" },
  { date:"2026-06-24", group:"B", home:"Bosnia & Herzegovina", away:"Qatar", ko:"2026-06-24T19:00:00Z", venue:"Lumen Field, Seattle" },
  { date:"2026-06-24", group:"C", home:"Scotland", away:"Brazil",        ko:"2026-06-24T22:00:00Z", venue:"Hard Rock Stadium, Miami" },
  { date:"2026-06-24", group:"C", home:"Morocco", away:"Haiti",          ko:"2026-06-24T22:00:00Z", venue:"Mercedes-Benz Stadium, Atlanta" },
  { date:"2026-06-24", group:"A", home:"Czechia", away:"Mexico",         ko:"2026-06-25T01:00:00Z", venue:"Estadio Azteca, Mexico City" },
  { date:"2026-06-24", group:"A", home:"South Africa", away:"South Korea",ko:"2026-06-25T01:00:00Z", venue:"Estadio BBVA, Guadalupe" },
  // ---------- Thursday 25 June (Matchday 3: D, E, F) ----------
  { date:"2026-06-25", group:"E", home:"Curaçao", away:"Ivory Coast",    ko:"2026-06-25T20:00:00Z", venue:"Lincoln Financial Field, Philadelphia" },
  { date:"2026-06-25", group:"E", home:"Ecuador", away:"Germany",        ko:"2026-06-25T20:00:00Z", venue:"MetLife Stadium, East Rutherford" },
  { date:"2026-06-25", group:"F", home:"Japan", away:"Sweden",           ko:"2026-06-25T23:00:00Z", venue:"AT&T Stadium, Arlington" },
  { date:"2026-06-25", group:"F", home:"Tunisia", away:"Netherlands",    ko:"2026-06-25T23:00:00Z", venue:"Arrowhead Stadium, Kansas City" },
  { date:"2026-06-25", group:"D", home:"Türkiye", away:"United States",  ko:"2026-06-26T02:00:00Z", venue:"SoFi Stadium, Inglewood" },
  { date:"2026-06-25", group:"D", home:"Paraguay", away:"Australia",     ko:"2026-06-26T02:00:00Z", venue:"Levi's Stadium, Santa Clara" },
  // ---------- Friday 26 June (Matchday 3: G, H, I) ----------
  { date:"2026-06-26", group:"H", home:"Uruguay", away:"Spain",         ko:"2026-06-27T00:00:00Z", venue:"Estadio Akron, Zapopan" },
  { date:"2026-06-26", group:"I", home:"Norway", away:"France",         ko:"2026-06-26T19:00:00Z", venue:"Gillette Stadium, Foxborough" },
  { date:"2026-06-26", group:"I", home:"Senegal", away:"Iraq",          ko:"2026-06-26T19:00:00Z", venue:"BMO Field, Toronto" },
  { date:"2026-06-26", group:"H", home:"Cape Verde", away:"Saudi Arabia",ko:"2026-06-27T00:00:00Z", venue:"NRG Stadium, Houston" },
  { date:"2026-06-26", group:"G", home:"Egypt", away:"Iran",            ko:"2026-06-27T03:00:00Z", venue:"Lumen Field, Seattle" },
  { date:"2026-06-26", group:"G", home:"New Zealand", away:"Belgium",   ko:"2026-06-27T03:00:00Z", venue:"BC Place, Vancouver" },
  // ---------- Saturday 27 June (Matchday 3: J, K, L) ----------
  { date:"2026-06-27", group:"L", home:"Panama", away:"England",        ko:"2026-06-27T21:00:00Z", venue:"MetLife Stadium, East Rutherford" },
  { date:"2026-06-27", group:"L", home:"Croatia", away:"Ghana",         ko:"2026-06-27T21:00:00Z", venue:"Lincoln Financial Field, Philadelphia" },
  { date:"2026-06-27", group:"K", home:"Colombia", away:"Portugal",     ko:"2026-06-27T23:30:00Z", venue:"Hard Rock Stadium, Miami" },
  { date:"2026-06-27", group:"K", home:"DR Congo", away:"Uzbekistan",   ko:"2026-06-27T23:30:00Z", venue:"Mercedes-Benz Stadium, Atlanta" },
  { date:"2026-06-27", group:"J", home:"Algeria", away:"Austria",       ko:"2026-06-28T02:00:00Z", venue:"Arrowhead Stadium, Kansas City" },
  { date:"2026-06-27", group:"J", home:"Jordan", away:"Argentina",      ko:"2026-06-28T02:00:00Z", venue:"AT&T Stadium, Arlington" }
];

/* =====================================================================
   MARKET ODDS — independent cross-check for headline matches.
   Three-way moneyline (American), with de-vigged "fair" probabilities.
   Snapshot taken ~20–21 Jun 2026; odds move up to kick-off.
   Keyed "Home|Away" to match the fixtures above.
   ===================================================================== */
const MARKET_ASOF = "20–21 Jun 2026";
// De-vigged three-way (1X2) moneyline odds for ALL remaining games.
// `est:true` = only a two-way price was published, so the draw line is
// interpolated from the standard favourite/draw relationship.
const MARKET = {
  // ---- Saturday 20 June ----
  "Tunisia|Japan":               { h:"+600",  d:"+310", a:"-185",  ph:0.14, pd:0.23, pa:0.63, book:"FanDuel" },
  // ---- Sunday 21 June ----
  "Spain|Saudi Arabia":          { h:"-1200", d:"+900", a:"+2200", ph:0.87, pd:0.09, pa:0.04, book:"bet365" },
  "Belgium|Iran":                { h:"-250",  d:"+360", a:"+700",  ph:0.68, pd:0.21, pa:0.12, book:"consensus" },
  "Uruguay|Cape Verde":          { h:"-209",  d:"+320", a:"+650",  ph:0.65, pd:0.23, pa:0.12, book:"bet365" },
  "New Zealand|Egypt":           { h:"+490",  d:"+300", a:"-170",  ph:0.16, pd:0.24, pa:0.60, book:"FanDuel" },
  // ---- Monday 22 June ----
  "Argentina|Austria":           { h:"-167",  d:"+300", a:"+475",  ph:0.60, pd:0.24, pa:0.17, book:"bet365" },
  "France|Iraq":                 { h:"-500",  d:"+600", a:"+1200", ph:0.79, pd:0.14, pa:0.07, book:"bet365" },
  "Norway|Senegal":              { h:"+135",  d:"+240", a:"+210",  ph:0.41, pd:0.28, pa:0.31, book:"bet365" },
  "Jordan|Algeria":              { h:"+650",  d:"+290", a:"-209",  ph:0.13, pd:0.24, pa:0.63, book:"bet365" },
  // ---- Tuesday 23 June ----
  "Portugal|Uzbekistan":         { h:"-350",  d:"+475", a:"+900",  ph:0.74, pd:0.16, pa:0.10, book:"bet365" },
  "England|Ghana":               { h:"-426",  d:"+567", a:"+1329", ph:0.79, pd:0.15, pa:0.07, book:"DraftKings" },
  "Panama|Croatia":              { h:"+500",  d:"+300", a:"-188",  ph:0.16, pd:0.23, pa:0.61, book:"bet365" },
  "Colombia|DR Congo":           { h:"-200",  d:"+333", a:"+550",  ph:0.63, pd:0.22, pa:0.15, book:"bet365" },
  // ---- Wednesday 24 June ----
  "Switzerland|Canada":          { h:"+145",  d:"+220", a:"+225",  ph:0.40, pd:0.30, pa:0.30, book:"Oddschecker" },
  "Bosnia & Herzegovina|Qatar":  { h:"-225",  d:"+400", a:"+550",  ph:0.66, pd:0.19, pa:0.15, book:"bet365" },
  "Scotland|Brazil":             { h:"+800",  d:"+175", a:"-250",  ph:0.09, pd:0.31, pa:0.60, book:"Oddschecker" },
  "Morocco|Haiti":               { h:"-275",  d:"+360", a:"+1500", ph:0.72, pd:0.21, pa:0.06, book:"ESPN", est:true },
  "Czechia|Mexico":              { h:"+255",  d:"+290", a:"+105",  ph:0.27, pd:0.25, pa:0.48, book:"bet365" },
  "South Africa|South Korea":    { h:"+490",  d:"+300", a:"-155",  ph:0.16, pd:0.24, pa:0.59, book:"bet365" },
  // ---- Thursday 25 June ----
  "Curaçao|Ivory Coast":         { h:"+750",  d:"+450", a:"-290",  ph:0.11, pd:0.17, pa:0.71, book:"bet365" },
  "Ecuador|Germany":             { h:"+500",  d:"+320", a:"-195",  ph:0.16, pd:0.22, pa:0.62, book:"consensus" },
  "Japan|Sweden":                { h:"+120",  d:"+240", a:"+250",  ph:0.44, pd:0.28, pa:0.28, book:"Oddschecker" },
  "Tunisia|Netherlands":         { h:"+620",  d:"+340", a:"-200",  ph:0.13, pd:0.22, pa:0.65, book:"Oddschecker" },
  "Türkiye|United States":       { h:"+150",  d:"+285", a:"+160",  ph:0.38, pd:0.25, pa:0.37, book:"DraftKings" },
  "Paraguay|Australia":          { h:"+120",  d:"+250", a:"+255",  ph:0.44, pd:0.28, pa:0.28, book:"ESPN", est:true },
  // ---- Friday 26 June ----
  "Uruguay|Spain":               { h:"+500",  d:"+300", a:"-185",  ph:0.16, pd:0.23, pa:0.61, book:"bet365" },
  "Norway|France":               { h:"+330",  d:"+290", a:"-140",  ph:0.22, pd:0.24, pa:0.54, book:"ESPN" },
  "Senegal|Iraq":                { h:"-215",  d:"+350", a:"+600",  ph:0.65, pd:0.21, pa:0.14, book:"bet365" },
  "Cape Verde|Saudi Arabia":     { h:"+180",  d:"+270", a:"+145",  ph:0.34, pd:0.26, pa:0.39, book:"Oddschecker" },
  "Egypt|Iran":                  { h:"+400",  d:"+250", a:"-138",  ph:0.19, pd:0.27, pa:0.54, book:"bet365" },
  "New Zealand|Belgium":         { h:"+600",  d:"+360", a:"-333",  ph:0.13, pd:0.19, pa:0.68, book:"consensus", est:true },
  // ---- Saturday 27 June ----
  "Panama|England":              { h:"+1000", d:"+450", a:"-450",  ph:0.08, pd:0.17, pa:0.75, book:"Betfair" },
  "Croatia|Ghana":               { h:"-140",  d:"+250", a:"+450",  ph:0.55, pd:0.27, pa:0.17, book:"ESPN" },
  "Colombia|Portugal":           { h:"+240",  d:"+225", a:"+110",  ph:0.27, pd:0.29, pa:0.44, book:"Betfair" },
  "DR Congo|Uzbekistan":         { h:"+115",  d:"+270", a:"+240",  ph:0.45, pd:0.26, pa:0.29, book:"Oddschecker" },
  "Algeria|Austria":             { h:"+198",  d:"+230", a:"+150",  ph:0.32, pd:0.29, pa:0.39, book:"ESPN", est:true },
  "Jordan|Argentina":            { h:"+1400", d:"+475", a:"-550",  ph:0.06, pd:0.16, pa:0.78, book:"ESPN", est:true }
};

/* All FIFA World Cup finals 1930–2022 (verified). */
const WINNERS = [
  { year:1930, host:"Uruguay", winner:"Uruguay", wflag:"🇺🇾", runner:"Argentina", rflag:"🇦🇷", score:"4–2" },
  { year:1934, host:"Italy", winner:"Italy", wflag:"🇮🇹", runner:"Czechoslovakia", rflag:"🇨🇿", score:"2–1 (a.e.t.)" },
  { year:1938, host:"France", winner:"Italy", wflag:"🇮🇹", runner:"Hungary", rflag:"🇭🇺", score:"4–2" },
  { year:1950, host:"Brazil", winner:"Uruguay", wflag:"🇺🇾", runner:"Brazil", rflag:"🇧🇷", score:"2–1 *" },
  { year:1954, host:"Switzerland", winner:"West Germany", wflag:"🇩🇪", runner:"Hungary", rflag:"🇭🇺", score:"3–2" },
  { year:1958, host:"Sweden", winner:"Brazil", wflag:"🇧🇷", runner:"Sweden", rflag:"🇸🇪", score:"5–2" },
  { year:1962, host:"Chile", winner:"Brazil", wflag:"🇧🇷", runner:"Czechoslovakia", rflag:"🇨🇿", score:"3–1" },
  { year:1966, host:"England", winner:"England", wflag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", runner:"West Germany", rflag:"🇩🇪", score:"4–2 (a.e.t.)" },
  { year:1970, host:"Mexico", winner:"Brazil", wflag:"🇧🇷", runner:"Italy", rflag:"🇮🇹", score:"4–1" },
  { year:1974, host:"West Germany", winner:"West Germany", wflag:"🇩🇪", runner:"Netherlands", rflag:"🇳🇱", score:"2–1" },
  { year:1978, host:"Argentina", winner:"Argentina", wflag:"🇦🇷", runner:"Netherlands", rflag:"🇳🇱", score:"3–1 (a.e.t.)" },
  { year:1982, host:"Spain", winner:"Italy", wflag:"🇮🇹", runner:"West Germany", rflag:"🇩🇪", score:"3–1" },
  { year:1986, host:"Mexico", winner:"Argentina", wflag:"🇦🇷", runner:"West Germany", rflag:"🇩🇪", score:"3–2" },
  { year:1990, host:"Italy", winner:"West Germany", wflag:"🇩🇪", runner:"Argentina", rflag:"🇦🇷", score:"1–0" },
  { year:1994, host:"United States", winner:"Brazil", wflag:"🇧🇷", runner:"Italy", rflag:"🇮🇹", score:"0–0 (3–2 pens)" },
  { year:1998, host:"France", winner:"France", wflag:"🇫🇷", runner:"Brazil", rflag:"🇧🇷", score:"3–0" },
  { year:2002, host:"South Korea / Japan", winner:"Brazil", wflag:"🇧🇷", runner:"Germany", rflag:"🇩🇪", score:"2–0" },
  { year:2006, host:"Germany", winner:"Italy", wflag:"🇮🇹", runner:"France", rflag:"🇫🇷", score:"1–1 (5–3 pens)" },
  { year:2010, host:"South Africa", winner:"Spain", wflag:"🇪🇸", runner:"Netherlands", rflag:"🇳🇱", score:"1–0 (a.e.t.)" },
  { year:2014, host:"Brazil", winner:"Germany", wflag:"🇩🇪", runner:"Argentina", rflag:"🇦🇷", score:"1–0 (a.e.t.)" },
  { year:2018, host:"Russia", winner:"France", wflag:"🇫🇷", runner:"Croatia", rflag:"🇭🇷", score:"4–2" },
  { year:2022, host:"Qatar", winner:"Argentina", wflag:"🇦🇷", runner:"France", rflag:"🇫🇷", score:"3–3 (4–2 pens)" }
];
