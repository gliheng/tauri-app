# Raven
An agent chat application built with vue and tauri.

## Build Commands

### Development
- `yarn dev` - Start Vite dev server (port 1420)
- `yarn tauri dev` - Start full Tauri app with hot reload
- `yarn tauri dev --release` - Start Tauri in release mode (faster)

### Building
- `yarn build` - Build frontend for production
- `yarn tauri build` - Build full desktop application
- `yarn tauri build --debug` - Build debug version

### Type Checking
- `yarn vue-tsc --noEmit` - TypeScript type checking (run this before committing)
- No ESLint/Prettier configured - use TypeScript compiler for linting

### Testing
- No test framework configured - test commands are TBD
- For Tauri commands: `cargo test --manifest-path=src-tauri/Cargo.toml`
- To run a single test: `cargo test test_name --manifest-path=src-tauri/Cargo.toml`

## Code Style Guidelines

### Vue Components
- Use `<script setup lang="ts">` syntax
- Import order: Vue imports → third-party → local imports (use `@/` alias)
- Props defined with `defineProps()` using explicit types
- Composables imported from `@/hooks/`
- Components from @nuxt/ui are auto-imported (no import statements needed)

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { PropType } from "vue";
import { SomeService } from "@/services/someService";

const props = defineProps({
  chatId: {
    type: String,
    required: true,
  },
});

const data = ref<string>("");
const computedValue = computed(() => data.value.length);
</script>
```

### TypeScript Files
- Export interfaces/types at module level for reuse
- Use explicit return types on functions
- Error handling: try/catch with typed errors where possible
- Date handling: use ISO strings for storage, Date objects in code

```typescript
export interface Chat {
  id: string;
  topic: string;
  createdAt: Date;
}

export async function getChat(chatId: string): Promise<Chat | undefined> {
  if (!db) throw new Error('Database not initialized');
  // implementation
}
```

### Rust/Tauri Handlers
- Add commands to `src-tauri/src/handlers.rs`
- Use `#[tauri::command]` macro for exposed functions
- Return `Result<serde_json::Value, serde_json::Value>` for error handling
- Structs derive `Deserialize, Serialize` with `#[serde]` attributes
- Snake_case for variables/functions, PascalCase for types

```rust
#[derive(Deserialize, Debug)]
pub struct ModelSettings {
    #[serde(alias = "model")]
    model: String,
    #[serde(alias = "baseUrl")]
    base_url: String,
}

#[tauri::command]
pub async fn acp_initialize(
    agent: &str,
    settings: Option<ModelSettings>,
    app: tauri::AppHandle,
    window: tauri::Window,
) -> Result<serde_json::Value, serde_json::Value> {
    // implementation
}
```

### Naming Conventions
- Vue components: PascalCase (e.g., `AgentChat.vue`, `ChatBox.vue`)
- Functions/variables: camelCase (e.g., `getChat`, `chatId`)
- Constants: UPPER_SNAKE_CASE (e.g., `DB_PATH`, `ROOT_NODE_ID`)
- Types/interfaces: PascalCase (e.g., `Chat`, `AgentProgram`)
- Rust functions/variables: snake_case (e.g., `acp_initialize`, `model_settings`)

### Error Handling
- Frontend: try/catch blocks, display errors to user via toast
- Rust: `Result<T, serde_json::Value>` for commands returning JSON
- Always check `db` initialization before queries
- Console errors only for debugging, not user-facing

### Styling
- Use Tailwind CSS classes only (no custom CSS unless necessary)
- Use @nuxt/ui components for UI elements
- Use scoped `<style lang="scss">` only when Tailwind isn't sufficient
- No BEM or CSS-in-JS conventions needed

### Database Operations
- All DB operations in `src/db/index.ts`
- Use parameterized queries to prevent SQL injection
- Date fields: store as ISO strings, parse to Date objects in code
- Tables created via Rust migrations in `src-tauri/migrations/`

### Path Aliases
- `@/*` → `./src/*` (configured in tsconfig.json and vite.config.ts)
- Import local files using: `import { X } from "@/services/x"`

## Project Structure
- `src/` - Vue frontend (components, pages, stores, services)
- `src-tauri/` - Rust backend (handlers, migrations)
- `src/components/` - Reusable Vue components
- `src/stores/` - Pinia state management
- `src/hooks/` - Vue composition API hooks
- `src-tauri/src/handlers.rs` - Tauri command definitions

## Important Notes
- Components in nuxt-ui are imported automaticly. `import` statement is not needed.
- Tauri commands should be added to file `src-tauri/src/handlers.rs`.
- Use tailwind for CSS.
- Run `yarn vue-tsc --noEmit` before committing to ensure type safety.
- Project uses `yarn` package manager with node-modules linker.
