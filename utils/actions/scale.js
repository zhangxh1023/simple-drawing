import { Pair } from './pair';

export class Scale {

  /**
   * 缩放当前画面
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { CanvasRenderingContext2D } options.ctx
   * @param { number } options.originScale
   * @param { HTMLCanvasElement } options.boardCanvas
   */
  constructor(options) {

    const { id, ctx, originScale, boardCanvas } = options;

    /**
     * 缩放倍数，大于 0， 0.5 代表缩小为 50%，1 为 100%，2 为放大为 200%
     * 
     * @type {number}
     */
    this.currentScale = 1;

    /**
     * 动作 id
     * 
     * @type { number }
     */
    this.id = id;

    /**
     * canvas context
     * 
     * @type { CanvasRenderingContext2D }
     */
    this.ctx = ctx;

    /**
     * 执行缩放前，全局的缩放倍数
     * @type { number }
     */
    this.originScale = originScale;

    /**
     * 上一次缩放的倍数
     * 
     * @type { number }
     */
    this.prevScale = 1;
  }

  /**
   * @param {number} scale 缩放倍数
   */
  record(scale) {
    this.prevScale = this.currentScale;
    this.currentScale = scale;
  }

  draw() {
    // 计算缩放倍数
    const scale = this.currentScale / this.originScale / this.prevScale;
    this.ctx.scale(scale, scale);
  }

};
