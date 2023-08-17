import MinaTouch from '../../utils/touch'
import { Actions } from '../../utils/actions/actions';

/**
 * @type { Actions | null }
 */
let actions = null;
let actionId = 0;

Page({

  data: {

  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    const that = this;
    new MinaTouch(this, 'touch1', {
      //会创建this.touch1指向实例对象
      touchStart: function () { },
      touchMove: function (evt) {
        if (evt.touches && evt.touches.length === 1) {
          // 画线条
          const x = evt.touches[0].pageX;
          const y = evt.touches[0].pageY;
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
          // TODO 双指
          // ignore
        }
      },
      touchEnd: function () {
        actionId = ++actionId % Number.MAX_VALUE;
        actions.endHandWriting();
      },
      touchCancel: function () { },
      multipointStart: function (evt) { }, //一个手指以上触摸屏幕触发
      multipointEnd: function () { }, //当手指离开，屏幕只剩一个手指或零个手指触发(一开始只有一根手指也会触发)
      tap: function () { }, //点按触发，覆盖下方3个点击事件，doubleTap时触发2次
      doubleTap: function () { }, //双击屏幕触发
      longTap: function () { }, //长按屏幕750ms触发
      singleTap: function () { }, //单击屏幕触发，包括长按
      rotate: function (evt) {
        //evt.angle代表两个手指旋转的角度
      },
      pinch: function (evt) {
        //evt.zoom代表两个手指缩放的比例(多次缩放的累计值),evt.singleZoom代表单次回调中两个手指缩放的比例
        let scale = evt.singleZoom;
        if (scale && scale > 0) {
          actions.scale({
            id: actionId,
            scale,
          });
        }
      },
      pressMove: function (evt) {
        //evt.deltaX和evt.deltaY代表在屏幕上移动的距离,evt.target可以用来判断点击的对象
      },
      swipe: function (evt) {
        //在touch结束触发，evt.direction代表滑动的方向 ['Up','Right','Down','Left']
      },
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
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const originWidht = res[0].width;
        const originHeight = res[0].height;
        boardCanvas.width = originWidht * dpr;
        boardCanvas.height = originHeight * dpr;
        boardCtx.scale(dpr, dpr);
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

  }
})