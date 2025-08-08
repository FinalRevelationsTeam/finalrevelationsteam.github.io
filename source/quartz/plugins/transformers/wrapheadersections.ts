import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Element, Root } from "hast"

export const WrapHeaderSections: QuartzTransformerPlugin = () => {
  return {
    name: "WrapHeaderSections",
    async transform(tree: Root) {
      const newChildren: Element[] = []
      let currentSection: Element | null = null

      for (const node of tree.children) {
        if (node.type === "element" && /^h[1-3]$/.test(node.tagName)) {
          // Start a new section
          currentSection = {
            type: "element",
            tagName: "div",
            properties: { className: ["header-section"] },
            children: [node],
          }
          newChildren.push(currentSection)
        } else if (currentSection) {
          // Add to current section
          currentSection.children.push(node)
        } else {
          // No section yet, just push normally
          newChildren.push(node as Element)
        }
      }

      tree.children = newChildren
      return tree
    },
  }
}