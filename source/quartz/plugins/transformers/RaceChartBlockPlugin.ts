import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import type { Parent } from "unist"

function parseRaceChartBlock(text: string): {
  bpm: number
  anger: number
  chart: Record<string, any>
} {
  const lines = text.split("\n")
  const chart: Record<string, any> = {}
  let bpm = 1
  let anger = 1

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
          .map(s => s.trim().replace(/^["'](.*)["']$/, "$1"))
      }
    }

    if (trimmedKey === "bpm") bpm = parseFloat(rawValue)
    else if (trimmedKey === "anger") anger = parseFloat(rawValue)
    else chart[trimmedKey] = parsedValue
  }

  return { bpm, anger, chart }
}

function generateChartId() {
  return "race-chart-" + Math.random().toString(36).slice(2, 10)
}

const chartId = generateChartId()
const bpId = `bp-toggle-${chartId}`
const angerId = `anger-toggle-${chartId}`

export const RaceChartBlockPlugin: QuartzTransformerPlugin = () => ({
  name: "RaceChartBlockPlugin",
  markdownPlugins() {
    return [
      () => (tree) => {
        visit(tree, "code", (node, index, parent) => {
          if (node.lang !== "RaceChart" || typeof index !== "number" || !parent)
            return

          const { bpm, anger, chart } = parseRaceChartBlock(node.value)
          const chartJson  = JSON.stringify(chart)
          const configJson = JSON.stringify({ bpm, anger })

          const html = `
<canvas
  class="chart-block"
  id="${chartId}"
  data-chart='${chartJson}'
  data-config='${configJson}'
  width="400"
  height="200"
></canvas>
<div class="race-stats-controls">
  <center>
    <label><input type="checkbox" id="${bpId}" checked />×BP</label>
    <br>
    <label><input type="checkbox" id="${angerId}" checked />×Anger</label>
  </center>
</div>
`.trim()


          parent.children[index] = {
            type: "html",
            value: html,
          }
        })
      },
    ]
  },
})

