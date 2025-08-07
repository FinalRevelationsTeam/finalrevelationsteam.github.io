import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import { QuartzTransformerPlugin } from "./types"


interface RawHeading {
  depth: number
  text:  string
  slug:  string
}

export interface ExplorerHeading {
  depth:    number
  text:     string
  slug:     string
  children: ExplorerHeading[]
}


function buildTree(flat: ExplorerHeading[]): ExplorerHeading[] {
  const root: ExplorerHeading[] = []
  const stack: ExplorerHeading[] = []

  for (const node of flat) {
    // pop until we find a parent with lower depth
    while (stack.length && node.depth <= stack[stack.length - 1].depth) {
      stack.pop()
    }
    if (!stack.length) root.push(node)
    else stack[stack.length - 1].children.push(node)
    stack.push(node)
  }

  return root
}


const remarkCollectRaw: Plugin<[], any, any> = () => (tree, file) => {
  const raw: RawHeading[] = []

  visit(tree, 'heading', (node: any) => {
    if (node.depth >= 1 && node.depth <= 3) {
      const text = node.children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.value)
        .join('')
        .trim()

      const slug = text
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/(^-|-$)/g, '')

      raw.push({ depth: node.depth, text, slug })
    }
  })

  file.data = file.data ?? {}
  file.data._rawHeadings = raw
}


export const explorerHeadings: QuartzTransformerPlugin = () => ({
  name: 'explorer-headings',


  markdown: {
    remarkPlugins: [remarkCollectRaw],
  },

  nodes: {
    File: {
      add: [
        ({ file }: { file: any; node: any }) => {
          const raw: RawHeading[] = file.data._rawHeadings || []

          const flat: ExplorerHeading[] = raw.map((h) => ({
            depth:    h.depth,
            text:     h.text,
            slug:     h.slug,
            children: [],
          }))

          const tree = buildTree(flat)

          file.data.explorerToc = tree
        },
      ],
    },
  },
})

declare module "vfile" {
  interface DataMap {
    explorerToc?: ExplorerHeading[]
  }
}
