import { Pair } from './pair';

export class Drag {

  /**
   * 拖动
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { Pair<number> } options.point 配置
   */
  constructor(options) {
    const { id, point } = options;

    /**
     * 动作 id
     * 
     * @type { number }
     */
    this.id = id;

    /**
     * 拖动坐标点
     * 
     * @type { Pair<number> }
     */
    this.point = point;

    /**
     * 拖动偏移量
     * 
     * @type { Pair<number> }
     */
    this.offset = new Pair(0, 0);
  }

}
