# Grand Meridian Theatre – Interactive Venue Ticketing System

WM1 student project · HTML + CSS + JavaScript only (no frameworks, no backend)

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: map, controls, seat details, cart |
| `style.css` | Theme, seat states, responsive layout |
| `venue-data.js` | The venue data model (categories, prices, sections, stage, unavailable seats) |
| `app.js` | Seat generation, inspection, cart, localStorage, pan/zoom, mouse bonus |

## Venue

Auditorium/theatre with 8 sections and **492 seats**, 5 price categories:

| Category | Price | Sections |
|---|---|---|
| VIP Box | $150 | Box Left, Box Right |
| Premium | $110 | Orchestra Front |
| Standard | $75 | Orchestra Left / Right / Rear |
| Mezzanine | $55 | Mezzanine |
| Balcony | $35 | Balcony |

## Requirements checklist

- [x] Substantial venue map with multiple sections and price categories
- [x] Seats generated from JavaScript data (`venue-data.js` → `buildModel()` / `renderVenue()` in `app.js`)
- [x] Each seat is a `<button>`
- [x] Click = inspect only (section, row, seat, category, price, status); only **ADD TO CART** adds
- [x] States: available, inspected, in cart, unavailable
- [x] Controls: Zoom In, Zoom Out, Move Up/Down/Left/Right, Reset / Center View (with sensible zoom and pan limits)
- [x] Cart list with prices, total, remove buttons, clear button
- [x] Map ⇄ cart always synchronised (`updateSeat()` is the single place seat visuals are set)
- [x] Duplicate seats cannot be added; unavailable seats cannot be added
- [x] Cart stored in `localStorage`, restored with matching seat states on refresh (invalid/duplicate/unavailable ids are ignored; corrupt data is handled)
- [x] Responsive layout (desktop two-column, stacked below 960px, compact below 560px)
- [x] **Bonus:** mouse-wheel zoom (towards the cursor) and click/drag panning; all buttons still work. A drag never selects a seat.

Extras: keyboard-accessible seats with descriptive `aria-label`s, `Esc` clears inspection, live-region announcements.

## Navigation notes

- "Move Up" moves the camera up (the map slides down), and likewise for the other directions.
- The zoom readout is relative to the fitted view, so Reset shows 100%.

## Suggested commit plan (min. 3 per week, 12 total)

Commit your own files only (no `node_modules`). Spread commits across each week.

**Week 1 – Design and venue model**
1. `Create repository with project structure and README`
2. `Add HTML skeleton: map area, controls, details and cart panels`
3. `Add base CSS theme and responsive grid layout`
4. `Define venue data model: categories, prices and sections`

**Week 2 – Dynamic venue and seat inspection**
5. `Generate seat buttons from venue data`
6. `Add seat states and unavailable-seat generation`
7. `Add seat inspection panel with details and price`

**Week 3 – Navigation, cart and storage**
8. `Add zoom, directional pan and reset controls with limits`
9. `Implement Add to Cart, duplicate prevention and total`
10. `Add cart removal with map synchronisation`
11. `Persist cart in localStorage and restore seat states`

**Week 4 – Integration and final quality**
12. `Improve responsive layout for tablet and phone widths`
13. `Handle edge cases: corrupt storage, unknown seat ids`
14. `Add mouse wheel zoom and drag panning (bonus)`
15. `Final polish, accessibility labels and README update`

```bash
git init
git add README.md
git commit -m "Create repository with project structure and README"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
# later:  git add <files>  &&  git commit -m "..."  &&  git push
git rev-parse HEAD   
```