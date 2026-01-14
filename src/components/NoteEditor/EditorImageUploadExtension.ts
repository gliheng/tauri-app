import { Node, mergeAttributes } from '@tiptap/core';
import type { CommandProps } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import { readFile } from '@/db-sqlite';
import EditorImageUploadNode from './EditorImageUploadNode.vue';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: () => ReturnType;
    };
  }
}

export const ImageUpload = Node.create({
  name: 'imageUpload',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {};
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })];
  },
  addNodeView() {
    return VueNodeViewRenderer(EditorImageUploadNode);
  },
  addCommands() {
    return {
      insertImageUpload:
        () =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },
});

// Create a plugin to handle file:// URLs for images
export const createFileImagePlugin = () => {
  const filePrefix = 'file://';

  return new Plugin({
    props: {
      nodeViews: {
        image: (node: any, _view: any, _getPos: any) => {
          const img = document.createElement('img');
          const { src, alt, title } = node.attrs;

          img.src = src || '';
          img.alt = alt || '';
          img.title = title || '';
          img.setAttribute('data-file-image', 'true');

          // Handle file:// URLs
          if (src?.startsWith(filePrefix)) {
            const id = Number(src.slice(filePrefix.length));
            readFile(id)
              .then((result) => {
                if (result?.file) {
                  img.src = URL.createObjectURL(result.file);
                }
              })
              .catch((err) => {
                console.error('Failed to load image from database:', err);
              });
          }

          return {
            dom: img,
            update: (updatedNode: any) => {
              if (updatedNode.type !== node.type) return false;
              if (updatedNode.attrs.src !== node.attrs.src) {
                const newSrc = updatedNode.attrs.src;
                img.src = newSrc || '';

                if (newSrc?.startsWith(filePrefix)) {
                  const id = Number(newSrc.slice(filePrefix.length));
                  readFile(id)
                    .then((result) => {
                      if (result?.file) {
                        img.src = URL.createObjectURL(result.file);
                      }
                    })
                    .catch((err) => {
                      console.error('Failed to load image from database:', err);
                    });
                }
              }
              img.alt = updatedNode.attrs.alt || '';
              img.title = updatedNode.attrs.title || '';
              return true;
            },
            ignoreMutation: (mutation: any) => {
              // Ignore mutations since we're managing src ourselves
              return mutation.type !== 'attributes' || mutation.attribute !== 'src';
            },
          };
        },
      } as any,
    },
  });
};

// Export the ImageUpload extension as default
export default ImageUpload;
