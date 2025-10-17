import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"

function parseChartBlock(text: string): Record<string, any> {
    const lines = text.split("\n")
    const config: Record<string, any> = {}
  
    for (const line of lines) {
      const [key, ...rest] = line.split(":")
      if (!key || rest.length === 0) continue
  
      const rawValue = rest.join(":").trim()
      const trimmedKey = key.trim()
  
      let parsedValue: any = rawValue
  
      try {
        parsedValue = JSON.parse(rawValue)
      } catch {
        if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
          parsedValue = rawValue
            .slice(1, -1)
            .split(",")
            .map(s => s.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1"))
        }
      }
  
      config[trimmedKey] = parsedValue
    }
  
    return config
  }
  

export const ChartBlockPlugin: QuartzTransformerPlugin = () => {
  return {
    name: "ChartBlockPlugin",
    markdownPlugins() {
      return [
        () => (tree) => {
          visit(tree, "code", (node, index, parent) => {
            if (node.lang === "chart" && typeof(index) === "number") {
              const config = parseChartBlock(node.value)
              const html = `<div class="popover-hint"><canvas class="chart-block" data-chart='${JSON.stringify(config)}' width="400" height="200"></canvas></div>`
              parent.children[index] = {
                type: "html",
                value: html,
              }
            }
          })
        },
      ]
    },
  }
}
