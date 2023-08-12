import { Handwriting } from './handwriting';
import { Pair } from './pair';
import { Scale } from './scale';

export class Actions {

  /**
   * 绘画动作
   * 
   * @param { object } options 配置
   * @param { CanvasRenderingContext2D } options.ctx ctx
   * @param { number } options.canvasWidth 画板宽度
   * @param { number } options.canvasHeight 画板高度
   * @param { HTMLCanvasElement } canvas canvas 对象
   */
  constructor(options) {
    const { ctx, canvasWidth, canvasHeight, canvas } = options;

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
     * ctx
     * 
     * @type { CanvasRenderingContext2D }
     */
    this.ctx = ctx;

    /**
     * 画板宽度
     * 
     * @type { number } 
     */
    this.canvasWidth = canvasWidth;

    /**
     * 画板高度
     * 
     * @type { number } 
     */
    this.canvasHeight = canvasHeight;

    /**
     * canvas 对象
     * 
     * @type { HTMLCanvasElement }
     */
    this.canvas = canvas;
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
      ctx: this.ctx
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
      const scale = new Scale({
        id,
        ctx: this.ctx,
      });
      scale.record(scale);
      this.commitActions.push(scale);
    }

    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    for (const item of this.commitActions) {
      if (item instanceof Scale) {
        item.draw();
      }
    }
    for (const item of this.commitActions) {
      if (item instanceof Handwriting) {
        item.reDraw();
      }
    }
  }
};
