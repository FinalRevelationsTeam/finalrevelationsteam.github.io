import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import Slugger from "github-slugger"

export interface Options {
  maxDepth: 1 | 2 | 3 | 4 | 5 | 6
  minEntries: number
  showByDefault: boolean
  collapseByDefault: boolean
}

const defaultOptions: Options = {
  maxDepth: 3,
  minEntries: 1,
  showByDefault: true,
  collapseByDefault: false,
}

interface TocEntry {
  depth: number
  text: string
  slug: string // this is just the anchor (#some-slug), not the canonical slug
}

const slugAnchor = new Slugger()
export const TableOfContents: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "TableOfContents",
    markdownPlugins() {
      return [
        () => {
          return async (tree: Root, file) => {
            const display = file.data.frontmatter?.enableToc ?? opts.showByDefault
            if (!display) return

            slugAnchor.reset()
            const toc: TocEntry[] = []
            let highestDepth: number = opts.maxDepth

            visit(tree, "heading", (node) => {
              if (node.depth <= opts.maxDepth) {
                const text = toString(node)
                highestDepth = Math.min(highestDepth, node.depth)
                toc.push({
                  depth: node.depth,
                  text,
                  slug: slugAnchor.slug(text),
                })
              }
            })

            visit(tree, "blockquote", (node) => {
              const firstChild = node.children?.[0]
              if (firstChild?.type === "paragraph") {
                const paragraphText = toString(firstChild).trim()
                const match = paragraphText.match(/^\[\!(\w+)\]\s+(.*)/)
                if (match) {
                  const [, calloutType, calloutTitle] = match
                  if (calloutTitle) {
                    toc.push({
                      depth: opts.maxDepth, // or a fixed depth like 2
                      text: calloutTitle,
                      slug: slugAnchor.slug(calloutTitle),
                    })
                  }
                }
              }
            })

            if (toc.length > opts.minEntries) {
              file.data.toc = toc.map((entry) => ({
                ...entry,
                depth: entry.depth - highestDepth,
              }))
              file.data.collapseToc = opts.collapseByDefault
            }
          }
        },
      ]
    },
  }
}


declare module "vfile" {
  interface DataMap {
    toc: TocEntry[]
    collapseToc: boolean
  }
}
