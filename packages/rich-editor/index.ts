import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { undo, redo, history } from "prosemirror-history";
import { toggleMark, wrapIn, chainCommands, exitCode, setBlockType, joinUp, joinDown, lift, selectParentNode, baseKeymap } from 'prosemirror-commands';
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { undoInputRule, smartQuotes, ellipsis, emDash, wrappingInputRule, textblockTypeInputRule, inputRules } from 'prosemirror-inputrules';
import pmStyle from "prosemirror-view/style/prosemirror.css?raw";
import { Schema } from 'prosemirror-model';
import { menuBar } from './menuBar';
import { schema } from './schema';

@customElement('rich-editor')
class RichEditorElement extends LitElement {
  view?: EditorView

  el = createRef<HTMLElement>()

  firstUpdated() {
    let plugins = [
      buildInputRules(schema),
      keymap(buildKeymap(schema)),
      keymap(baseKeymap),
      dropCursor(),
      gapCursor(),
      history(),
      menuBar(),
    ];

    const state = EditorState.create({
      schema,
      plugins,
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
    }
    .wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .ProseMirror {
      display: flow-root;
      padding: 4px 8px;
      flex: 1;
      outline: none;
    }
  `
}

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

function buildKeymap(schema: Schema, mapKeys?: any) {
    let keys = {}, type;
    function bind(key, cmd) {
        if (mapKeys) {
            let mapped = mapKeys[key];
            if (mapped === false)
                return;
            if (mapped)
                key = mapped;
        }
        keys[key] = cmd;
    }
    bind("Mod-z", undo);
    bind("Shift-Mod-z", redo);
    bind("Backspace", undoInputRule);
    if (!mac)
        bind("Mod-y", redo);
    bind("Alt-ArrowUp", joinUp);
    bind("Alt-ArrowDown", joinDown);
    bind("Mod-BracketLeft", lift);
    bind("Escape", selectParentNode);
    if (type = schema.marks.strong) {
        bind("Mod-b", toggleMark(type));
        bind("Mod-B", toggleMark(type));
    }
    if (type = schema.marks.em) {
        bind("Mod-i", toggleMark(type));
        bind("Mod-I", toggleMark(type));
    }
    if (type = schema.marks.code)
        bind("Mod-`", toggleMark(type));
    if (type = schema.nodes.bullet_list)
        bind("Shift-Ctrl-8", wrapInList(type));
    if (type = schema.nodes.ordered_list)
        bind("Shift-Ctrl-9", wrapInList(type));
    if (type = schema.nodes.blockquote)
        bind("Ctrl->", wrapIn(type));
    if (type = schema.nodes.hard_break) {
        let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch)
                dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
            return true;
        });
        bind("Mod-Enter", cmd);
        bind("Shift-Enter", cmd);
        if (mac)
            bind("Ctrl-Enter", cmd);
    }
    if (type = schema.nodes.list_item) {
        bind("Enter", splitListItem(type));
        bind("Mod-[", liftListItem(type));
        bind("Mod-]", sinkListItem(type));
    }
    if (type = schema.nodes.paragraph)
        bind("Shift-Ctrl-0", setBlockType(type));
    if (type = schema.nodes.code_block)
        bind("Shift-Ctrl-\\", setBlockType(type));
    if (type = schema.nodes.heading)
        for (let i = 1; i <= 6; i++)
            bind("Shift-Ctrl-" + i, setBlockType(type, { level: i }));
    if (type = schema.nodes.horizontal_rule) {
        let hr = type;
        bind("Mod-_", (state, dispatch) => {
            if (dispatch)
                dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
            return true;
        });
    }
    return keys;
}

/**
Given a blockquote node type, returns an input rule that turns `"> "`
at the start of a textblock into a blockquote.
*/
function blockQuoteRule(nodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
}
/**
Given a list node type, returns an input rule that turns a number
followed by a dot at the start of a textblock into an ordered list.
*/
function orderedListRule(nodeType) {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs.order == +match[1]);
}
/**
Given a list node type, returns an input rule that turns a bullet
(dash, plush, or asterisk) at the start of a textblock into a
bullet list.
*/
function bulletListRule(nodeType) {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}
/**
Given a code block node type, returns an input rule that turns a
textblock starting with three backticks into a code block.
*/
function codeBlockRule(nodeType) {
    return textblockTypeInputRule(/^```$/, nodeType);
}
/**
Given a node type and a maximum level, creates an input rule that
turns up to that number of `#` characters followed by a space at
the start of a textblock into a heading whose level corresponds to
the number of `#` signs.
*/
function headingRule(nodeType, maxLevel) {
    return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, match => ({ level: match[1].length }));
}
/**
A set of input rules for creating the basic block quotes, lists,
code blocks, and heading.
*/
function buildInputRules(schema) {
    let rules = smartQuotes.concat(ellipsis, emDash), type;
    if (type = schema.nodes.blockquote)
        rules.push(blockQuoteRule(type));
    if (type = schema.nodes.ordered_list)
        rules.push(orderedListRule(type));
    if (type = schema.nodes.bullet_list)
        rules.push(bulletListRule(type));
    if (type = schema.nodes.code_block)
        rules.push(codeBlockRule(type));
    if (type = schema.nodes.heading)
        rules.push(headingRule(type, 6));
    return inputRules({ rules });
}
