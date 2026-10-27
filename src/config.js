// =============================================================================
// PANTHER PROWL: GAME CONFIG
// =============================================================================
// This is the one file to edit if you want to change how the game looks or
// plays. Every value has a comment saying what it does. Change one thing, save,
// reload the page, and see what happens!
//
// Units:
//   - Distances are in TILES. One tile is one square of the maze grid, so a
//     speed of 7 means "7 squares per second", whatever the screen size.
//   - Times are in seconds unless the name says otherwise.
// =============================================================================

export const THEME = {
  // School colors (from ghcds.org; not yet confirmed as official).
  gold: '#F6BC1B',
  maroon: '#701114',
  charcoal: '#58595B',

  // Halloween colors (from the Boo Bash 2026 flyer).
  skyTop: '#12051f',     // darkest night purple
  skyBottom: '#3d1466',  // purple glow
  moon: '#ffd75e',       // harvest moon yellow
  pumpkin: '#ff7a1a',

  // The maze.
  floor: '#1a0a2e',          // hallway floor
  floorTile: '#1f0d36',      // every other floor square, for a checkerboard
  wall: '#701114',           // lockers (school maroon)
  wallShade: '#4a0b0e',      // darker locker edge
  wallTrim: '#F6BC1B',       // glowing gold trim around the lockers
  door: '#ff7a1a',           // the ghost-house door

  // Candy corn colors, from the wide end to the tip.
  candy: ['#ffc21a', '#ff7a1a', '#fff6e0'],

  // The panther.
  pantherFur: '#141018',
  pantherRim: '#F6BC1B',
  pantherEyes: '#ffd75e',

  // Scared ghosts (during Panther Power).
  scaredGhost: '#7f8cff',
  scaredFlash: '#f4f0ff',

  // Fonts. These are bundled in assets/fonts so they work offline.
  displayFont: '"Creepster", "Impact", fantasy',
  uiFont: '"Fredoka", "Trebuchet MS", system-ui, sans-serif',
};

// -----------------------------------------------------------------------------
// MAZES: which maze each mode uses. Mazes live in src/mazes/ (see the README).
// -----------------------------------------------------------------------------
export const MAZES = {
  classic: 'haunted-halls',
  challenge: 'haunted-halls', // every paid play uses the same maze (staff can change it)
};

// -----------------------------------------------------------------------------
// THE PANTHER (that's you!)
// -----------------------------------------------------------------------------
export const PANTHER = {
  speed: 7,            // tiles per second
  powerSpeed: 7.8,     // a little faster during Panther Power
  // If you press a turn a bit early, the game remembers it this long and
  // turns at the next corner where it can. Bigger = more forgiving.
  turnMemorySeconds: 0.5,
};

// -----------------------------------------------------------------------------
// GHOSTS: who's chasing you. Each one needs:
//   id         a unique name (lowercase)
//   name       shown in the game and the README
//   brain      how it chases you. See src/core/ghost-brains.js:
//              'hunter', 'ambusher', 'shy' or 'wanderer'
//   color      body color
//   look       its accessory, so you can tell ghosts apart without color:
//              'witch-hat', 'pumpkin', 'scarf' or 'skull'
//   corner     where it goes during "scatter" time:
//              'top-left', 'top-right', 'bottom-left' or 'bottom-right'
//   leaveAfter seconds before it leaves the ghost house at the start
// -----------------------------------------------------------------------------
export const GHOSTS = [
  { id: 'hex', name: 'Hex', brain: 'hunter', color: '#6fe36a', look: 'witch-hat', corner: 'top-right', leaveAfter: 0 },
  { id: 'jack', name: 'Jack', brain: 'ambusher', color: '#ff8a2a', look: 'pumpkin', corner: 'top-left', leaveAfter: 1.5 },
  { id: 'mist', name: 'Mist', brain: 'shy', color: '#49dff0', look: 'scarf', corner: 'bottom-left', leaveAfter: 4 },
  { id: 'bones', name: 'Bones', brain: 'wanderer', color: '#f2ead6', look: 'skull', corner: 'bottom-right', leaveAfter: 7 },
];

export const GHOST_SPEED = {
  base: 5.6,      // tiles per second on level 1
  perLevel: 0.3,  // how much faster each level
  max: 7.2,       // never faster than this
  scared: 3.6,    // during Panther Power
  eyes: 12,       // racing home after being pounced
  inHouse: 3,     // walking out of the ghost house
};

// Ghosts take turns between two moods. In "scatter" they head to their own
// corner (giving you a breather). In "chase" they use their brain to hunt you.
// After the last entry they chase forever.
export const GHOST_MOODS = [
  { mood: 'scatter', seconds: 6 },
  { mood: 'chase', seconds: 20 },
  { mood: 'scatter', seconds: 5 },
  { mood: 'chase', seconds: 20 },
  { mood: 'scatter', seconds: 4 },
];

// Brain settings (see src/core/ghost-brains.js).
export const BRAINS = {
  ambushTilesAhead: 4, // the ambusher aims this many tiles in front of you
  shyDistance: 7,      // the shy ghost runs away when it gets this close
};

// -----------------------------------------------------------------------------
// PANTHER POWER: eat a golden paw and the ghosts get scared.
// -----------------------------------------------------------------------------
export const POWER = {
  seconds: 7,        // how long it lasts on level 1
  perLevel: -0.75,   // change per level (negative = shorter)
  minSeconds: 3,     // never shorter than this
  warnSeconds: 2,    // ghosts flash for this long before they stop being scared
};

// -----------------------------------------------------------------------------
// SCORING
// -----------------------------------------------------------------------------
export const SCORING = {
  candy: 10,
  powerPaw: 50,
  // Pounce on ghosts one after another during one Panther Power for a combo.
  // First ghost = 200, second = 400, and so on.
  pounceChain: [200, 400, 800, 1600],
  extraLifeAt: 10000, // Classic mode: earn an extra life at this score
};

// -----------------------------------------------------------------------------
// MODES
// -----------------------------------------------------------------------------
export const MODES = {
  classic: {
    lives: 3,
  },
  challenge: {
    roundSeconds: 90, // Boo Bash Challenge length (staff can change it)
  },
};

// How long the short pauses in the game last.
export const TIMING = {
  readySeconds: 2.2,    // "Ready?" before each life starts
  pounceSeconds: 0.45,  // the game freezes for a moment when you pounce a ghost
  caughtSeconds: 1.6,   // the caught animation
  clearedSeconds: 2,    // the "Hall cleared!" celebration
  // Collision: how close (in tiles) a ghost and the panther have to be to touch.
  touchDistance: 0.65,
};

// -----------------------------------------------------------------------------
// PRIZES (Boo Bash Challenge only). Staff can change these in staff mode.
// -----------------------------------------------------------------------------
// The highest tier whose minScore you reach is the prize you win.
// The names match the other Panther Arcade games.
//
// How these were picked (90-second round, Haunted Halls): steering at random
// scores about 1,250. The computer autopilot (src/core/autopilot.js), which
// never makes a mistake, scores about 6,000. Real players land in between.
// Check them at the booth rehearsal and adjust in staff mode.
export const PRIZE_TIERS = [
  { id: 'bronze', name: 'Bronze Panther', minScore: 1500, color: '#cd7f32' },
  { id: 'silver', name: 'Silver Panther', minScore: 2500, color: '#d9dde3' },
  { id: 'gold', name: 'Gold Panther', minScore: 4000, color: '#F6BC1B' },
  { id: 'legendary', name: 'Legendary Panther', minScore: 6000, color: '#c77dff' },
];

// -----------------------------------------------------------------------------
// CONTROLS
// -----------------------------------------------------------------------------
export const CONTROLS = {
  swipeThreshold: 18, // pixels a finger must move before it counts as a swipe
  // The on-screen arrow pad on touch screens: 'auto' shows it when there's
  // room for it, 'always' or 'never'.
  dpad: 'auto',
};

// -----------------------------------------------------------------------------
// EFFECTS
// -----------------------------------------------------------------------------
export const EFFECTS = {
  maxParticles: 220,    // hard cap so older tablets stay smooth
  screenShake: true,
  flickeringLights: true,
};
