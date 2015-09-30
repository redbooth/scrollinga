//TODO this file does not belong in the lib folder. Should be opensourced and
//included as a separate library.

const utils = {
  toArray: Array.prototype.slice
};

class Scrollinga {

  /**
   * Scrollinga constructor
   *
   * @params {Object} options
   * @params {DOMObject} options.target - DOM object to observe
   * @params {Number} options.interval - Interval for polling fallback
   */
  constructor(options={}) {
    this.target = options.target;
    this.interval = options.interval || 100;

    this.setInitialScrollLock(options.position);
    this.setupListeners();
    this.rescroll();
  }

  /**
   * Sets initial scroll lock.
   *
   * @param {String|Number} position
   */
  setInitialScrollLock(position) {
    if (typeof position === 'number') {
      this.target.scrollTop = position;
      return;
    }

    switch (position) {
    case 'bottom':
      this.setScrollLockAtBottom();
      break;
    case 'top':
      this.setScrollLockAtTop();
      break;
    default:
      this.setScrollLockAtBottom();
    }
  };

  /**
   * Setups the listeners ( scroll, MutationObserver, resize, etc ... ). If no
   * mutation observer is available, falls back to polling.
   */
  setupListeners() {
    this.onMutation = this.onMutation.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);

    if (window.MutationObserver) {
      this.observer = new window.MutationObserver(this.onMutation);
      this.observer.observe(this.target, {
        attributes: true
      , childList: true
      , characterData: true
      , subtree: true
      });
    } else {
      this.interval = window.setInterval(this.rescroll.bind(this), this.interval);
    }

    this.target.addEventListener('scroll', this.onScroll);
    window.addEventListener('resize', this.onResize);
  }

  /**
   * Sets a scroll lock. A scroll lock object should have two keys 'at' and 'when'.
   *
   * @param {Object} lock
   * @param {Function} lock.at - A function that returns the scrollTop value
   * @param {Function} lock.when - A function that returns true when the rescroll should be done
   */
  setScrollLock(lock) {
    this.scrollLock = lock;
  }

  /**
   * Locks the scroll at the bottom.
   */
  setScrollLockAtBottom() {
    var target = this.target

    this.setScrollLock({
      at: () => target.scrollHeight
    , when: () => !this.isScrollDown()
    });

    this.rescroll();
  }

  /**
   * Locks the scroll at the top.
   */
  setScrollLockAtTop() {
    var target = this.target
      , self = this;

    this.setScrollLock({
      at: () => 0
    , when: () => !this.isScrollUp()
    });

    this.rescroll();
  }

  /**
   * Locks the scroll at the current position.
   */
  setScrollLockAtCurrentPosition() {
    var prevScrollHeight = this.target.scrollHeight
      , target = this.target;

    this.setScrollLock({
      at: () => target.scrollHeight - prevScrollHeight
    , when: () => true
    });
  }

  /**
   * Returns true if the scroll is down
   *
   * @return {Boolean}
   */
  isScrollDown() {
    return (this.target.scrollTop + this.target.clientHeight === this.target.scrollHeight);
  }

  /**
   * Returns true if the scroll is up
   *
   * @return {Boolean}
   */
  isScrollUp() {
    return this.target.scrollTop === 0;
  }

  /**
   * Remove scroll lock
   */
  removeScrollLock() {
    this.scrollLock = null;
  }

  /**
   * Returns true if any scroll lock is currently set.
   *
   * @return {Boolean}
   */
  isScrollLocked() {
    return !!this.scrollLock;
  }

  /**
   * Returns true if a rescroll should be performed.
   *
   * @return {Boolean}
   */
  shouldRescroll() {
    return this.isScrollLocked() && this.scrollLock.when();
  }

  /**
   * On scroll, setup/disable the lock. A rescrolling flag is needed because
   * programatically change scroll values triggers a 'scroll' event.
   */
  onScroll() {
    if (this.rescrolling) {
      this.rescrolling = false;
      return;
    }

    if (this.isScrollDown() && !this.isScrollLocked()) {
      this.setScrollLockAtBottom();
    } else if (!this.isScrollDown()) {
      this.removeScrollLock();
    }

    this.rescrolling = false;
  }

  /**
   * Rescroll on resize.
   */
  onResize() {
    this.rescroll();
  }

  /**
   * Scrolls target to the specified position in the scrollLock.
   */
  rescroll() {
    if (this.shouldRescroll()) {
      this.rescrolling = true;
      this.target.scrollTop = this.scrollLock.at();
    }
  }

  /**
   * On mutation handler. Calls 'onReflow' callback on when a mutation is
   * detected, or an image is loaded.
   *
   * @param {Array<MutationRecord>} mutations
   */
  onMutation(mutations) {
    this.rescroll();
    this.addImageListeners(mutations);
  }

  /**
   * Listen to 'load' event in new images
   *
   * @param {Array<MutationRecord>} mutations
   */
  addImageListeners(mutations) {
    mutations.forEach((mutation) => {
      var nodes = utils.toArray.call(mutation.addedNodes);

      nodes.forEach((node) => {
        if (node.tagName === 'IMG') {
          this.listenToImageLoad(node);
        }

        if (node.getElementsByTagName) {
          var childImages = utils.toArray.call(node.getElementsByTagName('img'));

          childImages.forEach((image) => {
            this.listenToImageLoad(image);
          });
        }
      });
    });
  }

  /**
   * Returns a 'load' listener for images that removes itself after being executed.
   *
   * @return {Function}
   */
  getImageLoadListener() {
    const listener = (event) => {
      this.rescroll();
      event.currentTarget.removeEventListener('load', listener);
    };

    return listener;
  }

  /**
   * Listens to image load
   *
   */
  listenToImageLoad(image) {
    image.addEventListener('load', this.getImageLoadListener());
  }

  /**
   * Removes listeners and stuff.
   */
  close() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.interval) {
      window.clearInterval(this.interval);
    }

    this.target.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }
}

export default Scrollinga;
