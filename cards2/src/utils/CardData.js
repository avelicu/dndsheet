/**
 * Presentational data class for spell cards
 * Contains generic field names suitable for any card layout
 */
export class CardData {
  constructor({
    title = '',
    leftIndicator = '',
    rightIndicator = '',
    specs = [],
    body = '',
    bottomLeft = '',
    bottomRight = '',
    fontScale = 1,
    error = false,
    sizeReduced = false
  } = {}) {
    this.title = title;
    this.leftIndicator = leftIndicator;
    this.rightIndicator = rightIndicator;
    this.specs = specs;
    this.body = body;
    this.bottomLeft = bottomLeft;
    this.bottomRight = bottomRight;
    this.fontScale = fontScale; // scaling factor applied to body text only
    this.error = error; // true if reflow could not make it fit
    this.sizeReduced = sizeReduced; // true if fontScale < 1 was applied
  }

  /**
   * Create CardData from a plain object
   * @param {Object} obj - Plain object with card data
   * @returns {CardData} New CardData instance
   */
  static fromObject(obj) {
    return new CardData(obj);
  }

  /**
   * Convert CardData to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      title: this.title,
      leftIndicator: this.leftIndicator,
      rightIndicator: this.rightIndicator,
      specs: this.specs,
      body: this.body,
      bottomLeft: this.bottomLeft,
      bottomRight: this.bottomRight,
      fontScale: this.fontScale,
      error: this.error,
      sizeReduced: this.sizeReduced
    };
  }

  /**
   * Check if this card is overflowing
   * @returns {boolean} True if card is overflowing
   */
  get isOverflowing() {
    return this._isOverflowing || false;
  }

  /**
   * Set overflow status
   * @param {boolean} overflowing - Whether card is overflowing
   */
  set isOverflowing(overflowing) {
    this._isOverflowing = overflowing;
  }

  /**
   * Get overflow amount in pixels
   * @returns {number} Overflow amount in pixels
   */
  get overflowPx() {
    return this._overflowPx || 0;
  }

  /**
   * Set overflow amount
   * @param {number} px - Overflow amount in pixels
   */
  set overflowPx(px) {
    this._overflowPx = px;
  }
}
