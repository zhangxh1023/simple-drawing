
export class Eraser {

  /**
   * 橡皮擦
   * 
   * @param {object} options 
   * @param { number } options.actionVersion 动作 version
   * @param { number } options.width 橡皮擦宽度
   * @param { string } options.ctxColor ctx 橡皮擦/背景 颜色
   */
  constructor(options) {
    const { actionVersion, width, ctxColor } = options;

    /**
     * 橡皮擦擦除轨迹坐标点
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
   * 增加橡皮擦轨迹坐标点
   * 手写橡皮擦坐标点不用考虑画到屏幕外面的情况
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
   * 橡皮擦
   * 绘制背景色线条
   * 只绘制当前屏幕中的，超出屏幕的部分跳过
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.ctx 画板 context
   * @param { number } options.scale 当前的缩放比例
   * @param { Pair<number> } options.boardLeftTopVertex 当前 board 左上角顶点坐标
   * @param { Pair<number> } options.canvasSize canvas大小 first: width, second: height
   */
  reDraw(options) {
    const { ctx, scale, boardLeftTopVertex, canvasSize } = options;
    if (!this.points.length) return;

    ctx.beginPath();
    ctx.strokeStyle = this.ctxColor;
    ctx.lineWidth = scale * this.width;
    ctx.lineJoin = 'round';

    let isStart = false;
    for (const item of this.points) {
      // 跳过超出屏幕的坐标点

      if (!isStart) {
        ctx.moveTo(Math.round(item.first), Math.round(item.second));
        isStart = true;
      } else {
        ctx.lineTo(Math.round(item.first), Math.round(item.second));
        ctx.stroke();
      }
    }
  }

}
