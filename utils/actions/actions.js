import { Handwriting } from './handwriting';
import { Pair } from './pair';
import { Scale } from './scale';

/**
 * |--------------------|
 * |       board        |
 * |     |--------|     |
 * |     |-canvas-|     |
 * |     |--------|     |
 * |                    |
 * |--------------------|
 */

export class Actions {

  /**
   * 绘画动作
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.boardCtx 画板 canvas context
   */
  constructor(options) {
    const { boardCtx } = options;

    /**
     * 已经提交的动作列表，commitActions[0] 为第一次执行的动作
     * 
     * @type { Handwriting | Scale[] }
     */
    this.commitActions = [];

    /**
     * 已经回退的动作列表，rollbackActions[0] 为第一次回退的动作
     * 
     * @type { Handwriting | Scale[] }
     */
    this.rollbackActions = [];

    /**
     * 画板 canvas context
     * 
     * @type { CanvasRenderingContext2D }
     */
    this.boardCtx = boardCtx;

    /**
     * 离屏 canvas 对象
     * 
     * @type { HTMLCanvasElement }
     */
    this.offScreenCanvas = wx.createOffscreenCanvas({
      type: '2d',
      width: this.boardCtx.canvas.width,
      height: this.boardCtx.canvas.height
    });

    /**
     * 离屏 canvas context
     * 
     * @type { CanvasRenderingContext2D }
     */
    this.offScreenCtx = this.offScreenCanvas.getContext('2d');

    /**
     * 当前的缩放倍数
     * 
     * @type { number }
     */
    this.currentScale = 1;

    /**
     * 当前的缩放动作
     * 
     * @type { Scale | null }
     */
    this.currentScaleAction = null;

    /**
     * 当前画板左上角顶点坐标
     * 
     * @type { Pair<number> }
     */
    this.currentLeftTopVertex = new Pair(0, 0);

    /**
     * dpr
     * 
     * @type { number }
     */
    this.dpr = wx.getSystemInfoSync().pixelRatio;

    /**
     * 离屏 canvas 图像
     * 
     * @type { HTMLImageElement | null }
     */
    this.offScreenImage = null;
  }

  /**
   * 执行手写笔画动作
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { number } options.x 坐标点 x
   * @param { number } options.y 坐标点 y
   * @param { string } options.ctxColor ctx 颜色
   * @param { number } options.lineWidth 画笔粗细
   */
  execHandWriting(options) {
    const { id, x, y, ctxColor, lineWidth } = options;
    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting && lastAction.id === id) {
        lastAction.addPoint({
          ctx: this.boardCtx,
          point: new Pair(x, y)
        });
        return;
      }
    }

    const handwriting = new Handwriting({
      id,
      ctxColor,
      lineWidth,
      ctx: this.boardCtx
    });
    handwriting.addPoint({
      ctx: this.boardCtx,
      point: new Pair(x, y)
    });
    this.commitActions.push(handwriting);
  }

  /**
   * 手写动作结束，复制 board context 动作到离屏 canvas 上
   * 后续执行缩放 / 拖动，可以使用离屏 canvas 快速生成图片
   */
  async endHandWriting() {
    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting) {
        lastAction.reDrawAll({
          ctx: this.offScreenCtx,
          scale: 1,
          boardLeftTopVertex: new Pair(0, 0),
          canvasSize: new Pair(this.boardCtx.canvas.width / this.dpr,
            this.boardCtx.canvas.height / this.dpr)
        });

        this.offScreenImage = await this.loadOffScreenCanvas()
      }
    }
  }

  /**
   * @todo 偏移 offset，缩放中心点
   * 执行缩放动作
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { number } options.scale 缩放倍数
   */
  async scale(options) {
    const { id, scale } = options;

    if (this.offScreenImage == null) return;

    if (this.currentScaleAction == null
      || this.currentScaleAction.id !== id) {
      this.currentScaleAction = new Scale({
        id,
        originScale: this.currentScale,
        image: this.offScreenImage,
      });
    }

    const globalScale = this.currentScaleAction.originScale * scale;
    if (globalScale < 1) {
      // 缩放倍数不能小于 1，否则无法填充满 canvas
      return;
    }
    this.currentScale = globalScale;

    this.boardCtx.clearRect(0,
      0,
      this.boardCtx.canvas.width / this.dpr,
      this.boardCtx.canvas.height / this.dpr
    );

    this.boardCtx.drawImage(
      this.currentScaleAction.image,
      ((this.boardCtx.canvas.width / this.dpr) - (this.boardCtx.canvas.width / this.dpr / this.currentScale)) / 2,
      ((this.boardCtx.canvas.height / this.dpr) - (this.boardCtx.canvas.height / this.dpr / this.currentScale)) / 2,
      this.boardCtx.canvas.width / this.dpr / this.currentScale,
      this.boardCtx.canvas.height / this.dpr / this.currentScale,
      0, 0,
      this.boardCtx.canvas.width / this.dpr,
      this.boardCtx.canvas.height / this.dpr
    );

    console.log(
      (this.boardCtx.canvas.width - (this.boardCtx.canvas.width / this.dpr / this.currentScale)) / 2,
      (this.boardCtx.canvas.height - (this.boardCtx.canvas.height / this.dpr / this.currentScale)) / 2,
      this.boardCtx.canvas.width / this.dpr / this.currentScale,
      this.boardCtx.canvas.height / this.dpr / this.currentScale,
      0, 0,
      this.boardCtx.canvas.width / this.dpr,
      this.boardCtx.canvas.height / this.dpr
    );
  }

  /**
   * 加载 离屏 canvas 为 Image 对象
   * 
   * @returns { Promise<HTMLImageElement> }
   */
  loadOffScreenCanvas() {
    return new Promise((resolve, reject) => {
      const image = this.offScreenCanvas.createImage();
      image.src = this.offScreenCtx.canvas.toDataURL('image/jpg');
      image.onload = () => {
        resolve(image);
      };
      image.onerror = (err) => {
        reject(err);
      };
    })
  }
};
