// Draws one frame of the game.
//
// Order matters: things drawn later cover things drawn earlier. So we draw the
// background first, then candy, ghosts, the panther, sparks, and finally text.

import { GHOSTS, EFFECTS, THEME } from '../config.js';
import { PELLET } from '../core/game.js';
import { buildScene } from './scene.js';
import { drawPanther, drawGhost, drawCandyCorn, drawPowerPaw } from './art.js';

const ghostSpecs = Object.fromEntries(GHOSTS.map((spec) => [spec.id, spec]));

export class Renderer {
  constructor(canvas, { reducedMotion }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion = reducedMotion;
    this.scene = null;
    this.layout = null;
    this.flicker = { wait: 6, left: 0 };
  }

  /** Call when the screen size or the maze changes. */
  resize(layout, maze) {
    this.layout = layout;
    this.canvas.width = Math.round(layout.width * layout.pixelRatio);
    this.canvas.height = Math.round(layout.height * layout.pixelRatio);
    this.scene = buildScene(layout, maze);
  }

  /**
   * @param game     the Game being shown
   * @param effects  the Effects (sparks, popups...)
   * @param time     seconds since the page loaded, for animations
   * @param dt       seconds since the last frame
   */
  draw(game, effects, time, dt) {
    const { ctx, layout } = this;
    if (!layout) return;
    const { pixelRatio: ratio, tile } = layout;
    const maze = game.maze;

    // 1. The background and maze picture we prepared earlier.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.scene, 0, 0);

    // 2. Switch to tile units: 1 unit = 1 tile, and (col, row) is the
    //    CENTER of that tile.
    const shake = effects.shakeOffset;
    const originX = layout.maze.x + tile / 2 + shake.x * tile;
    const originY = layout.maze.y + tile / 2 + shake.y * tile;
    ctx.setTransform(tile * ratio, 0, 0, tile * ratio, originX * ratio, originY * ratio);

    // Anything poking out of a tunnel gets cut off at the maze edge.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-0.5, -0.5 - 1, maze.cols, maze.rows + 1);
    ctx.clip();

    this.drawPellets(game, time);
    this.drawGhosts(game, time);
    this.drawThePanther(game, time);
    effects.drawParticles(ctx);
    this.drawFlicker(game, dt);

    ctx.restore();

    // 3. Floating score numbers, in screen pixels so the text stays crisp.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const popup of effects.popups) {
      const fade = Math.min(1, (popup.life / popup.maxLife) * 2);
      const x = originX + popup.x * tile;
      const y = originY + popup.y * tile;
      ctx.globalAlpha = fade;
      ctx.font = `700 ${Math.round(popup.size * tile)}px ${THEME.uiFont}`;
      ctx.lineWidth = Math.max(2, tile * 0.14);
      ctx.strokeStyle = 'rgba(18, 5, 31, 0.9)';
      ctx.strokeText(popup.text, x, y);
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, x, y);
    }
    ctx.globalAlpha = 1;

    // 4. A full-screen flash (Panther Power, getting caught).
    if (effects.flashLeft > 0) {
      ctx.globalAlpha = (effects.flashLeft / effects.flashLength) * 0.45;
      ctx.fillStyle = effects.flashColor;
      ctx.fillRect(0, 0, layout.width, layout.height);
      ctx.globalAlpha = 1;
    }
  }

  drawPellets(game, time) {
    const { ctx } = this;
    const { cols, rows } = game.maze;
    const candy = [];
    const paws = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pellet = game.pelletAt(col, row);
        if (pellet === PELLET.CANDY) candy.push({ col, row });
        else if (pellet === PELLET.POWER_PAW) paws.push({ col, row });
      }
    }
    drawCandyCorn(ctx, candy);
    for (const { col, row } of paws) {
      ctx.save();
      ctx.translate(col, row);
      drawPowerPaw(ctx, this.reducedMotion ? 0 : time);
      ctx.restore();
    }
  }

  drawGhosts(game, time) {
    const { ctx } = this;
    const fading = game.phase === 'caught' ? Math.max(0, 1 - (1 - game.phaseLeft / game.phaseLength) * 3) : 1;
    if (fading <= 0) return;
    ctx.globalAlpha = fading;
    for (const ghost of game.ghosts) {
      const state = {
        dir: ghost.dir,
        time: this.reducedMotion ? 0 : time,
        scared: ghost.scared && ghost.state !== 'eyes',
        flashing: game.powerEnding,
        eyesOnly: ghost.state === 'eyes' || ghost.state === 'entering',
      };
      // Ghosts waiting in the house bob up and down.
      const bob = ghost.state === 'waiting' && !this.reducedMotion ? Math.sin(time * 4 + ghost.index) * 0.2 : 0;
      this.drawWrapped(game.maze, ghost.x, ghost.y + bob, () => drawGhost(ctx, ghostSpecs[ghost.id], state));
    }
    ctx.globalAlpha = 1;
  }

  drawThePanther(game, time) {
    const { panther } = game;
    const caughtProgress = game.phase === 'caught' ? 1 - game.phaseLeft / game.phaseLength : 0;
    const state = {
      facing: panther.facing,
      moving: game.phase === 'playing' && panther.dir !== null,
      time: this.reducedMotion ? 0 : time,
      powered: game.powerLeft > 0,
      caughtProgress,
    };
    this.drawWrapped(game.maze, panther.x, panther.y, () => drawPanther(this.ctx, state));
  }

  // Something halfway through a tunnel shows up on both sides of the maze.
  drawWrapped(maze, x, y, draw) {
    const { ctx } = this;
    const positions = [[x, y]];
    if (x < 0.5) positions.push([x + maze.cols, y]);
    if (x > maze.cols - 1.5) positions.push([x - maze.cols, y]);
    for (const [px, py] of positions) {
      ctx.save();
      ctx.translate(px, py);
      draw();
      ctx.restore();
    }
  }

  // Every so often the hallway lights flicker.
  drawFlicker(game, dt) {
    if (!EFFECTS.flickeringLights || this.reducedMotion) return;
    const flicker = this.flicker;
    if (flicker.left > 0) {
      flicker.left -= dt;
      if (Math.random() < 0.5) {
        this.ctx.fillStyle = `rgba(5, 0, 12, ${0.15 + Math.random() * 0.3})`;
        this.ctx.fillRect(-0.5, -0.5, game.maze.cols, game.maze.rows);
      }
    } else {
      flicker.wait -= dt;
      if (flicker.wait <= 0) {
        flicker.left = 0.25 + Math.random() * 0.35;
        flicker.wait = 7 + Math.random() * 9;
      }
    }
  }
}
