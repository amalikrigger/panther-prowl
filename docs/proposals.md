# Proposals awaiting Amali's approval

Nothing in this file has been built or deployed. Each item needs a yes first.

## 1. Put Panther Prowl on thinkinbits.site

**How the site works today:** `think_in_bits` is a static GitHub Pages site
(`CNAME` → www.thinkinbits.site). Each game lives in its own folder,
`projects/<name>/index.html`, and gets a card on `projects.html`.

**Proposal:**
1. Copy only the files the game ships with into
   `think_in_bits/projects/panther-prowl/`:
   - `index.html`, `sw.js`, `manifest.webmanifest`
   - `src/`
   - `assets/fonts/`, `assets/icons/`, `assets/characters/` (if any),
     `assets/CREDITS.md`

   Leave out `tests/` and `docs/`.
2. Add a Panther Prowl card to `projects.html`, the same way the other games
   have one.
3. Commit and push `think_in_bits` (that's the deploy).

The game will then live at **thinkinbits.site/projects/panther-prowl/**.
Everything uses relative paths and the offline worker scopes itself to that
folder, so it needs no changes. I tested exactly this kind of subfolder
hosting.

**Why copy instead of linking the repos:** a git submodule or a build step
would be more moving parts for students. A copy means "export" is one
command, and I'd add a small `tools/export.sh` that does it.
**The cost:** the site's copy only updates when someone re-exports.

**Timing:** if visitors should play on their phones at the event (over
cellular, since the event Wi-Fi is unreliable), this has to go live by
Thursday. Booth devices don't need it: they can run from a laptop server or
from the cached copy.

**Optional preview first:** turn on GitHub Pages for the `panther-prowl` repo
itself, giving amalikrigger.github.io/panther-prowl/. It's a zero-risk way to
try it on real phones and iPads today. The repo is already public, so this
exposes nothing new.

## 2. A shared online leaderboard (after the event)

Not needed for event night: each booth device keeps its own board. If you
want one board across devices or across the three games:

- **Service:** Supabase (hosted Postgres with row-level security and a small
  edge function). The free tier covers a school event many times over, so
  **$0**. Firebase Firestore is the alternative, also free at this size.
  Supabase is plain SQL, which is easier to teach.
- **Data stored:** game, board (maze + round length), 3 letters, score, date,
  station name. **No names, emails, accounts, device IDs or locations.**
  Note: the provider keeps standard request logs (IP addresses), which we'd
  disclose. No player-facing sign-in, ever.
- **Initials moderation:**
  - The server only accepts `^[A-Z]{3}$` and applies the same blocked list.
  - Staff mode gets a "hide this entry" button, using a staff token, not a
    player action.
- **Anti-cheat basics:**
  - Only prize stations can submit, each with a per-station token issued in
    staff mode.
  - The server rejects scores above a plausible ceiling for the round length
    (the autopilot's best is about 10,000 in 90 s).
  - Rate limit of one submission per station per 30 s.
  - Honest limit: anything a browser can send, a determined person can fake.
    The prize screen on the booth device stays the real proof.
- **Offline-first:** scores queue on the device and upload when it's back
  online. The local board keeps working without a connection.
- **Effort:** about 3 to 4 hours, plus your Supabase account setup (yours to
  create).

## 3. A "Panther Arcade" landing page (after the event)

One page, for example thinkinbits.site/projects/panther-arcade/, with three
big cards: Prowl, Slash and Pounce. It would use the shared colors and fonts,
plus one line each on how to win prizes. It's about an hour of work.

It needs no shared code: each game stays self-contained, as the brief asks.
The shared conventions are already written down in `docs/plan.md`.

## Noticed, not acted on

`~/Developer/` also has `panther-prowl-ms` (an untouched "middle school" copy
of the same Pac-Man base), `panther-slash-ms`, `panther-pounce-ms` and
`panther-dash` (from a Mario Kart base). I haven't touched them.
`panther-prowl-ms` could start from this rebuild instead of the old base, if
that's what it's for.
