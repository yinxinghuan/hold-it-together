import Matter from 'matter-js';
import { pickStressor, type Stressor } from './stressors';
import { loc } from './i18n';
import { playDrop, playPlace, playGameOver } from './audio';

// Fixed logical world; the canvas scales to it. The view scrolls vertically
// (camY) as the tower grows so the top stays near the upper third.
export const WORLD_W = 360;
export const WORLD_H = 640;

const BASE_W = 116;
const BASE_H = 26;
const BASE_CX = WORLD_W / 2;
const BASE_TOP_Y = 588;          // world-y of the base's top surface
const BLOCK_H = 34;
const DROP_GAP = 58;             // how far above the tower top the held block hovers
const HOLD_SCREEN_Y = 150;       // where the held block sits on-screen (camera anchor)
const SETTLE_V = 0.45;           // |velocity| below this counts as settled
const SETTLE_MS = 380;           // must stay settled this long before next block
const VOID_Y = BASE_TOP_Y + 190; // anything fallen past here has dropped off → collapse
const TOPPLE_ANGLE = 0.92;       // ~53°: a settled block this tilted = collapse
const TOPPLE_GRACE = 420;

interface BlockPlugin {
  isBlock: true;
  st: Stressor;
  label: string;
  w: number;
  bornAt: number;
  placed: boolean;   // has it been counted into the tower
  tiltSince: number;
}
type BlockBody = Matter.Body & { plugin: BlockPlugin };

function isBlock(b: Matter.Body): b is BlockBody {
  return !!(b.plugin && (b.plugin as Partial<BlockPlugin>).isBlock);
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; }

export interface GameCallbacks {
  onScore: (n: number) => void;
  onGameOver: () => void;
}

export class TowerGame {
  private engine: Matter.Engine;
  private world: Matter.World;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private particles: Particle[] = [];

  private started = false;
  private gameOver = false;
  private score = 0;
  private lastTs = 0;
  private shakeMag = 0;

  // swing of the held block
  private swingPhase = 0;
  private held: { st: Stressor; label: string; w: number } | null = null;
  private dropping: BlockBody | null = null;   // block in flight / settling
  private settleAt = 0;
  private spawnReadyAt = 0;

  private camY = BASE_TOP_Y - DROP_GAP - HOLD_SCREEN_Y; // start so base sits mid-screen
  private towerTopY = BASE_TOP_Y;                        // world-y of current tower top surface

  constructor(canvas: HTMLCanvasElement, private cb: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0.85;
    this.world = this.engine.world;
    this.buildBase();
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  private buildBase() {
    const base = Matter.Bodies.rectangle(BASE_CX, BASE_TOP_Y + BASE_H / 2, BASE_W, BASE_H, {
      isStatic: true, friction: 0.9, restitution: 0,
    });
    (base as any).isBase = true;
    Matter.Composite.add(this.world, base);
  }

  private measureBlock(label: string): number {
    const ctx = this.ctx;
    ctx.font = '800 15px -apple-system, "PingFang SC", system-ui, sans-serif';
    const w = ctx.measureText(label).width;
    return Math.max(60, Math.min(150, Math.round(w + 30)));
  }

  private nextHeld() {
    const st = pickStressor();
    const label = loc(st.zh, st.en);
    this.held = { st, label, w: this.measureBlock(label) };
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.nextHeld();
  }

  // current swing amplitude/speed grow with the tower for difficulty.
  // start narrow (center of mass stays over the base) and ramp up slowly.
  private swingAmp() {
    return Math.min(122, 38 + this.score * 3);
  }
  private swingSpeed() {
    return 0.016 + Math.min(0.022, this.score * 0.0011);
  }

  private heldX() {
    return BASE_CX + Math.sin(this.swingPhase) * this.swingAmp();
  }
  // dev-only: how far the held block is from the base center right now
  debugHeldOffset() { return this.held ? Math.abs(this.heldX() - BASE_CX) : 999; }
  debugReady() { return !!this.held && !this.dropping; }
  private heldWorldY() {
    return this.towerTopY - DROP_GAP;
  }

  drop() {
    if (!this.started || this.gameOver) return;
    if (!this.held || this.dropping) return;       // wait for the last one to settle
    const h = this.held;
    const x = this.heldX();
    const y = this.heldWorldY();
    const body = Matter.Bodies.rectangle(x, y, h.w, BLOCK_H, {
      friction: 0.95,
      frictionStatic: 2.0,
      restitution: 0.0,
      density: 0.0016,
      frictionAir: 0.02,
      chamfer: { radius: 4 },
    }) as BlockBody;
    body.plugin = {
      isBlock: true, st: h.st, label: h.label, w: h.w,
      bornAt: performance.now(), placed: false, tiltSince: 0,
    };
    Matter.Composite.add(this.world, body);
    Matter.Body.setVelocity(body, { x: 0, y: 0.5 });
    playDrop();
    this.dropping = body;
    this.held = null;
    this.settleAt = 0;
  }

  private blocks(): BlockBody[] {
    return Matter.Composite.allBodies(this.world).filter(isBlock);
  }

  private updateDropping(now: number) {
    const b = this.dropping;
    if (!b) return;
    const speed = Math.hypot(b.velocity.x, b.velocity.y);
    const settled = speed < SETTLE_V && Math.abs(b.angularVelocity) < 0.04;
    if (settled) {
      if (!this.settleAt) this.settleAt = now;
      else if (now - this.settleAt > SETTLE_MS) {
        // it landed and rested → count it
        b.plugin.placed = true;
        this.score++;
        this.cb.onScore(this.score);
        playPlace(this.score);
        this.burst(b.position.x, b.position.y - BLOCK_H / 2, b.plugin.st.color);
        this.shake(Math.min(5, 2 + this.score * 0.1));
        // recompute tower top from all placed blocks
        this.recomputeTop();
        this.dropping = null;
        this.spawnReadyAt = now + 140;
      }
    } else {
      this.settleAt = 0;
    }
  }

  private recomputeTop() {
    let top = BASE_TOP_Y;
    for (const b of this.blocks()) {
      if (!b.plugin.placed) continue;
      const t = b.bounds.min.y;
      if (t < top) top = t;
    }
    this.towerTopY = top;
  }

  private checkCollapse(now: number) {
    if (this.gameOver) return;
    for (const b of this.blocks()) {
      // fell off into the void
      if (b.position.y > VOID_Y) { this.collapse(); return; }
      // a placed block tilted past the topple angle for too long
      if (b.plugin.placed) {
        if (Math.abs(b.angle) > TOPPLE_ANGLE) {
          if (!b.plugin.tiltSince) b.plugin.tiltSince = now;
          else if (now - b.plugin.tiltSince > TOPPLE_GRACE) { this.collapse(); return; }
        } else {
          b.plugin.tiltSince = 0;
        }
      }
    }
  }

  private collapse() {
    this.gameOver = true;
    this.shake(10);
    playGameOver();
    this.cb.onGameOver();
  }

  // how far the tower is currently leaning (0 = plumb, 1 = about to go)
  leanRatio() {
    let topB: BlockBody | null = null;
    let minY = Infinity;
    for (const b of this.blocks()) {
      if (b.plugin.placed && b.position.y < minY) { minY = b.position.y; topB = b; }
    }
    if (!topB) return 0;
    const off = Math.abs(topB.position.x - BASE_CX);
    return Math.max(0, Math.min(1, off / (BASE_W * 1.6)));
  }

  private shake(m: number) { this.shakeMag = Math.max(this.shakeMag, m); }

  private burst(x: number, y: number, color: string) {
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 2.6;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.2, life: 0, max: 22 + Math.random() * 12, color });
    }
  }

  private loop(ts: number) {
    const dt = this.lastTs ? Math.min(33, ts - this.lastTs) : 16;
    this.lastTs = ts;
    const now = performance.now();

    if (this.started && !this.gameOver) {
      this.swingPhase += this.swingSpeed() * (dt / 16.67);
      Matter.Engine.update(this.engine, dt);
      this.updateDropping(now);
      if (!this.held && !this.dropping && now >= this.spawnReadyAt) this.nextHeld();
      this.checkCollapse(now);
    } else if (this.gameOver) {
      Matter.Engine.update(this.engine, dt); // let it tumble
    }

    this.updateCam(dt);
    this.updateParticles();
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  private updateCam(dt: number) {
    const anchor = (this.held || this.dropping) ? this.heldWorldY() : this.towerTopY - DROP_GAP;
    const target = anchor - HOLD_SCREEN_Y;
    const k = 1 - Math.pow(0.0001, dt / 1000);
    this.camY += (target - this.camY) * Math.min(1, k * 3);
  }

  private updateParticles() {
    this.particles = this.particles.filter(p => p.life < p.max);
    for (const p of this.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.16; p.vx *= 0.98; p.life++; }
    if (this.shakeMag > 0.1) this.shakeMag *= 0.85; else this.shakeMag = 0;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.canvas.width = WORLD_W * dpr;
    this.canvas.height = WORLD_H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private drawBlock(x: number, y: number, w: number, angle: number, st: Stressor, label: string, ghost = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = ghost ? 0.55 : 1;
    const h = BLOCK_H, r = 5;
    // body
    ctx.fillStyle = st.color;
    if (!ghost) { ctx.shadowColor = '#00000033'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; }
    roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    // top highlight strip
    ctx.fillStyle = '#ffffff2e';
    roundRect(ctx, -w / 2, -h / 2, w, h * 0.4, r);
    ctx.fill();
    // label
    ctx.fillStyle = '#20202a';
    ctx.font = '800 15px -apple-system, "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    ctx.save();
    if (this.shakeMag > 0) ctx.translate((Math.random() * 2 - 1) * this.shakeMag, (Math.random() * 2 - 1) * this.shakeMag);
    // world → screen: subtract camera
    ctx.translate(0, -this.camY);

    // base pedestal
    const danger = this.leanRatio();
    ctx.fillStyle = '#3a3a48';
    roundRect(ctx, BASE_CX - BASE_W / 2, BASE_TOP_Y, BASE_W, BASE_H, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff14';
    roundRect(ctx, BASE_CX - BASE_W / 2, BASE_TOP_Y, BASE_W, 7, 6);
    ctx.fill();
    // plumb line from base center (faint), turns warm when leaning
    ctx.strokeStyle = danger > 0.6 ? '#ff5d6c66' : '#ffffff12';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 7]);
    ctx.beginPath();
    ctx.moveTo(BASE_CX, BASE_TOP_Y);
    ctx.lineTo(BASE_CX, this.towerTopY - DROP_GAP - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // placed + falling blocks
    for (const b of this.blocks()) {
      this.drawBlock(b.position.x, b.position.y, b.plugin.w, b.angle, b.plugin.st, b.plugin.label);
    }

    // particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;

    // the held (swinging) block + its hook
    if (this.started && !this.gameOver && this.held) {
      const x = this.heldX();
      const y = this.heldWorldY();
      // hook line up to the top of the visible area
      ctx.strokeStyle = '#ffffff2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, this.camY);
      ctx.lineTo(x, y - BLOCK_H / 2);
      ctx.stroke();
      this.drawBlock(x, y, this.held.w, 0, this.held.st, this.held.label);
      // drop guide
      ctx.strokeStyle = '#ffffff18';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(x, y + BLOCK_H / 2);
      ctx.lineTo(x, this.towerTopY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
