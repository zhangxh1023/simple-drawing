/**
 * @template T
 */
export class Pair {
  /**
   * @param {T} first
   * @param {T} second
   */
  constructor(first, second) {

    /**
     * @type {T}
     */
    this.first = first;

    /**
     * @type {T}
     */
    this.second = second;
  }
}