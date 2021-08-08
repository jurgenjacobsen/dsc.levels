import { Data, Database } from "dsc.db";
import { Base } from "./Base";

export class Levels extends Base {
  public db: Database;
  public defaultData: User;
  constructor(options: LevelsOptions) {
    super();

    this.defaultData = {
      voiceXp: 0,
      voiceLevel: 1,
      textXp: 0,
      textLevel: 1,
    }

    this.db = new Database({
      mongoURL: options.mongoURL,
      collection: 'levels',
      mongoPass: options.mongoPass,
      mongoUser: options.mongoUser,
      defaultData: this.defaultData,
    });
  }

  public fetch(userID: string): Promise<User> {
    return new Promise(async (resolve) => {
      let data = await this.db.ensure(userID);
      resolve(data);
    });
  }

  public leaderboard(type: XPType, limit?: number): Promise<LeaderboardUser[]> {
    return new Promise(async (resolve) => {
      let data = await this.db.all();
      let arr: LeaderboardUser[] = [];
      let fn = (a: Data, b: Data) => b.data.textXp - a.data.textXp;

      if(type === 'VOICE') {
        fn = (a: Data, b: Data) => b.data.voiceXp - a.data.voiceXp;
      };

      data.sort(fn).forEach((obj, i) => {
        arr.push({
          pos: i + 1,
          textXp: obj.data.textXp,
          textLevel: obj.data.textLevel,
          voiceLevel: obj.data.voiceLevel,
          voiceXp: obj.data.voiceXp,
          userID: obj.ID,
        });
      });
      if(typeof limit === 'number' && limit > 0) resolve(arr.slice(0, limit));
      resolve(arr);
    });
  }

  public add(userID: string, type: XPType, xp: number, lvlCB?: levelUpCB): Promise<User> {
    return new Promise(async (resolve, reject) => {
      if(typeof userID !== 'string') return reject('userID must be provided and string type');
      if(typeof xp !== 'number') return reject('You should provide xp parameter!');
      let data: User = await this.db.ensure(userID);

      if(type === 'TEXT') {
        let neededXP = this.getNeededXP(data.textLevel);
        data = await this.db.add(`${userID}.textXp`, xp);
        if(data.textXp >= neededXP) {
          await this.db.add(`${userID}.textLevel`, 1);
          await this.db.subtract(`${userID}.textXp`, neededXP);
          this.emit('levelup', type, userID, data);
          if(lvlCB) lvlCB('TEXT', data);
        }
        return resolve(data);
      } else if(type === 'VOICE') {
        let neededXP = this.getNeededXP(data.voiceLevel);
        data = await this.db.add(`${userID}.voiceXp`, xp);
        if(data.textXp >= neededXP) {
          await this.db.add(`${userID}.voiceLevel`, 1);
          await this.db.subtract(`${userID}.voiceXp`, neededXP);
          this.emit('levelup', type, userID, data);
          if(lvlCB) lvlCB('VOICE', data);
        }
        return resolve(data);
      }
    });
  }
}

export interface User {
  voiceXp: number;
  voiceLevel: number;
  textXp: number;
  textLevel: number;
}

export interface LeaderboardUser extends User {
  pos: number;
  userID: string;
}

export interface LevelsOptions  {
  mongoURL: string;
  mongoUser: string;
  mongoPass: string;
}

export type XPType = 'VOICE' | 'TEXT';

export interface levelUpCB {
  (type: XPType, data: User): Promise<void | any>;
}