import MinaTouch from '../../utils/touch'

const boardStatus = {
  offset: {
    x: 0,
    y: 0
  },
  ctx: null,
};

const eventStatus = {

};

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
      touchMove: function () {

      },
      touchEnd: function () { },
      touchCancel: function () { },
      multipointStart: function (evt) { }, //一个手指以上触摸屏幕触发
      multipointEnd: function () { }, //当手指离开，屏幕只剩一个手指或零个手指触发(一开始只有一根手指也会触发)
      tap: function () { }, //点按触发，覆盖下方3个点击事件，doubleTap时触发2次
      doubleTap: function () { }, //双击屏幕触发
      longTap: function () { }, //长按屏幕750ms触发
      singleTap: function () { }, //单击屏幕触发，包括长按
      rotate: function (evt) {
        //evt.angle代表两个手指旋转的角度
        console.log(evt.angle);
      },
      pinch: function (evt) {
        //evt.zoom代表两个手指缩放的比例(多次缩放的累计值),evt.singleZoom代表单次回调中两个手指缩放的比例
        console.log(evt);
      },
      pressMove: function (evt) {
        //evt.deltaX和evt.deltaY代表在屏幕上移动的距离,evt.target可以用来判断点击的对象
        // console.log(evt.target);
        // console.log(evt.deltaX);
        console.log(evt);
        boardStatus.offset.x = evt.deltaX;
        boardStatus.offset.y = evt.deltaY;
        that.updateBoard();
      },
      swipe: function (evt) {
        //在touch结束触发，evt.direction代表滑动的方向 ['Up','Right','Down','Left']
        // console.log("swipe:" + evt.direction);
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
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        boardStatus.ctx = ctx;
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
      });
  },

  // clear canvas board
  clearBoard() {
    const ctx = boardStatus.ctx;
    ctx.clearRect(0, 0, 300, 300);
  },

  updateBoard() {
    const ctx = boardStatus.ctx;
    ctx.translate(boardStatus.offset.x, boardStatus.offset.y);
    this.clearBoard();
    this.draw();
  },

  draw() {
    const ctx = boardStatus.ctx;
    ctx.fillStyle = "rgba(0, 0, 200, 0.5)";

    const rectangle = new Path2D();
    rectangle.rect(100, 100, 50, 50);
    ctx.fill(rectangle);
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