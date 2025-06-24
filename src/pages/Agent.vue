<script setup lang="ts">
import { reactive } from "vue";
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const schema = z.object({
  name: z.string().min(8, "Must be at least 8 characters"),
  instructions: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  instructions: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: "Success",
    description: "The form has been submitted.",
    color: "success",
  });
  console.log(event.data);
}
</script>

<template>
  <div class="size-full px-4 py-2">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Name" name="name">
        <UInput v-model="state.name" />
      </UFormField>

      <UFormField label="Instructions" name="instructions">
        <UTextarea v-model="state.instructions" />
      </UFormField>

      <UButton type="submit"> Submit </UButton>
    </UForm>
  </div>
</template>
