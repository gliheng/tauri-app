import mitt from "mitt";

export const eventBus = mitt<{
  lightbox: string | string[];
}>();
