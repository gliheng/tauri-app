import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { baseKeymap, setBlockType } from "prosemirror-commands";
import { EditorView } from "prosemirror-view";
import { schema } from 'prosemirror-schema-basic';
import pmStyle from "prosemirror-view/style/prosemirror.css?raw";


@customElement('rich-editor')
class LitExample extends LitElement {
  el = createRef<HTMLElement>()

  view?: EditorView

  firstUpdated() {
    let state = EditorState.create({
      schema,
      plugins: [
        history(),
        keymap({"Mod-z": undo, "Mod-y": redo}),
        keymap(baseKeymap),
        keymap({
          'Mod-x': setBlockType(schema.nodes.heading, { level: 1 }),
        }),
      ]
    });

    const view = new EditorView(this.el.value!, {
      state,
      dispatchTransaction(tr) {
        let newState = view.state.apply(tr);
        view.updateState(newState);
      },
    });

    this.view = view;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.view?.destroy();
  }

  render() {
    return html`
      <style>${pmStyle}</style>
      <div class="root" ${ref(this.el)}></div>
    `;
  }

  static styles = css`
    :host {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }
    .root {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .ProseMirror {
      display: flow-root;
      padding: 4px 8px;
      flex: 1;
    }
  `
}