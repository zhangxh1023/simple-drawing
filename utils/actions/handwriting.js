import { Pair } from './pair';

export class Handwriting {

  /**
   * 手写路径
   * 
   * @param { object } options 路径配置
   * @param { number } options.id 动作 id
   * @param { string } options.ctxColor ctx 颜色
   * @param { number } options.lineWidth 画笔粗细
   * @param { CanvasRenderingContext2D } options.ctx ctx
   */
  constructor(options) {
    const { id, ctxColor, lineWidth, ctx } = options;
    /**
     * 手写绘画轨迹坐标点
     * 
     * @type { Pair<number>[] } 坐标点列表，track[0] 为第一个坐标点
     */
    this.track = [];

    /**
     * 动作 id
     * 
     * @type { number }
     */
    this.id = id;

    /**
     * ctx 颜色
     * 
     * @type { string }
     */
    this.ctxColor = ctxColor;

    /**
     * 画笔粗细
     * 
     * @type { number }
     */
    this.lineWidth = lineWidth;

    /**
     * ctx
     * 
     * @type { CanvasRenderingContext2D } ctx;
     */
    this.ctx = ctx;

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.ctxColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineJoin = 'round';
  }

  draw() {
    if (!this.track.length) return;

    const currPoint = this.track[this.track.length - 1];

    // 如果是第一个点，就先移动到当前点
    // 否则直接从上一个点继续 lineTo
    if (this.track.length == 1) {
      this.ctx.moveTo(Math.round(currPoint.first), Math.round(currPoint.second));
    }

    this.ctx.lineTo(Math.round(currPoint.first), Math.round(currPoint.second));
    this.ctx.stroke();
  }

  reDraw() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.ctxColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineJoin = 'round';
    let startFlag = false;
    for (const item of this.track) {
      if (!startFlag) {
        this.ctx.moveTo(Math.round(item.first), Math.round(item.second));
        startFlag = true;
      }
      this.ctx.lineTo(Math.round(item.first), Math.round(item.second));
      this.ctx.stroke();
    }
  }

  /**
   * 增加手写绘画轨迹坐标点
   * 
   * @param {Pair<number>} point 坐标点
   */
  exec(point) {
    this.track.push(point);
    this.draw();
  }
};
