import { Base } from './Base';
import { Data, Database } from 'dsc.db';
import { Util } from './Util';
export class Levels extends Base {
  private db: Database;
  constructor(options: LevelsOptions) {
    super(options);

    this.db = new Database({
      ...options,
      collection: 'levels',
    });
  }

  public ensure(userID: string, guildID?: string): Promise<User> {
    return new Promise(async (resolve) => {
      if (typeof userID !== 'string') throw new Error('userID should be a string');
      if (guildID && typeof guildID !== 'string') throw new Error('guildID should be a string');

      let raw = await this.fetch(userID, guildID);

      if (!raw) {
        let { data } = await this.db.set(Util.key(userID, guildID), {
          userID: userID,
          guildID: guildID,
          voiceXp: 0,
          voiceLevel: 0,
          textXp: 0,
          textLevel: 0,
        });
        raw = data;
      }

      return resolve(raw as User);
    });
  }

  public fetch(userID: string, guildID?: string): Promise<User | null> {
    return new Promise(async (resolve) => {
      if (typeof userID !== 'string') throw new Error('userID should be a string');
      if (guildID && typeof guildID !== 'string') throw new Error('guildID should be a string');
      let raw: Data | null;
      if (userID && guildID) {
        raw = await this.db.fetch({ 'data.userID': userID, 'data.guildID': guildID });
      } else {
        raw = await this.db.fetch({ 'data.userID': userID });
      }
      if (!raw) raw = null;
      return resolve(raw?.data);
    });
  }

  public leaderboard(options: LeaderboardOptions): Promise<LeaderboardUser[]> {
    return new Promise(async (resolve) => {
      let query = typeof options.guildID !== 'string' ? {} : { 'data.guildID': options.guildID };
      let raw: Data[] = await this.db.schema.find(query);
      let arr: LeaderboardUser[] = [];
      let sorter = (a: Data, b: Data) => b.data.textXp - a.data.textXp;
      if (options.type === 'VOICE') {
        sorter = (a: Data, b: Data) => b.data.voiceXp - a.data.voiceXp;
      }

      raw.sort(sorter).forEach((user, i) => {
        arr.push({
          pos: i + 1,
          textLevel: user.data.textLevel,
          textXp: user.data.textXp,
          voiceLevel: user.data.voiceLevel,
          voiceXp: user.data.voiceXp,
          userID: user.data.userID,
          guildID: user.data.guildID ?? null,
        });
      });

      if (typeof options.limit === 'number' && options.limit > 0) return resolve(arr.slice(0, options.limit));
      return resolve(arr);
    });
  }

  public update(userID: string, type: TypeXP, xp: number, guildID?: string, cb?: LevelUpCB): Promise<User> {
    return new Promise(async (resolve) => {
      if (typeof userID !== 'string') throw new Error('userID should be string');
      if (typeof type !== 'string' && ['TEXT', 'VOICE'].includes(type)) throw new Error('type should be TEXT or VOICE');
      if (typeof xp !== 'number') throw new Error('XP should be type number');
      if (guildID && typeof guildID !== 'string') throw new Error('guildID should be string');
      if (cb && typeof cb !== 'function') throw new Error('Callback parameter should be a function');

      let data = await this.ensure(userID, guildID);
      let key = Util.key(userID, guildID);
      switch (type) {
        case 'TEXT':
          {
            let nxp = Util.getNeededXP(data.textLevel, data.textXp);
            let raw = (await this.db.add(key + '.textXp', xp)) as Data;
            if (raw.data.textXp >= nxp) {
              await this.db.add(key + '.textLevel', 1);
              data = (await this.fetch(userID, guildID)) as User;
              this.emit('textLevelUp', data);
              if (cb) cb(data);
            }
          }
          break;
        case 'VOICE':
          {
            let nxp = Util.getNeededXP(data.voiceLevel, data.voiceXp);
            let raw = (await this.db.add(key + '.voiceXp', xp)) as Data;
            if (raw.data.voiceXp >= nxp) {
              await this.db.add(key + '.voiceLevel', 1);
              data = (await this.fetch(userID, guildID)) as User;
              this.emit('voiceLevelUp', data);
              if (cb) cb(data);
            }
          }
          break;
      }
    });
  }
}

export interface LevelsOptions {
  /** MongoDB connection uri */
  uri: string;
  /** Name of your database */
  name: string;
  /** Your mongodb user */
  user: string;
  /** Your mongodb user pass */
  pass: string;
}

export interface LevelUpCB {
  (user: User): Promise<any> | any;
}

export type TypeXP = 'VOICE' | 'TEXT';

export interface User {
  userID: string;
  guildID: string | null;
  voiceXp: number;
  voiceLevel: number;
  textXp: number;
  textLevel: number;
}

export interface LeaderboardOptions {
  type: TypeXP;
  guildID?: string;
  limit?: number;
}
export interface LeaderboardUser extends User {
  pos: number;
}

export interface LevelUp extends User {
  levelUp: boolean;
}
