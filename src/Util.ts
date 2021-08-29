export class Util {
  constructor() {
    throw new Error('Util can not be instantiated');
  }

  public static getNeededXP(lvl: number, xp: number): number {
    return 5 * (lvl ^ 2) + 50 * lvl + 100;
  }

  public static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public static key(userID: string, guildID?: string): string {
    return `${userID}${guildID ? `_${guildID}` : ''}`;
  }
}
