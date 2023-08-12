import { Pair } from './pair';

export class Scale {

  /**
   * 缩放当前画面
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { CanvasRenderingContext2D } options.ctx
   */
  constructor(options) {

    const { id, ctx } = options;

    /**
     * @type {number} 缩放倍数，大于 0， 0.5 代表缩小为 50%，1 为 100%，2 为放大为 200%
     */
    this.scale = [];

    /**
     * 动作 id
     * 
     * @type { number } id
     */
    this.id = id;

    /**
     * @type { CanvasRenderingContext2D } ctx
     */
    this.ctx = ctx;
  }

  /**
   * @param {number} scale 缩放倍数
   */
  record(scale) {
    this.scale = scale;
  }

  draw() {
    this.ctx.scale(this.scale, this.scale);
  }

};
