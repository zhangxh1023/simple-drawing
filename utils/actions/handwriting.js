import { DPR } from '../util';
import { Pair } from './pair';

/**
 * 手写线条 / 橡皮擦
 */
export class Handwriting {

  /**
   * 手写线条
   * 
   * @param { object } options 路径配置
   * @param { number } options.actionVersion 动作 version
   * @param { string } options.ctxColor ctx 颜色
   * @param { number } options.width 画笔宽度
   */
  constructor(options) {
    const { actionVersion, ctxColor, width } = options;
    /**
     * 手写绘画轨迹坐标点
     * 存储的是 1 倍缩放，基于画板左上角顶点坐标的坐标点
     * 
     * @type { Pair<number>[] } 坐标点列表，points[0] 为第一个坐标点, first: x, second: y
     */
    this.points = [];

    /**
     * 动作 id
     * 
     * @type { number }
     */
    this.actionVersion = actionVersion;

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
    this.width = width;
  }

  /**
   * 增加手写绘画轨迹坐标点
   * 手写坐标点不用考虑画到屏幕外面的情况
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.ctx 画板 context
   * @param { Pair<number> } options.point 坐标点
   */
  addPoint(options) {
    const { ctx, point } = options;
    this.points.push(point);
    const currPoint = this.points[this.points.length - 1];
    if (this.points.length == 1) {
      ctx.beginPath();
      ctx.strokeStyle = this.ctxColor;
      ctx.lineWidth = this.width;
      ctx.lineJoin = 'round';
      ctx.moveTo(Math.round(currPoint.first), Math.round(currPoint.second));
    } else {
      ctx.lineTo(Math.round(currPoint.first), Math.round(currPoint.second));
      ctx.stroke();
    }
  }

  /**
   * 重新绘制线条
   * 只绘制当前屏幕中的，超出屏幕的部分跳过
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.ctx 画板 context
   * @param { Pair<number> } options.boardSize board size
   * @param { Pair<number> } options.offset offset 偏移
   * @param { boolean } options.isReDrawAll 是否是全部重绘，如果是全部重绘，就不需要调用 beginPath / stroke
   */
  reDraw(options) {
    const { ctx, boardSize, offset, isReDrawAll } = options;
    if (!this.points.length) return;

    if (!isReDrawAll) ctx.beginPath();
    const scale = boardSize.first / ctx.canvas.width;
    ctx.strokeStyle = this.ctxColor;
    ctx.lineWidth = scale * this.width;
    ctx.lineJoin = 'round';

    let isStart = false;
    let offsetX = 0;
    let offsetY = 0;
    offsetX -= (boardSize.first - ctx.canvas.width) / 2 / DPR;
    offsetY -= (boardSize.second - ctx.canvas.height) / 2 / DPR;
    if (offset) {
      offsetX += offset.first;
      offsetY += offset.second;
    }

    for (const item of this.points) {
      // 跳过超出屏幕的坐标点
      if (!isStart) {
        ctx.moveTo(Math.round(item.first * scale) + offsetX, Math.round(item.second * scale) + offsetY);
        isStart = true;
      } else {
        ctx.lineTo(Math.round(item.first * scale) + offsetX, Math.round(item.second * scale) + offsetY);
        if (!isReDrawAll) ctx.stroke();
      }
    }
  }

};
