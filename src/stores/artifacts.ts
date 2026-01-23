import { ref, computed } from "vue";
import { defineStore } from "pinia";

export type ArtifactType = 'workspace' | 'terminal';

export interface Artifact {
  id: string;
  type: ArtifactType;
  key: string;
}

export interface SelectionContext {
  file?: {
    path: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: number;
    end: number;
  };
}

export const useArtifactsStore = defineStore("artifacts", () => {
  const artifacts = ref<Artifact[]>([]);
  const activeArtifactKey = ref<string | undefined>(undefined);
  const selectionContexts = ref<Map<string, SelectionContext>>(new Map());

  const activeArtifact = computed(() =>
    artifacts.value.find(a => a.key === activeArtifactKey.value) || undefined
  );

  const activeContext = computed(() => {
    if (!activeArtifactKey.value) return undefined;
    return selectionContexts.value.get(activeArtifactKey.value);
  });

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

    // Clean up selection context for removed artifact
    selectionContexts.value.delete(removedKey);
  }

  function setActiveArtifact(key: string) {
    activeArtifactKey.value = key;
  }

  function setContext(artifactKey: string, context: Partial<SelectionContext>) {
    const existing = selectionContexts.value.get(artifactKey) || {};
    selectionContexts.value.set(artifactKey, { ...existing, ...context });
  }

  function getContext(artifactKey: string): SelectionContext | undefined {
    return selectionContexts.value.get(artifactKey);
  }

  return {
    artifacts,
    activeArtifactKey,
    activeArtifact,
    selectionContexts,
    activeContext,
    addArtifact,
    removeArtifact,
    setActiveArtifact,
    setContext,
    getContext,
  };
});
