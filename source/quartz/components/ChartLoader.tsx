import { QuartzComponent } from "./types"
export const ChartLoader: QuartzComponent = () => null


ChartLoader.afterDOMLoaded = `
  function renderCharts() {
    if (typeof window.Chart !== "function") {
      console.warn("Chart.js is not loaded. Chart rendering skipped.")
      return
    }

    document.querySelectorAll(".chart-block").forEach(canvas => {
      try {
        const config = JSON.parse(canvas.dataset.chart)
        new Chart(canvas, {
          type: config.type || "bar",
          data: {
            labels: config.labels,
            datasets: [{
              label: config["- title"] || "Dataset",
              data: config.data,
              fill: config.fill ?? true,
              tension: config.tension ?? 0.4,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: config.beginAtZero ?? true
              }
            }
          }
        })
      } catch (err) {
        console.error("Chart rendering failed:", err)
      }
    })
  }

  // Initial render
  renderCharts()

  // Re-render on Quartz navigation
  document.addEventListener("nav", () => {
    renderCharts()
  })
`

