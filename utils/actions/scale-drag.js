import { Pair } from './pair';

export class ScaleDrag {

  /**
   * 缩放 / 拖动当前画面
   * 
   * @param { object } options 配置
   * @param { number } options.actionVersion 动作 versoin
   * @param { number } options.scaleDistance 缩放的两指距离
   * @param { Pair<number> } options.dragCenter 拖动的中心点坐标
   * @param { Pair<number> } options.prevBoardSize 执行缩放之前的 board size
   */
  constructor(options) {

    const { actionVersion, scaleDistance, dragCenter, prevBoardSize } = options;

    /**
     * 动作 version
     * 
     * @type { number }
     */
    this.actionVersion = actionVersion;

    /**
     * 缩放的两指距离
     * 
     * @type { number }
     */
    this.scaleDistance = scaleDistance;

    /**
     * 拖动的中心点坐标
     * 
     * @type { Pair<number> }
     */
    this.dragCenter = dragCenter;

    /**
     * 执行缩放之前的 board size
     * 
     * @type { Pair<number> }
     */
    this.prevBoardSize = prevBoardSize;
  }
};
