import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { EditorView } from 'prosemirror-view';
import { Plugin, EditorState, NodeSelection, Transaction, Command } from 'prosemirror-state';
import { undo, redo, undoDepth, redoDepth } from "prosemirror-history";
import { toggleMark, lift, joinUp, selectParentNode, wrapIn, setBlockType } from "prosemirror-commands"
import { Attrs, MarkType, NodeType } from 'prosemirror-model';
import { map } from 'lit/directives/map.js';
import { schema } from './schema';

function markActive(state: EditorState, type: MarkType) {
  let {from, $from, to, empty} = state.selection
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks())
  else return state.doc.rangeHasMark(from, to, type)
}

@customElement('rich-editor-menu')
class RichEditorMenuElement extends LitElement {

  @property({
    attribute: false,
  })
  view: EditorView

  @state()
  enableMap = {}

  @state()
  activeMap = {}

  updateView() {
    this.enableMap = Object.fromEntries(menuBarItems.map(e => [e.name, e.enable?.(this.view.state)]).filter(e => e[1] !== undefined));
    this.activeMap = Object.fromEntries(menuBarItems.map(e => [e.name, e.active?.(this.view.state)]).filter(e => e[1] !== undefined));
  }

  runMenuCommand = (menuItem: MenuItem, evt: PointerEvent) => {
    evt.preventDefault();
    menuItem.run(this.view.state, this.view.dispatch, this.view);
  }

  render() {
    return html`
      <header>
        ${map(menuBarItems, (e) => html`
          <button
            @mousedown=${this.runMenuCommand.bind(null, e)}
            .disabled=${!(this.enableMap[e.name] ?? true)}
            ?data-active=${this.activeMap[e.name]}
          >${e.title}</button>`)}
      </header>
    `;
  }

  static styles = css`
    header {
      height: 40px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.5rem;
      box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px;
    }
    button {
      border: 1px solid var(--ui-border-muted);
    }
    button[data-active] {
      background-color: var(--ui-color-primary-200);
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

interface MenuOptions {
  name: string;
  title?: string;
  icon?: string;
}

interface MenuItem extends MenuOptions {
  enable?: (state: EditorState) => boolean;
  active?: (state: EditorState) => boolean;
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => void;
}

export function blockTypeItem(options: MenuOptions & {
  nodeType: NodeType;
  attrs?: Attrs;
}): MenuItem {
  const { nodeType, attrs, ...rest } = options;
  let command = setBlockType(nodeType, attrs);
  return {
    ...rest,
    enable(state: EditorState) { return command(state) },
    active(state: EditorState) {
      let { $from, to, node } = state.selection as NodeSelection;
      if (node) return node.hasMarkup(nodeType, attrs);
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, attrs);
    },
    run: command,
  }
}

export function blockTypeToggleItem(options: MenuOptions & {
  nodeType: NodeType;
  attrs?: Attrs;
}): MenuItem {
  const { nodeType, attrs, ...rest } = options;
  return {
    ...rest,
    active(state: EditorState) {
      let { $from, to, node } = state.selection as NodeSelection;
      if (node) return node.hasMarkup(nodeType, attrs);
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, attrs);
    },
    run(state, dispatch, view) {
      let command: Command;
      if (this.active!(state)) {
        const paragraphType = schema.nodes.paragraph;
        command = setBlockType(paragraphType);
      } else {
        command = setBlockType(nodeType, attrs);
      }
      command(state, dispatch, view);
    },
  }
}

export function markItem(options: MenuOptions & {
  markType: MarkType;
}) {
  const { markType, ...rest } = options;
  return {
    ...rest,
    active(state: EditorState) {
      return markActive(state, markType);
    },
    run(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) {
      toggleMark(markType)(state, dispatch, view);
      view.focus();
    },
  };
}

const menuBarItems: MenuItem[] = [
  {
    name: 'undo',
    title: 'Undo',
    run: undo,
    enable(state: EditorState) { return undoDepth(state) == 0 },
  },
  {
    name: 'redo',
    title: 'Redo',
    run: redo,
    enable(state: EditorState) { return redoDepth(state) == 0 },
  },
  blockTypeToggleItem({
    name: 'heading',
    title: 'Heading',
    icon: '',
    nodeType: schema.nodes.heading,
    attrs: {
      level: 2,
    },
  }),
  blockTypeToggleItem({
    name: 'code',
    title: 'Code block',
    icon: '',
    nodeType: schema.nodes.code_block,
  }),
  markItem({
    name: 'strong',
    title: 'Strong',
    icon: '',
    markType: schema.marks.strong,
  }),
];
