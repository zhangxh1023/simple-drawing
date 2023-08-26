import {
  Actions
} from '../../utils/actions/actions';
import {
  Pair
} from '../../utils/actions/pair';

const TOP_BAR_HEIGHT = 60;
const DPR = wx.getSystemInfoSync().pixelRatio;

/**
 * @type { Actions | null }
 */
let actions = null;
let actionId = 0;

Page({

  data: {
    enbaleRollbackBtn: false,
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
    if (!this.data.isEditing) return;
    console.log(evt);
  },

  /**
   * 画板 move 事件
   * @param { TouchEvent } evt 
   * @returns 
   */
  boardTouchMove(evt) {
    if (!this.data.isEditing) return;
    console.log(evt);
    if (evt.touches && evt.touches.length === 1) {
      // 画线条
      const x = evt.touches[0].pageX;
      const y = evt.touches[0].pageY - TOP_BAR_HEIGHT / DPR;
      if (actions) {
        actions.execHandWriting({
          id: actionId,
          x,
          y,
          lineWidth: 3,
          ctxColor: 'black'
        });
      }
    } else {
      // TODO 双指 拖动
      // ignore

      // evt.zoom代表两个手指缩放的比例(多次缩放的累计值),evt.singleZoom代表单次回调中两个手指缩放的比例
      let scale = evt.singleZoom;
      const touch1 = evt.touches[0];
      const touch2 = evt.touches[1];
      if (scale && scale > 0) {
        actions.scale({
          id: actionId,
          scale,
          center: new Pair((touch1.pageX + touch2.pageX) / 2,
            (touch1.pageY + touch2.pageY - TOP_BAR_HEIGHT / DPR - TOP_BAR_HEIGHT / DPR) / 2),
        });
      }
    }
  },

  /**
   * 画板停止触摸事件
   * @param { TouchEvent } evt 
   * @returns 
   */
  boardTouchEnd(evt) {
    if (!this.data.isEditing) return;
    console.log(evt);
    actionId = ++actionId % Number.MAX_VALUE;
    actions.endHandWriting();
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
        actions = new Actions({
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

  touchStartRollbackBtn() {
    this.setData({
      enbaleRollbackBtn: false
    });
  },

  touchEndRollbackBtn() {
    this.setData({
      enbaleRollbackBtn: true
    });
  },

  touchStartRedoBtn() {
    this.setData({
      enbaleRedoBtn: false
    });
  },

  touchEndRedoBtn() {
    this.setData({
      enbaleRedoBtn: true
    });
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
  },

  touchStartRubberBtn() {
    this.setData({
      enableRubberBtn: false,
    });
  },

  touchEndRubberBtn() {
    this.setData({
      enableRubberBtn: true,
    });
  },

  exitEditModel() {
    this.setData({
      isEditing: false,
    });
  },

})