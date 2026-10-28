# Panther Prowl: kickoff prompt

You are taking over **Panther Prowl**, a browser maze-chase game we are rebuilding for the **Good Hope Country Day School (GHCDS) Boo Bash** Halloween event. I teach at GHCDS. My students will clone this repo and keep improving the game with me, so the code is also a teaching codebase. Read this whole brief, orient yourself in the repo, give me a plan, and then start building Phase 0 right away. Stop only at the checkpoints below or for a decision that really is mine.

---

## 1. The event (hard deadline)

- **Boo Bash 2026:** Thursday, **October 30, 2026, 4–7 PM**, on the GHCDS campus in Kingshill, St. Croix, USVI. "All of Saint Croix is welcome."
- Activities: student-led games ($2/game), a creepy haunted house ($5), trunk-or-treat, prizes, and a food/bake sale. Hashtags: #BooBash #PantherPride #SpookySeason.
- Sources: https://www.ghcds.org/apps/news/article/2234832?categoryId=22434 (the 2026 flyer) and https://www.ghcds.org/apps/news/article/2129005 (the 2025 event).
- Check today's date. The game must be **event-ready by the evening of Oct 29**. Anything that can't be finished and tested by then is post-event work, so plan scope against the time we actually have.
- Likely event setup (confirm with me): one or more school laptops/tablets as play stations at a booth, plus visitors possibly playing on their own phones. Event Wi-Fi is not reliable, so **the core game must work fully offline.**
- **Where it will live:** the game will eventually be hosted on my website, **thinkinbits.site**, for the school. It will probably be served from a subpath (for example `thinkinbits.site/panther-prowl/`), so use **relative URLs only**: no root-absolute `/assets/...` paths and no assumptions about the domain. Keep the game a self-contained static folder that can be dropped into any static host. Don't touch the website's own repo or deploy anything without my approval.

## 2. The Panther Arcade (sibling games)

Panther Prowl is one of three Boo Bash games being rebuilt in parallel from the same brief:
- **Panther Slash**: a slicing game (`~/Developer/WebstormProjects/panther-slash`, github.com/amalikrigger/panther-slash).
- **Panther Pounce**: a slingshot game (`~/Developer/WebstormProjects/panther-pounce`, github.com/amalikrigger/panther-pounce).
- **Panther Prowl**: this repo, the maze game.

Players should feel they're playing one arcade. Keep these consistent across the three games:
- The color tokens and fonts.
- The prize-tier names (Bronze / Silver / Gold / Legendary Panther).
- The leaderboard and initials-entry flow, and how staff/admin mode works.

You may **read** the sibling repos to match decisions already made there. **Never edit them** from this session. Each game stays self-contained with no shared code dependency for now. If you think a shared "arcade shell" (one landing page linking all three, shared theme file) is worth it, propose it; don't build it.

## 3. Identity and visual direction

**School:** GHCDS, home of the **Panthers** (#PantherPride).
- Colors seen on ghcds.org (confirm with me before treating them as official): gold `#F6BC1B`, maroon `#701114`, charcoal `#58595B`.
- The school logo is a gold tree silhouette: https://www.ghcds.org/pics/school_logo.png. **Do not use the school logo or other school marks in the game** until I confirm we have permission. Use the colors and the panther theme freely.

**Halloween / Boo Bash:** the 2026 flyer uses deep purple skies, a huge harvest-moon yellow, pumpkin orange, black silhouettes (haunted house, bats, spiderweb), and a drippy horror display font (Creepster on Google Fonts is a close match).

**Game concept:**
- A **panther** prowls the halls of a haunted school at night, gobbling candy while ghosts chase it.
- Grabbing a golden paw power-up (**Panther Power**) flips the chase, and the panther can pounce on the ghosts.
- Each ghost should have its own look and chase personality.
- Mazes should feel like stylized haunted halls: lockers, classrooms, cobwebs, flickering lights. Nothing should depict real school buildings without permission.

**Direction:** a modern, polished arcade game, not a 2010 HTML5 port. Combine the Panther gold/maroon with the Halloween purple/orange into one coherent theme. The UI should feel bold and juicy: smooth transitions, good typography, satisfying chomps and power-up moments, and clear contrast for a booth with crowds and outdoor light.

## 4. What is in the repo today

- Static site, no build step. Run it with `python3 -m http.server <port>` from the repo root; pick a free port, since sibling games may be running too.
- It started as a copy of an "HTML5 Pacman" game.
  - **All game logic is in `pacman.js`, about 18 KB of minified code on a single line**, drawn with plain Canvas 2D at `Pacman.FPS = 30`.
  - It has `Pacman.Ghost`, `Pacman.User` and `Pacman.Map` modules. The maze is hard-coded as `Pacman.MAP`.
  - Mobile is detected with `"ontouchstart" in window`, and on mobile it uses **nipplejs** (`nipplejs.min.js`) for a virtual joystick.
  - Audio is plain HTML5 `Audio` (`audio/opening_song`, `die`, `eatghost`, `eatpill`, `eating`).
  - It uses the `Cartoon.ttf` font (license unknown).
- `index.html` locks the page to **342×450 px** (`<meta name="viewport" content="width=342">`, fixed `#pacman` size), with a DOM "START GAME" button overlay.
- There's a `storage = []` in the code. Verify whether the high score actually persists; it probably doesn't.
- **IP:** the name, the yellow character, the ghost designs, the classic maze layout and probably the sound effects come from Bandai Namco's Pac-Man, and this repo is **public**. Bandai Namco protects this IP actively. Replacing every Pac-Man-derived name, character design, maze layout and sound, and the font if its license can't be confirmed, with original or properly licensed material is a real requirement, not polish. Do it before the event if at all possible.

## 5. Technical approach

- **Start simple with what we have.** Vanilla JS and Canvas 2D, no bundler, no npm build. It must open from a static server and work offline.
- First, un-minify `pacman.js` into readable source and understand it. Then decide, and tell me why: refactor the existing engine into clean modules, or rewrite the core loop in clean vanilla JS while reusing what is worth keeping. Either way, the result should be readable ES modules (`<script type="module">`) that a student can follow.
- Three.js, Pixi or another framework is allowed **only if** you can show a concrete need that Canvas 2D can't meet. Propose it with the trade-off; don't just add it.
- Make mazes **data**: a readable text grid, one character per tile, in its own file, with a short legend. Students should be able to design a maze in a text editor. Validate mazes on load: every candy reachable, ghost house enclosed, tunnels paired.
- Keep anything a student might want to tweak (colors, fonts, speeds, ghost behavior, power-up duration, scoring, prize thresholds) in one well-commented config/theme file.
- Responsive and full-screen across desktop, tablet and phone:
  - Remove the 342 px lock, fill the viewport and scale for `devicePixelRatio`.
  - Scale the maze to fit portrait phones and landscape desktops with crisp, integer-friendly tile sizes.
  - Handle resizes and orientation changes.
  - Add a full-screen button using the Fullscreen API, with a fallback for iOS Safari.
  - Unlock audio on the first tap.
- Controls must feel great everywhere:
  - Keyboard: arrows and WASD.
  - **Swipe gestures** on touch.
  - An optional on-screen d-pad or the existing joystick (re-evaluate whether nipplejs is still needed).
  - Input buffering, so a turn pressed slightly early still takes at the next junction.
  - Prevent scrolling, zooming and the context menu during play.
- Use frame-rate-independent movement rather than relying on a fixed 30 FPS loop, and pause when the tab is hidden.
- Performance target: smooth on an older school tablet or Chromebook.
- Accessibility: big touch targets, readable text, `prefers-reduced-motion` support, and ghosts that are distinguishable by shape or accessories, not just color.

## 6. Winning, prizes, and leaderboard

Boo Bash charges $2 per game and gives prizes, so the game needs a fair, booth-friendly way to win:

- **Boo Bash Challenge mode:** a score-attack round with a fixed time limit (start with 90 seconds, configurable) and the same maze for every paid play, so every play is equal and the line keeps moving. Keep classic lives-based mode as well.
- **Prize tiers:** score thresholds such as Bronze / Silver / Gold / Legendary Panther, all configurable. At the end of a round, show a big, clear **prize screen** a booth volunteer can verify at a glance: tier, score, time, and a short verification code. It must be hard for a kid to fake with a screenshot of someone else's win. Propose a simple scheme.
- **Leaderboard:** offline-first and local to each device, using `localStorage`. Show the top 10 with **arcade-style 3-letter initials only. Never collect names, emails or other personal data; most players are minors.** Include "today's best" for the event night.
- **Staff/admin mode:** behind a hidden gesture plus a PIN. Lets staff reset the board, set prize thresholds, the round length and the challenge maze, and switch to kiosk mode (auto-return to the title screen after inactivity).
- **Shared online leaderboard across devices:** design for it but **don't build it without my approval**. When you propose it, cover the service (for example Supabase or Firebase), the cost, how to moderate initials, anti-cheat basics, and keeping minors' data out.
- Gameplay depth beyond that is welcome: bonus treats (candy apples, full-size bars), combo multipliers for chaining ghost pounces, multiple mazes, and a ghost-difficulty ramp. Event-night clarity comes before features.

## 7. Assets: where they come from

Every asset must have a known source and license. Keep `assets/CREDITS.md` up to date with the file, source, author, license and link.

In order of preference:
1. **Drawn in code** (Canvas/SVG shapes, gradients, particles). No licensing risk, and a maze game suits this especially well: walls, candy, ghosts and even the panther can be vector-drawn.
2. **CC0 / openly licensed sources:** Kenney.nl (CC0) and OpenGameArt (check each file's license). Google Fonts (OFL): Creepster for display text, plus a clean sans-serif for UI. Sounds: generate effects with jsfxr/sfxr, or use CC0 sounds from Freesound. **Don't reuse the original Pac-Man sound effects or music.**
3. **Student-made art:** the panther, the ghosts, candy sprites, voice recordings of a panther growl or a "BOO!". This is the best option for the classroom. Build the asset pipeline so a student can drop in a PNG with a transparent background and register it in the config. Write down the exact sprite specs (tile size and animation frames).
4. **AI-generated images:** acceptable for placeholders or with my sign-off. Note it in CREDITS.

School marks are off-limits until permission is confirmed (see section 3).

## 8. Students and maintainability

- Code should be readable by a motivated high-school student: clear names, small files, and comments that explain *why* where it isn't obvious. Ghost AI is a great teaching topic, so make the chase logic especially clear.
- Write or refresh `README.md`: what the game is, how to run it locally, how to play, and the student git workflow (`git pull` first, small commits with your name in the message, then `git push`), plus how to design a new maze and add a new ghost.
- Write a project `CLAUDE.md` that captures the durable context from this brief (event, identity, sibling games, constraints, architecture, asset rules, privacy rules), so future sessions, including ones on the school computer, start fully informed. Keep it concise and point to the docs instead of duplicating them.
- Keep a `docs/student-tasks.md` list of good first tasks for students, for example: design a maze, give a ghost a new personality, draw a candy sprite, design a prize-tier badge, record sound effects.

## 9. Phases and checkpoints

**Phase 0: orient and plan (do this first, then keep going).** Un-minify and read the code, run the game, and confirm what works and what doesn't. Give me a short orientation report (how the engine works, what to keep and what to replace, risks) and a phased plan with rough time estimates checked against the Oct 29 event-ready target. Ask me only the questions that block work. Likely questions: what the actual prizes are, what devices the booth will use, and whether we have school-logo permission. Use sensible, clearly labeled defaults for everything else and continue.

**Phase 1: event-ready core.** Readable modular code, responsive full-screen on all devices, great keyboard and swipe controls, saved high score, full Panther Prowl rebrand with every Pac-Man name, design, maze and sound replaced, new title/game-over screens, an original maze, and the new color theme. → **Checkpoint:** show it working at phone, tablet and desktop sizes.

**Phase 2: winning.** Challenge mode, prize tiers and the prize screen, local leaderboard with initials, and staff/admin plus kiosk mode. → **Checkpoint.**

**Phase 3: polish.** Juice, sound, bonus treats, more mazes, ghost personalities, accessibility, and performance tuning on low-end devices. → **Checkpoint.**

**Later, only with my approval:** an online shared leaderboard, deploying to thinkinbits.site so visitors can play on their phones (propose how it fits into the site, and whether a GitHub Pages preview is useful before then), a shared arcade shell, and frameworks such as Three.js.

At each checkpoint, report what changed, how you verified it (actually run it in a browser at several viewport sizes, test keyboard and swipe controls, and check the console for errors), what is still rough, and what's next.

## 10. Ground rules

- My standing rules apply: **ask before any commit, push, deploy, new external service or account, or deleting/moving files.** Group work into logical commits and propose each one with its message when ready.
- Don't add dependencies or services I haven't approved. Pin exact versions and vendor the files into the repo. Do not use CDN-only loading, because the game has to work offline.
- Never collect personal data from players.
- If something in this brief turns out to be wrong once you read the code, tell me and adjust. Don't silently work around it.

Start now with Phase 0.
