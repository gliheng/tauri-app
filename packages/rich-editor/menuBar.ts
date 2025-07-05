import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { undo, redo, undoDepth, redoDepth } from "prosemirror-history";
import { Plugin } from 'prosemirror-state';

@customElement('rich-editor-menu')
class RichEditorMenuElement extends LitElement {

  @property({
    attribute: false,
  })
  view: EditorView

  updateView() {
    const { state } = this.view
    this.undoDisabled = undoDepth(state) == 0;
    this.redoDisabled = redoDepth(state) == 0;
  }

  @state()
  undoDisabled = true
  undo = () => {
    const { state, dispatch } = this.view
    undo(state, dispatch, this.view);
  }

  @state()
  redoDisabled = true
  redo = () => {
    const { state, dispatch } = this.view
    redo(state, dispatch, this.view);
  }

  render() {
    return html`
      <header>
        <button @click=${this.undo} .disabled=${this.undoDisabled}>undo</button>
        <button @click=${this.redo} .disabled=${this.redoDisabled}>redo</button>
      </header>
    `;
  }

  static styles = css`
    header {
      height: 40px;
      border-bottom: 1px solid var(--re-menu-border-color, silver);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.5rem;
    }
  `;
}

export const menuBar = () => {
  return new Plugin({
    view(editorView) {
      const menu = document.createElement('rich-editor-menu') as RichEditorMenuElement;
      menu.view = editorView;
      const wrapper = document.createElement('div');
      wrapper.className = 'wrapper';
      if (editorView.dom.parentNode) {
        editorView.dom.parentNode.replaceChild(wrapper, editorView.dom);
      }
      wrapper.appendChild(menu);
      wrapper.appendChild(editorView.dom);

      return {
        update(view: EditorView, lastState?: EditorState) {
          menu.updateView();
        },
      };
    }
  });
}