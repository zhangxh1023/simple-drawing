import { Pair } from './pair';

export class Scale {

  /**
   * 缩放当前画面
   * 
   * @param { object } options 配置
   * @param { number } options.id 动作 id
   * @param { number } options.originScale 执行缩放前，全局的缩放倍数
   * @param { HTMLImageElement } options.image 离屏 canvas，整个 board 图像
   */
  constructor(options) {

    const { id, originScale, image } = options;

    /**
     * 动作 id
     * 
     * @type { number }
     */
    this.id = id;

    /**
     * 执行缩放前，全局的缩放倍数
     * 
     * @type { number }
     */
    this.originScale = originScale;

    /**
     * 离屏 canvas，整个 board 图像
     * 
     * @type { HTMLImageElement } 
     */
    this.image = image;
  }
};
