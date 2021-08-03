import { Database } from "dsc.db";
import { Base } from "./Base";
import _ from 'lodash';

export class Levels extends Base {
  public db: Database;
  public defaultData: User;
  constructor(options: LevelsOptions) {
    super();

    this.defaultData = {
      xp: 0,
      level: 1,
    }

    this.db = new Database({
      mongoURL: options.mongoURL,
      collection: 'LEVELS',
      connectionOptions: {
        pass: options.mongoPass,
        user: options.mongoUser,
      },
      defaultData: this.defaultData,
    });
  }

  public fetch(userID: string): Promise<User> {
    return new Promise(async (resolve) => {
      let data = await this.db.ensure(userID);
      resolve(data);
    });
  }

  public leaderboard(limit?: number): Promise<LeaderboardUser[]> {
    return new Promise(async (resolve) => {
      let data = await this.db.all();
      let arr: LeaderboardUser[] = [];
      data.sort((a, b) => b.data.xp - a.data.xp).forEach((obj, i) => {
        arr.push({
          pos: i + 1,
          xp: obj.data.xp,
          level: obj.data.level,
          userID: obj.ID,
        })
      });
      if(typeof limit === 'number' && limit > 0) resolve(arr.slice(0, limit));
      resolve(arr);
    });
  }

  public add(userID: string, xp?: number): Promise<User> {
    return new Promise(async (resolve, reject) => {
      if(typeof userID !== 'string') return reject('userID must be provided and string type');
      if(typeof xp !== 'number') return reject('You should provide xp parameter!');
      let data: User = await this.db.ensure(userID);

      if(!isNaN(xp)) return reject(`Xp isn't a valid number`);

      let neededXP = this.getNeededXP(data.level);
      data = await this.db.add(`${userID}.xp`, xp);
      if(data.xp >= neededXP) {
        await this.db.add(`${userID}.level`, 1);
        await this.db.subtract(`${userID}.xp`, neededXP);
        this.emit('levelup', userID, data);
      }
      return resolve(data);
    });
  }
}

export interface User {
  xp: number;
  level: number;
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