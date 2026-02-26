import { ref } from "vue";
import { defineStore } from "pinia";
import { getImages, deleteImage as dbDeleteImage, type ImageWithFile } from "@/db";

export const useImagesStore = defineStore("images", () => {
  const images = ref<ImageWithFile[]>([]);

  async function loadImages() {
    images.value = await getImages();
  }

  async function deleteImage(id: string) {
    await dbDeleteImage(id);
    images.value = images.value.filter(img => img.id !== id);
  }

  return {
    images,
    loadImages,
    deleteImage,
  };
});
