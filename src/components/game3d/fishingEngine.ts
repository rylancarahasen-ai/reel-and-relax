import * as THREE from 'three';
import { rollFish, RolledFish, WEATHER_BITE_RATE } from './fishData';

export type Phase =
  | 'idle'
  | 'charging'
  | 'flying'
  | 'waiting'
  | 'bite'
  | 'hooked'
  | 'landed'
  | 'lost';

export const WATER_Y = -0.35;

export interface Landed extends RolledFish {
  distance: number;
  fightTime: number;
  weather: string;
}

export interface HudState {
  phase: Phase;
  power: number;
  tension: number;
  progress: number;
  distance: number;
  message: string;
  landed: Landed | null;
  hookedName: string;
}

const EMPTY_HUD: HudState = {
  phase: 'idle',
  power: 0,
  tension: 0,
  progress: 0,
  distance: 0,
  message: '',
  landed: null,
  hookedName: '',
};

export class FishingEngine {
  phase: Phase = 'idle';
  power = 0;
  tension = 0;
  progress = 0;
  distance = 0;
  message = '';
  landed: Landed | null = null;
  fish: RolledFish | null = null;

  bobber = new THREE.Vector3(0, WATER_Y, -8);
  velocity = new THREE.Vector3();
  bobberVisible = false;
  splash = 0;

  weather = 'sunset';
  reeling = false;

  private biteTimer = 0;
  private biteWindow = 0;
  private overTension = 0;
  private slackTime = 0;
  private fightTime = 0;
  private phaseTimer = 0;
  private clock = 0;
  private anchor = new THREE.Vector3(0, WATER_Y, -8);
  private playerPos = new THREE.Vector3();

  onLanded: ((fish: Landed) => void) | null = null;
  onEvent: ((event: 'hooked' | 'snapped' | 'escaped' | 'cast') => void) | null = null;

  /** rod animation values consumed by the first-person rod view */
  rodCharge = 0;
  rodSwing = 0;
  rodBend = 0;

  startCharge() {
    if (this.phase !== 'idle') return;
    this.phase = 'charging';
    this.power = 0;
    this.message = '';
  }

  releaseCharge(camera: THREE.Camera) {
    if (this.phase !== 'charging') return;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = Math.max(dir.y, -0.05);
    dir.normalize();

    this.bobber.copy(camera.position).addScaledVector(dir, 1.2);
    this.velocity
      .copy(dir)
      .multiplyScalar(10 + this.power * 26)
      .add(new THREE.Vector3(0, 3.5 + this.power * 5, 0));
    this.bobberVisible = true;
    this.rodSwing = 1;
    this.phase = 'flying';
    this.onEvent?.('cast');
  }

  /** left click while a fish is biting */
  strike() {
    if (this.phase === 'bite') {
      this.phase = 'hooked';
      this.tension = 0.45;
      this.progress = 0;
      this.fightTime = 0;
      this.overTension = 0;
      this.slackTime = 0;
      this.message = 'Hooked! Keep the line in the green.';
      this.onEvent?.('hooked');
      return true;
    }
    return false;
  }

  reset() {
    this.phase = 'idle';
    this.power = 0;
    this.tension = 0;
    this.progress = 0;
    this.bobberVisible = false;
    this.fish = null;
    this.landed = null;
    this.message = '';
    this.rodBend = 0;
  }

  private fail(message: string, event: 'snapped' | 'escaped') {
    this.phase = 'lost';
    this.message = message;
    this.phaseTimer = 2.4;
    this.bobberVisible = false;
    this.fish = null;
    this.tension = 0;
    this.rodBend = 0;
    this.onEvent?.(event);
  }

  update(dt: number, camera: THREE.Camera) {
    this.clock += dt;
    this.playerPos.copy(camera.position);
    if (this.splash > 0) this.splash = Math.max(0, this.splash - dt * 1.6);
    this.rodSwing = Math.max(0, this.rodSwing - dt * 3.5);
    this.rodCharge += ((this.phase === 'charging' ? this.power : 0) - this.rodCharge) * Math.min(1, dt * 8);

    switch (this.phase) {
      case 'charging':
        this.power = Math.min(1, this.power + dt * 0.95);
        break;

      case 'flying': {
        this.velocity.y -= 16 * dt;
        this.bobber.addScaledVector(this.velocity, dt);
        if (this.bobber.y <= WATER_Y) {
          this.bobber.y = WATER_Y;
          this.anchor.copy(this.bobber);
          this.splash = 1;
          this.distance = this.bobber.distanceTo(this.playerPos);
          const inWater = this.bobber.z < 6.5;
          if (!inWater) {
            this.fail('The lure hit dry land. Cast toward the lake.', 'escaped');
            break;
          }
          this.phase = 'waiting';
          const rate = WEATHER_BITE_RATE[this.weather] ?? 1;
          const distanceBonus = Math.min(0.5, this.distance / 90);
          this.biteTimer = (2.5 + Math.random() * 8) * rate * (1 - distanceBonus);
          this.fish = rollFish(this.weather, this.distance);
          this.message = 'Line is out. Watch the bobber.';
        }
        break;
      }

      case 'waiting': {
        this.bobber.y = WATER_Y + Math.sin(this.clock * 2) * 0.05;
        this.biteTimer -= dt;
        if (this.biteTimer <= 0) {
          this.phase = 'bite';
          this.biteWindow = 1.5;
          this.message = 'BITE! Click to set the hook!';
        }
        break;
      }

      case 'bite': {
        this.bobber.y = WATER_Y - 0.18 + Math.sin(this.clock * 22) * 0.12;
        this.biteWindow -= dt;
        if (this.biteWindow <= 0) {
          this.fail('It spat the lure and swam off.', 'escaped');
        }
        break;
      }

      case 'hooked': {
        const fish = this.fish!;
        this.fightTime += dt;
        const pull =
          fish.strength * (0.55 + 0.45 * Math.sin(this.clock * (2.2 + fish.strength)) * Math.sin(this.clock * 0.8));

        this.tension += (this.reeling ? 0.85 : -0.75) * dt + Math.max(0, pull) * dt * 0.55;
        this.tension = THREE.MathUtils.clamp(this.tension, 0, 1.25);
        this.rodBend = this.tension;

        if (this.tension > 0.92) {
          this.overTension += dt;
          if (this.overTension > 1.3) {
            this.fail('The line snapped under the strain.', 'snapped');
            break;
          }
        } else {
          this.overTension = Math.max(0, this.overTension - dt * 0.6);
        }

        if (this.tension < 0.16) {
          this.slackTime += dt;
          if (this.slackTime > 2.6) {
            this.fail('Too much slack — the hook slipped free.', 'escaped');
            break;
          }
        } else {
          this.slackTime = Math.max(0, this.slackTime - dt);
        }

        if (this.reeling && this.tension >= 0.22 && this.tension <= 0.92) {
          this.progress = Math.min(1, this.progress + (dt * 0.3) / (0.6 + fish.strength * 0.55));
        } else if (!this.reeling) {
          this.progress = Math.max(0, this.progress - dt * 0.05);
        }

        // pull the bobber toward the player as the fight is won
        const target = new THREE.Vector3(this.playerPos.x, WATER_Y, Math.min(this.playerPos.z - 1.5, 5.5));
        this.bobber.lerpVectors(this.anchor, target, this.progress);
        this.bobber.x += Math.sin(this.clock * 5) * 0.35 * (1 - this.progress);
        this.bobber.y = WATER_Y - 0.1 + Math.sin(this.clock * 9) * 0.08;

        if (this.progress >= 1) {
          const landed: Landed = {
            ...fish,
            distance: Math.round(this.distance),
            fightTime: Math.round(this.fightTime * 10) / 10,
            weather: this.weather,
          };
          this.landed = landed;
          this.phase = 'landed';
          this.bobberVisible = false;
          this.rodBend = 0;
          this.message = '';
          this.onLanded?.(landed);
        }
        break;
      }

      case 'lost': {
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) this.reset();
        break;
      }
    }
  }

  readHud(prev: HudState): HudState {
    const next: HudState = {
      phase: this.phase,
      power: Math.round(this.power * 100) / 100,
      tension: Math.round(this.tension * 100) / 100,
      progress: Math.round(this.progress * 100) / 100,
      distance: Math.round(this.distance),
      message: this.message,
      landed: this.landed,
      hookedName: this.phase === 'hooked' ? this.fish?.species ?? '' : '',
    };
    const same =
      prev.phase === next.phase &&
      prev.power === next.power &&
      prev.tension === next.tension &&
      prev.progress === next.progress &&
      prev.distance === next.distance &&
      prev.message === next.message &&
      prev.landed === next.landed &&
      prev.hookedName === next.hookedName;
    return same ? prev : next;
  }
}

export const INITIAL_HUD = EMPTY_HUD;
