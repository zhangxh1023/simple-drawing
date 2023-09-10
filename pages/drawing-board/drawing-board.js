import { Eraser } from '../../utils/actions/eraser';
import { Handwriting } from '../../utils/actions/handwriting';
import { Board } from '../../utils/board';
import { BoardStatus } from '../../utils/board-status';
import { DPR } from '../../utils/util';

/**
 * @type { Board | null }
 */
let board = null;

Page({

  data: {
    enbaleUndoBtn: false,
    enbaleRedoBtn: false,
    enablePencilBtn: true,
    enableRubberBtn: true,
    isEditing: false,
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

  },

  /**
   * 画板触碰事件
   * @param { TouchEvent } evt
   * @returns 
   */
  boardTouchStart(evt) {
    board.boardTouchStart(evt);
  },

  /**
   * 画板 move 事件
   * @param { TouchEvent } evt 
   * @returns 
   */
  boardTouchMove(evt) {
    board.boardTouchMove(evt);
  },

  /**
   * 画板停止触摸事件
   * @param { TouchEvent } evt 
   * @returns 
   */
  async boardTouchEnd(evt) {
    await board.boardTouchEnd(evt);
    this.updateRedoUndoIconStatus();
  },

  /**
   * 更新顶部左上角两个 撤销/重做 按钮状态
   */
  updateRedoUndoIconStatus() {
    let enbaleUndoBtn = false;
    let enbaleRedoBtn = false;
    const canUndoActions = this.filterRedoUnDoActions(board.commitActions);
    const canRedoActions = this.filterRedoUnDoActions(board.undoActions);
    if (canUndoActions.length) {
      enbaleUndoBtn = true;
    }
    if (canRedoActions.length) {
      enbaleRedoBtn = true;
    }
    this.setData({
      enbaleUndoBtn,
      enbaleRedoBtn
    });
  },

  /**
   * 可以 撤销 / 重做 的动作
   * @param {import('../../utils/board').Action []} actions 
   * @returns { import('../../utils/board').Action [] }
   */
  filterRedoUnDoActions(actions) {
    return actions.filter(item => {
      return item instanceof Handwriting
        || item instanceof Eraser;
    });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {
    const query = wx.createSelectorQuery()
    query.select('#drawing-board')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        // 画板 canvas
        const boardCanvas = res[0].node;
        const boardCtx = boardCanvas.getContext('2d');
        const originWidht = res[0].width;
        const originHeight = res[0].height;
        boardCanvas.width = originWidht * DPR;
        boardCanvas.height = originHeight * DPR;
        boardCtx.scale(DPR, DPR);
        board = new Board({
          boardCtx,
        });
      });
  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  },

  touchStartUndoBtn() {
    this.setData({
      enbaleUndoBtn: false
    });
  },

  async touchEndUndoBtn() {
    this.setData({
      enbaleUndoBtn: true
    });
    await board.undo();
    this.updateRedoUndoIconStatus();
  },

  touchStartRedoBtn() {
    this.setData({
      enbaleRedoBtn: false
    });
  },

  async touchEndRedoBtn() {
    this.setData({
      enbaleRedoBtn: true
    });
    await board.redo();
    this.updateRedoUndoIconStatus();
  },

  touchStartPencilBtn() {
    this.setData({
      enablePencilBtn: false,
    });
  },

  touchEndPencilBtn() {
    this.setData({
      enablePencilBtn: true,
      isEditing: true,
    });
    board.status = BoardStatus.HANDWRITING;
  },

  touchStartRubberBtn() {
    this.setData({
      enableRubberBtn: false,
    });
  },

  touchEndRubberBtn() {
    this.setData({
      enableRubberBtn: true,
      isEditing: true,
    });
    board.status = BoardStatus.ERASER;
  },

  exitEditModel() {
    this.setData({
      isEditing: false,
    });
    board.status = BoardStatus.NOEDIT;
  },

})