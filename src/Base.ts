import EventEmitter from "events";

export class Base extends EventEmitter {
  constructor() {
    super()
  }

  public getNeededXP(lvl: number): number {
    return (lvl * lvl * 100);
  };

  public getLevelFromXp(xp: number):number {
    return (Math.sqrt(xp / 100));
  }

  public random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}