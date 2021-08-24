import { EventEmitter } from 'events';
import { LevelsOptions } from './Levels';
import { Util } from './Util';

export class Base extends EventEmitter {
  public options: LevelsOptions;
  public util: Util;
  constructor(options: LevelsOptions) {
    super();

    this.options = options;
    this.util = Util;
  }
}
