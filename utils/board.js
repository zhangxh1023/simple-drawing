import { Handwriting } from './actions/handwriting';
import { Pair } from './actions/pair';
import { ScaleDrag } from './actions/scale-drag';
import { BoardStatus } from './board-status';
import { DPR } from './util';

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
 * @typedef { Handwriting | ScaleDrag } Action 动作
 */

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
     * 已经回退的动作列表，undoActions[0] 为第一次回退的动作
     * 
     * @type { Handwriting | ScaleDrag[] }
     */
    this.undoActions = [];

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
    const globalScale = this.getGlobalScale();

    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting && lastAction.actionVersion === this.actionVersion) {
        lastAction.addPoint({
          ctx: this.boardCtx,
          point: new Pair(x - (this.currentBoardPosition.first / globalScale),
            y - (this.currentBoardPosition.second / globalScale))
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
      point: new Pair(x - (this.currentBoardPosition.first / globalScale),
        y - (this.currentBoardPosition.second / globalScale))
    });
    this.commitActions.push(handwriting);
  }

  /**
   * 执行缩放拖动动作
   * 更新状态，渲染离屏 image
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
    let scaleDistance = 1;
    if (points.length > 1) {
      scaleDistance = Math.sqrt(Math.pow(points[0].x - points[1].x, 2)
        + Math.pow(points[0].y - points[1].y, 2));
    }

    /**
     * @type { ScaleDrag | null }
     */
    let lastAction = null;
    if (!this.commitActions.length) {
      lastAction = new ScaleDrag({
        actionVersion: this.actionVersion,
        scaleDistance,
        dragCenter,
        initBoardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
      });
      this.commitActions.push(lastAction);
    }
    lastAction = this.commitActions[this.commitActions.length - 1];
    if (lastAction.actionVersion !== this.actionVersion) {
      lastAction = new ScaleDrag({
        actionVersion: this.actionVersion,
        scaleDistance,
        dragCenter,
        initBoardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
      });
      this.commitActions.push(lastAction);
    }

    // 缩放大小倍数
    if (lastAction) {
      const originalCanvasWidth = this.boardCtx.canvas.width;
      const originalCanvasHeight = this.boardCtx.canvas.height;

      const scaleMultiple = scaleDistance / lastAction.scaleDistance;

      this.currentBoardPosition.first += (dragCenter.first - lastAction.dragCenter.first);
      this.currentBoardPosition.second += (dragCenter.second - lastAction.dragCenter.second);

      lastAction.dragCenter = dragCenter;
      lastAction.scaleDistance = scaleDistance;
      // todo 记录总的缩放倍数
      const widthOffset = lastAction.initBoardSize.first * (scaleMultiple - 1);
      const heightOffset = lastAction.initBoardSize.second * (scaleMultiple - 1);
      let afterScaleWidth = this.currentBoardSize.first + widthOffset;
      let afterScaleHeight = this.currentBoardSize.second + heightOffset;

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
        ((originalCanvasWidth - subImageX) / DPR / 2) - this.currentBoardPosition.first / globalScaleX,
        ((originalCanvasHeight - subImageY) / DPR / 2) - this.currentBoardPosition.second / globalScaleX,
        subImageX / DPR,
        subImageY / DPR,
        0, 0,
        originalCanvasWidth / DPR,
        originalCanvasHeight / DPR
      );
    }
  }

  /**
   * touch start 事件
   * @param { TouchEvent } evt 
   */
  boardTouchStart(evt) {
    // ignore
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
        this.execEraser(evt);
      } else if (this.status === BoardStatus.NOEDIT) {
        // 单指拖动
        this.execScaleDrag(evt);
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
    if (!evt.touches.length
      && this.commitActions.length) {
      // 所有的手指 都离开了屏幕
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction.actionVersion === this.actionVersion) {
        if (lastAction instanceof Handwriting) {
          // 最后一个动作是 手写/橡皮擦，重绘到离屏 canvas

          lastAction.reDraw({
            ctx: this.offScreenCtx,
            boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          });
          this.offScreenImage = await this.loadOffScreenCanvas();

        } else if (lastAction instanceof ScaleDrag) {
          // 最后一个动作是 缩放/拖动，则重绘当前 canvas
          this.reDraw();
        }
      }


      this.actionVersion = ++this.actionVersion % Number.MAX_VALUE;
    }
  }

  /**
   * 清空画板
   * 
   * @type { CanvasRenderingContext2D } context
   */
  clearCtx(ctx) {
    ctx.clearRect(
      0, 0,
      ctx.canvas.width / DPR,
      ctx.canvas.height / DPR
    );
  }

  /**
   * 根据当前缩放/offset，重绘当前 canvas
   */
  reDraw() {
    this.clearCtx(this.boardCtx);
    for (const item of this.commitActions) {
      if (item instanceof Handwriting) {
        item.reDraw({
          ctx: this.boardCtx,
          boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          offset: this.currentBoardPosition
        });
      } else if (item instanceof ScaleDrag) {
        // todo
      }
    }
  }

  /**
   * 撤销
   */
  async undo() {
    if (this.commitActions.length) {
      this.clearCtx(this.boardCtx);
      this.clearCtx(this.offScreenCtx);
      const lastAction = this.commitActions.pop();
      this.undoActions.push(lastAction);
      for (const item of this.commitActions) {
        if (item instanceof Handwriting) {
          item.reDraw({
            ctx: this.boardCtx,
            boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          });
          item.reDraw({
            ctx: this.offScreenCtx,
            boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          });
          this.offScreenImage = await this.loadOffScreenCanvas();
        }
      }
    }
  }

  /**
   * 重做
   */
  async redo() {
    if (this.undoActions.length) {
      const lastAction = this.undoActions.pop();
      this.commitActions.push(lastAction);
      for (const item of this.commitActions) {
        if (item instanceof Handwriting) {
          item.reDraw({
            ctx: this.boardCtx,
            boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          });
          item.reDraw({
            ctx: this.offScreenCtx,
            boardSize: new Pair(this.currentBoardSize.first, this.currentBoardSize.second),
          });
          this.offScreenImage = await this.loadOffScreenCanvas();
        }
      }
    }
  }

  /**
   * 获取当前画板的缩放比例
   */
  getGlobalScale() {
    return this.currentBoardSize.first / this.boardCtx.canvas.width;
  }

  /**
   * 橡皮擦事件
   * 
   * @param {TouchEvent} evt 
   */
  execEraser(evt) {
    const x = evt.touches[0].x;
    const y = evt.touches[0].y;

    const globalScale = this.getGlobalScale();
    if (this.commitActions.length) {
      const lastAction = this.commitActions[this.commitActions.length - 1];
      if (lastAction instanceof Handwriting && lastAction.actionVersion === this.actionVersion) {
        lastAction.addPoint({
          ctx: this.boardCtx,
          point: new Pair(x - (this.currentBoardPosition.first / globalScale),
            y - (this.currentBoardPosition.second / globalScale))
        });
        return;
      }
    }

    const eraser = new Handwriting({
      actionVersion: this.actionVersion,
      // todo background color
      ctxColor: 'white',
      width: this.handwritingWidth * 4,
    });
    eraser.addPoint({
      ctx: this.boardCtx,
      point: new Pair(x - (this.currentBoardPosition.first / globalScale),
        y - (this.currentBoardPosition.second / globalScale))
    });
    this.commitActions.push(eraser);
  }
};
