<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe } from "@milkdown/crepe";
import { readFile, writeFile } from "@/db-sqlite";

const model = defineModel({
  type: String,
  required: true,
});

const filePrefix = 'file://';
useEditor((root) => {
  const crepe = new Crepe({
    root,
    defaultValue: model.value,
    features: {
      [Crepe.Feature.ImageBlock]: true,
    },
    featureConfigs: {
      [Crepe.Feature.ImageBlock]: {
        onUpload: async (file) => {
          const id = await writeFile(file);
          return `${filePrefix}${id}`;
        },
        proxyDomURL: async (originalURL: string) => {
          if (!originalURL.startsWith(filePrefix)) return originalURL;
          const file = await readFile(Number(originalURL.slice(filePrefix.length)));
          return URL.createObjectURL(file?.file || new Blob());
        },
      },
    },
  });

  crepe.on((listener) => {
    listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
      if (markdown !== prevMarkdown) {
        model.value = markdown;
      }
    });
  });
  return crepe;
});
</script>

<template>
  <Milkdown />
</template>

<style lang="scss" src="@/assets/milkdown.scss"></style>
