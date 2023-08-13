import { Handwriting } from './handwriting';
import { Pair } from './pair';
import { Scale } from './scale';

export class Actions {

  /**
   * 绘画动作
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.boardCtx 画板 canvas context
   * @param { HTMLCanvasElement } boardCanvas 画板 canvas 对象
   */
  constructor(options) {
    const { boardCtx, boardCanvas } = options;

    /**
     * 已经提交的动作列表，commitActions[0] 为第一次执行的动作
     * 
     * @type {Handwriting | Scale[]}
     */
    this.commitActions = [];

    /**
     * 已经回退的动作列表，rollbackActions[0] 为第一次回退的动作
     * 
     * @type {Handwriting[]}
     */
    this.rollbackActions = [];

    /**
     * 画板 canvas context
     * 
     * @type { CanvasRenderingContext2D }
     */
    this.boardCtx = boardCtx;

    /**
     * 画板 canvas 对象
     * 
     * @type { HTMLCanvasElement }
     */
    this.boardCanvas = boardCanvas;

    /**
     * 离屏 canvas 对象
     * 
     * @type { HTMLCanvasElement }
     */
    this.offScreenCanvas = wx.createOffscreenCanvas({
      type: '2d',
      width: this.boardCanvas.width,
      height: this.boardCanvas.height
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
     * @type {number}
     */
    this.currentScale = 1;
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
  handWriting(options) {
    const { id, x, y, ctxColor, lineWidth } = options;
    // 同一个动作，id 相同
    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting && lastAction.id === id) {
        lastAction.exec(new Pair(x, y));
        return;
      }
    }

    // 新建一个动作
    const handwriting = new Handwriting({
      id,
      ctxColor,
      lineWidth,
      ctx: this.boardCtx
    });
    handwriting.exec(new Pair(x, y));
    this.commitActions.push(handwriting);
  }

  /**
   * 执行缩放动作
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { number } options.scale 缩放倍数
   */
  scale(options) {
    const { id, scale } = options;
    let added = false;
    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Scale && lastAction.id === id) {
        lastAction.record(scale);
        added = true;
      }
    }

    if (!added) {
      const s = new Scale({
        id,
        ctx: this.boardCtx,
        originScale: this.currentScale
      });
      s.record(scale);
      this.commitActions.push(s);
    }

    const image = this.boardCanvas.toDataURL('image/png');
    console.log(image.length);
    this.boardCtx.fillStyle = 'yellow';
    this.boardCtx.fillRect(0, 0, this.boardCtx.canvas.width, this.boardCtx.canvas.height);
    // for (const item of this.commitActions) {
    //   if (item instanceof Scale) {
    //     item.draw();
    //   }
    // }
    // for (const item of this.commitActions) {
    //   if (item instanceof Handwriting) {
    //     item.reDraw();
    //   }
    // }

    // TODO 堆组件的方式
    // ex: 画完一条线，就生成一个图片，插入

    const img = this.boardCanvas.createImage();
    img.src = image;
    img.onload = () => {
      const dpr = wx.getSystemInfoSync().pixelRatio;
      console.log(img, 0, 0, img.width, img.height, this.boardCanvas.width / 4/dpr, this.boardCanvas.height / 4 / dpr, this.boardCanvas.width / 2/dpr, this.boardCanvas.height / 2/dpr);
      this.boardCtx.drawImage(img, 0, 0, img.width, img.height, this.boardCanvas.width / 4 / dpr, this.boardCanvas.height / 4 / dpr, this.boardCanvas.width / 2 / dpr, this.boardCanvas.height / 2 / dpr);
    }
    img.onerror = (err) => {
      console.log(err);
    }
  }
};
