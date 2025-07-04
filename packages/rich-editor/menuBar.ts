import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { EditorView } from 'prosemirror-view';

@customElement('rich-editor-menu')
class RichEditorMenuElement extends LitElement {

  @property({
    attribute: false,
  })
  view: EditorView

  render() {
    return html`
      <header>
        
      </header>
    `;
  }
  static styles = css`
    header {
      height: 40px;
      border-bottom: 1px solid var(--re-menu-border-color, silver);
    }
  `;
}

