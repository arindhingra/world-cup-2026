# World Cup 2026 — Group-Stage Predictor & Champions History

An independent, data-driven fan site for the 2026 FIFA World Cup (Canada · Mexico · USA).

## Pages
- **Predictions** (`index.html`) — score predictions for every remaining group-stage match (21–27 June 2026), with win/draw/loss probabilities, projected scorelines, live group standings and Monte-Carlo qualification odds.
- **Past Champions** (`history.html`) — every World Cup final from 1930 to 2022.

## The model
- **Strength:** live World Football Elo ratings, anchored to the canonical Elo win-expectancy formula.
- **Host edge:** Mexico, USA and Canada get a home boost only when playing in their own country.
- **Goals:** a Poisson model calibrated to the Opta supercomputer's published match odds.
- **Qualification odds:** 15,000 Monte-Carlo simulations of the remaining fixtures (top 2 + 8 best third-placed teams advance).
- **Market cross-check:** headline games show the de-vigged betting market beside the model, with upset-alert and model-vs-market flags.

## Sources
World Football Elo (worldfootballrankings.com / eloratings.net) · Opta supercomputer (theanalyst.com) · FIFA World Ranking · betting markets (bet365, DraftKings, ESPN) · official FIFA group pages. Data verified 20–21 June 2026.

Static site — no build step. Just open `index.html`.
