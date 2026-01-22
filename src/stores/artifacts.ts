import { ref, computed } from "vue";
import { defineStore } from "pinia";

export type ArtifactType = 'workspace' | 'terminal';

export interface Artifact {
  id: string;
  type: ArtifactType;
  key: string;
}

export const useArtifactsStore = defineStore("artifacts", () => {
  const artifacts = ref<Artifact[]>([]);
  const activeArtifactKey = ref<string | undefined>(undefined);

  const activeArtifact = computed(() =>
    artifacts.value.find(a => a.key === activeArtifactKey.value) || undefined
  );

  function addArtifact(id: string, type: ArtifactType) {
    const key = `${type}::${id}`;
    const existing = artifacts.value.find(a => a.key === key);
    if (existing) {
      activeArtifactKey.value = key;
    } else {
      artifacts.value.push({ id, type, key });
      activeArtifactKey.value = key;
    }
  }

  function removeArtifact(id: string) {
    const index = artifacts.value.findIndex(a => a.id === id);
    if (index === -1) return;

    const removedKey = artifacts.value[index].key;
    artifacts.value.splice(index, 1);
    
    if (activeArtifactKey.value === removedKey) {
      activeArtifactKey.value = artifacts.value.length > 0
        ? artifacts.value[artifacts.value.length - 1]!.key
        : undefined;
    }
  }

  function setActiveArtifact(key: string) {
    activeArtifactKey.value = key;
  }

  return {
    artifacts,
    activeArtifactKey,
    activeArtifact,
    addArtifact,
    removeArtifact,
    setActiveArtifact,
  };
});
