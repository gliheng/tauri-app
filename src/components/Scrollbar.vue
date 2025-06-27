<template>
  <div
    ref="scrollerEl"
    class="j-scroller"
    :data-overlay-scrollbar="overlayScrollbar"
  >
    <main @scroll="$emit('scroll', $event)">
      <slot />
    </main>
    <div class="j-scroll-bar"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import mitt from "mitt";

export default defineComponent({
  emits: ["scroll"],
  props: {
    overlayScrollbar: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    let scrollerEl = ref();
    let scroller: Scroller;

    onMounted(() => {
      scroller = new Scroller(scrollerEl.value);
    });

    onUnmounted(() => {
      scroller.dispose();
    });

    return {
      scrollerEl,
      get scroller() {
        return scroller;
      },
    };
  },
});

class Scrollbar {
  scrollEl?: HTMLElement;
  scroll: number = 0;
  maxScroll: number = 0;
  scrollStart: number = 0;
  mouseStart: number = 0;
  hidden = true;

  constructor(
    public scrollbarEl: HTMLElement,
    public horizontal: boolean = false,
  ) {
    Object.assign(this, mitt());
  }

  // when the controlled view's site change, update scroll size accordingly
  updateScrollSize(clientSize: number, scrollSize: number) {
    this.hidden = clientSize >= scrollSize;
    if (!this.hidden) {
      // able to scroll in this single direction
      if (!this.scrollEl) {
        // create scrollbar if not created
        this.scrollEl = this.createScroll(
          this.horizontal ? "j-scroll-x" : "j-scroll-y",
        );
        let bar = this.scrollEl.firstElementChild as HTMLElement;
        bar.addEventListener("mousedown", this.handleEvent);
      }
      // adjust scrollbar size
      let barSize = Math.max(20, (clientSize / scrollSize) * clientSize);
      let bar = this.scrollEl.firstElementChild as HTMLElement;
      if (this.horizontal) {
        bar.style.width = `${barSize}px`;
      } else {
        bar.style.height = `${barSize}px`;
      }
      this.maxScroll = clientSize - barSize;
      this.scrollEl.hidden = false;
      // if (!this.scrollerEl.classList.contains(scrollClass)) {
      //   this.scrollerEl.classList.add(scrollClass);
      // }
    } else if (this.scrollEl) {
      this.scrollEl.hidden = true;
      // if (this.scrollerEl.classList.contains(scrollClass)) {
      //   this.scrollerEl.classList.remove(scrollClass);
      // }
    }
  }

  // when view is scrolled, update handle location accordingly
  updateScrollPos(scroll: number, clientSize: number, scrollSize: number) {
    this.scroll = scroll;
    if (this.scrollEl) {
      if (clientSize < scrollSize) {
        this.scroll = (scroll / (scrollSize - clientSize)) * this.maxScroll;
        (this.scrollEl.firstElementChild as HTMLElement).style.transform =
          `${this.scrollProp}(${this.scroll}px)`;
        this.scrollEl.hidden = false;
      } else {
        this.scrollEl.hidden = true;
      }
    }
  }

  createScroll(klass: string) {
    let div = document.createElement("div");
    div.className = klass;
    let bar = document.createElement("div");
    bar.className = "j-scroll-handle";
    div.appendChild(bar);
    this.scrollbarEl.appendChild(div);
    return div;
  }

  get scrollProp() {
    return this.horizontal ? "translateX" : "translateY";
  }

  handleEvent = (evt: MouseEvent) => {
    if (evt.type == "mousedown") {
      this.scrollStart = this.scroll;
      this.mouseStart = this.horizontal ? evt.clientX : evt.clientY;
      this.emit("drag", true);
      this.scrollEl!.dataset.dragging = "";
      this.scrollEl!.style.zIndex = "1";
      window.addEventListener("mousemove", this);
      window.addEventListener("mouseup", this);
      evt.preventDefault();
    } else if (evt.type == "mousemove") {
      let mousePos = this.horizontal ? evt.clientX : evt.clientY;
      let scroll = this.scrollStart + mousePos - this.mouseStart;
      scroll = Math.max(0, scroll);
      scroll = Math.min(scroll, this.maxScroll);
      (this.scrollEl!.firstElementChild as HTMLElement).style.transform =
        `${this.scrollProp}(${scroll}px)`;
      this.scroll = scroll;
      this.emit("scroll", [this.scroll, this.maxScroll]);
    } else if (evt.type == "mouseup") {
      window.removeEventListener("mousemove", this);
      window.removeEventListener("mouseup", this);
      this.emit("drag", false);
      delete this.scrollEl!.dataset.dragging;
      this.scrollEl!.style.zIndex = "";
    }
  };
}

declare let ResizeObserver: any;

class Scroller {
  root: HTMLElement;
  el: HTMLElement;
  scrollbarEl: HTMLElement;
  scrollbarX: Scrollbar;
  scrollbarY: Scrollbar;
  drag = false;
  observer?: typeof ResizeObserver;

  constructor(root: HTMLElement) {
    let el = root.firstElementChild as HTMLElement;
    let scrollbarEl = root.lastElementChild as HTMLElement;
    this.el = el;
    this.scrollbarEl = scrollbarEl;
    this.root = root;

    this.el.addEventListener("scroll", this);

    let cw = el.clientWidth,
      sw = el.scrollWidth;
    let ch = el.clientHeight,
      sh = el.scrollHeight;
    this.scrollbarX = new Scrollbar(scrollbarEl, true);
    this.scrollbarX.updateScrollSize(cw, sw);
    this.scrollbarX.on<boolean>("drag", this.setDrag);
    this.scrollbarX.on("scroll", ([scroll, maxScroll]) => {
      let containerScroll =
        ((el.scrollWidth - el.clientWidth) * scroll) / maxScroll;
      el.scrollLeft = containerScroll;
    });
    this.scrollbarY = new Scrollbar(scrollbarEl, false);
    this.scrollbarY.updateScrollSize(ch, sh);
    this.scrollbarY.on<boolean>("drag", this.setDrag);
    this.scrollbarY.on("scroll", ([scroll, maxScroll]) => {
      let containerScroll =
        ((el.scrollHeight - el.clientHeight) * scroll) / maxScroll;
      el.scrollTop = containerScroll;
    });

    this.updateScrollPadding();

    if (typeof ResizeObserver == "function") {
      // @ts-ignore
      this.observer = new ResizeObserver((_entries) => {
        // @ts-ignore
        let cw = el.clientWidth,
          ch = el.clientHeight,
          sw = el.scrollWidth,
          sh = el.scrollHeight;
        this.scrollbarX.updateScrollSize(cw, sw);
        this.scrollbarY.updateScrollSize(ch, sh);
        this.updateScrollPos();
      });
      this.observer.observe(el);
      if (el.firstElementChild) {
        // in case content changes size
        this.observer.observe(el.firstElementChild);
      }
    }
  }

  setDrag = (v?: boolean) => {
    this.drag = v!;
  };

  updateScrollPadding() {
    this.root.dataset.xScroll = this.scrollbarX.hidden ? "false" : "true";
    this.root.dataset.yScroll = this.scrollbarY.hidden ? "false" : "true";
  }

  updateScrollPos() {
    let sl = this.el.scrollLeft,
      st = this.el.scrollTop;
    let sw = this.el.scrollWidth,
      cw = this.el.clientWidth;
    let sh = this.el.scrollHeight,
      ch = this.el.clientHeight;

    this.scrollbarX.updateScrollPos(sl, cw, sw);
    this.scrollbarY.updateScrollPos(st, ch, sh);
    this.updateScrollPadding();
  }

  get maxScrollX() {
    return this.el.scrollWidth - this.el.clientWidth;
  }

  get maxScrollY() {
    return this.el.scrollHeight - this.el.clientHeight;
  }

  scrollTo(options: {
    top?: number;
    left?: number;
    behavior?: ScrollBehavior;
  }) {
    this.el.scrollTo(options);
  }

  scrollToTop() {
    this.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  scrollToBottom() {
    this.scrollTo({
      top: this.maxScrollY,
      behavior: "smooth",
    });
  }

  handleEvent(_: MouseEvent) {
    this.updateScrollPos();
  }

  dispose() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
</script>

<style lang="scss">
@use "sass:math";

$curve: cubic-bezier(0.4, 0, 0.2, 1);

.j-scroller {
  $size: 6px;
  $hover-size: 12px;

  position: relative;
  box-sizing: border-box;

  &[data-overlay-scrollbar="false"][data-x-scroll="true"] {
    padding-bottom: $size;
  }
  &[data-overlay-scrollbar="false"][data-y-scroll="true"] {
    padding-right: $size;
  }

  > main {
    width: 100%;
    height: 100%;
    max-height: inherit;
    overflow: scroll;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }
  .j-scroll-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
  .j-scroll-x,
  .j-scroll-y {
    position: absolute;
    pointer-events: all;
    transition:
      background-color 0.2s $curve,
      opacity 0.2s $curve,
      width 0.2s $curve,
      height 0.2s $curve,
      border-color 0.2s $curve;
    background-color: transparent;
    opacity: 0.4;
    &[data-dragging],
    &:hover {
      background-color: var(--ui-color-neutral-600);
      border-color: var(--ui-color-neutral-600);
    }
    .j-scroll-handle {
      background-color: var(--ui-color-neutral-400);
      transition:
        width 0.2s $curve,
        height 0.2s $curve,
        border-radius 0.2s $curve;
      width: 100%;
      height: 100%;
    }
  }
  &:hover {
    .j-scroll-x,
    .j-scroll-y {
      opacity: 0.8;
    }
  }

  .j-scroll-x {
    bottom: 0;
    left: 0;
    right: 0;
    height: $size;
    border-left: none;
    border-right: none;
    > .j-scroll-handle {
      height: $size;
      border-radius: math.div($size, 2);
    }
    &[data-dragging],
    &:hover {
      height: $hover-size;
      > .j-scroll-handle {
        height: $hover-size;
        border-radius: math.div($hover-size, 2);
      }
    }
  }

  .j-scroll-y {
    top: 0;
    right: 0;
    bottom: 0;
    width: $size;
    border-top: none;
    border-bottom: none;
    > .j-scroll-handle {
      width: $size;
      border-radius: math.div($size, 2);
    }
    &[data-dragging],
    &:hover {
      width: $hover-size;
      > .j-scroll-handle {
        width: $hover-size;
        border-radius: math.div($hover-size, 2);
      }
    }
  }
}
</style>
