import { Eraser } from './actions/eraser';
import { Handwriting } from './actions/handwriting';
import { Pair } from './actions/pair';
import { ScaleDrag } from './actions/scale-drag';
import { BoardStatus } from './board-status';

/**
 * |--------------------|
 * |       board        |
 * |     |--------|     |
 * |     |-canvas-|     |
 * |     |--------|     |
 * |                    |
 * |--------------------|
 */

/**
 * @typedef { Handwriting | ScaleDrag | Eraser } Action 动作
 */

/**
 * 设备 dpr
 */
export const DPR = wx.getSystemInfoSync().pixelRatio;

export class Board {

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
     * @type { Action[] }
     */
    this.commitActions = [];

    /**
     * 已经回退的动作列表，rollbackActions[0] 为第一次回退的动作
     * 
     * @type { Handwriting | ScaleDrag[] }
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
     * 当前的 board size
     * 
     * @type { Pair<number> }
     */
    this.currentBoardSize = new Pair(this.boardCtx.canvas.width, this.boardCtx.canvas.height);

    /**
     * 当前 board 左上角顶点坐标
     * 
     * @type { Pair<number> }
     */
    this.currentBoardPosition = new Pair(0, 0);

    /**
     * 离屏 canvas 图像
     * 
     * @type { HTMLImageElement | null }
     */
    this.offScreenImage = null;

    /**
     * 画板当前状态
     * 
     * @type { keyof typeof BoardStatus }
     */
    this.status = BoardStatus.NOEDIT;

    /**
     * 动作 id / version
     * 
     * @type { number }
     */
    this.actionVersion = 0;

    /**
     * 手写笔画宽度
     * 
     * @type { number }
     */
    this.handwritingWidth = 3;

    /**
     * 手写笔画颜色
     * 
     * @type { string }
     */
    this.handwritingColor = 'black';
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

  /**
   * 执行手写笔画动作
   * 
   * @param { TouchEvent } evt
   */
  execHandWriting(evt) {
    const x = evt.touches[0].x;
    const y = evt.touches[0].y;

    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting && lastAction.actionVersion === this.actionVersion) {
        lastAction.addPoint({
          ctx: this.boardCtx,
          point: new Pair(x, y)
        });
        return;
      }
    }

    const handwriting = new Handwriting({
      actionVersion: this.actionVersion,
      ctxColor: this.handwritingColor,
      width: this.handwritingWidth,
      ctx: this.boardCtx
    });
    handwriting.addPoint({
      ctx: this.boardCtx,
      point: new Pair(x, y)
    });
    this.commitActions.push(handwriting);
  }

  /**
   * 执行缩放拖动动作
   * 
   * @param {TouchEvent} evt 
   */
  execScaleDrag(evt) {
    if (this.offScreenImage === null) return;

    // 拖动
    const points = evt.touches;
    // 计算 points 的中心点
    const dragCenter = new Pair(0, 0);
    for (let i = 0; i < points.length; i++) {
      dragCenter.first += points[i].x;
      dragCenter.second += points[i].y;
    }
    dragCenter.first /= points.length;
    dragCenter.second /= points.length;

    // 缩放两指距离 只看前两个 touches
    const scaleDistance = Math.sqrt(
      Math.pow(points[0].x - points[1].x, 2)
      + Math.pow(points[0].y - points[1].y, 2)
    );

    /**
     * @type { ScaleDrag | null }
     */
    let lastAction = null;
    if (!this.commitActions.length) {
      lastAction = new ScaleDrag({
        actionVersion: this.actionVersion,
        scaleDistance,
        dragCenter,
        prevBoardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
      });
      this.commitActions.push(lastAction);
    }
    lastAction = this.commitActions[this.commitActions.length - 1];
    if (lastAction.actionVersion !== this.actionVersion) {
      lastAction = new ScaleDrag({
        actionVersion: this.actionVersion,
        scaleDistance,
        dragCenter,
        prevBoardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
      });
      this.commitActions.push(lastAction);
    }

    // 缩放大小倍数
    if (lastAction) {
      const originalCanvasWidth = this.boardCtx.canvas.width;
      const originalCanvasHeight = this.boardCtx.canvas.height;

      const scaleMultiple = scaleDistance / lastAction.scaleDistance;
      // todo 记录总的缩放倍数
      let widthOffset = lastAction.prevBoardSize.first * scaleMultiple;
      let heightOffset = lastAction.prevBoardSize.second * scaleMultiple;
      if (scaleMultiple < 1) {
        widthOffset = -widthOffset;
        heightOffset = -heightOffset;
      }
      const afterScaleWidth = this.currentBoardSize.first + widthOffset;
      const afterScaleHeight = this.currentBoardSize.second + heightOffset;
      if (afterScaleWidth < originalCanvasWidth
        || afterScaleHeight < originalCanvasHeight) {
        // 缩放后的画布大小，不能小于当前画布大小
        return;
      }

      // 更新缩放后的 board size
      this.currentBoardSize.first = afterScaleWidth;
      this.currentBoardSize.second = afterScaleHeight;

      this.boardCtx.clearRect(
        0, 0,
        originalCanvasWidth / DPR,
        originalCanvasHeight / DPR
      );

      const globalScaleX = afterScaleWidth / originalCanvasWidth;
      const globalScaleY = afterScaleHeight / originalCanvasHeight;
      const subImageX = originalCanvasWidth / globalScaleX;
      const subImageY = originalCanvasHeight / globalScaleY;

      this.boardCtx.drawImage(
        this.offScreenImage,
        (originalCanvasWidth - subImageX) / DPR / 2,
        (originalCanvasHeight - subImageY) / DPR / 2,
        subImageX / DPR,
        subImageY / DPR,
        0, 0,
        originalCanvasWidth / DPR,
        originalCanvasHeight / DPR
      );

      const offsetx = dragCenter.first - lastAction.dragCenter.first;
      const offsety = dragCenter.second - lastAction.dragCenter.second;
      lastAction.dragCenter = new Pair(lastAction.dragCenter.first + offsetx, lastAction.dragCenter.second + offsety);
    }
  }

  /**
   * touch start 事件
   * @param { TouchEvent } evt 
   */
  boardTouchStart(evt) {

  }

  /**
   * touch move 事件
   * @param { TouchEvent } evt 
   */
  boardTouchMove(evt) {
    if (!evt.touches.length) return;

    if (evt.touches.length === 1) {
      if (this.status === BoardStatus.HANDWRITING) {
        this.execHandWriting(evt);
      } else if (this.status === BoardStatus.ERASER) {

      } else if (this.status === BoardStatus.NOEDIT) {

      }
    } else if (evt.touches.length > 1) {
      // 多指 拖动 缩放
      this.execScaleDrag(evt);
    }
  }

  /**
   * touch end 事件
   * @param { TouchEvent } evt 
   */
  async boardTouchEnd(evt) {
    console.log(evt);
    if (!evt.touches.length
      && this.commitActions.length) {
      // 所有的手指 都离开了屏幕
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction.actionVersion === this.actionVersion) {
        if (lastAction instanceof Handwriting
          || lastAction instanceof Eraser) {
          // 最后一个动作是 手写/橡皮擦，重绘到离屏 canvas

          lastAction.reDraw({
            ctx: this.offScreenCtx,
            scale: 1,
            boardLeftTopVertex: new Pair(0, 0),
            canvasSize: new Pair(this.boardCtx.canvas.width / DPR,
              this.boardCtx.canvas.height / DPR)
          });
          this.offScreenImage = await this.loadOffScreenCanvas()

        } else if (lastAction instanceof ScaleDrag) {
          // 最后一个动作是 缩放/拖动，则重绘当前 canvas
          this.reDraw();
        }
      }


      this.actionVersion = ++this.actionVersion % Number.MAX_VALUE;
    }
  }

  /**
   * 根据当前缩放/offset，重绘当前 canvas
   */
  reDraw() {

  }
};