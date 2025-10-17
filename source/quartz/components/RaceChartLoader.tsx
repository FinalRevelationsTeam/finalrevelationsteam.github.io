import { QuartzComponent } from "./types"
// make sure Chart.js is available globally or import it:
// import Chart from "chart.js/auto"

export const RaceChartLoader: QuartzComponent = () => null

RaceChartLoader.afterDOMLoaded = `
  (function() {
    console.log("🏁 RaceChartLoader start, Chart:", window.Chart);

    const canvas = document.getElementById("race-chart");
    if (!canvas || !window.Chart) return;

    const rawConfig   = JSON.parse(canvas.dataset.chart);
    const { bpm, anger } = JSON.parse(canvas.dataset.config);

    // stash original data once
    if (!canvas.dataset.original) {
      const arr = Array.isArray(rawConfig.data)
        ? rawConfig.data
        : rawConfig.series?.[0]?.data || [];
      canvas.dataset.original = JSON.stringify(arr);
    }
    const originalData = JSON.parse(canvas.dataset.original);

    let chartInstance;

    function initOrUpdate(newData) {
      console.log("🔨 initOrUpdate – data:", newData);
      const bg = rawConfig.backgroundColor || 'rgba(54,162,235,0.5)';
      const bd = rawConfig.borderColor    || 'rgba(54,162,235,1)';
      const cfg = {
        type: rawConfig.type,
        data: {
          labels: rawConfig.labels,
          datasets: [{
            label: rawConfig.title || "Stats",
            data: newData,
            backgroundColor: bg,
            borderColor: bd,
            borderWidth: 1,
            fill: !!rawConfig.fill,
            tension: rawConfig.tension ?? 0
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
              suggestedMin: 1,
              suggestedMax: 10
            }
          }
        }
      };

      if (chartInstance) {
        chartInstance.data.datasets[0].data = newData;
        chartInstance.update("none");
      } else {
        console.log("🔨 Creating Chart.js instance with config:", cfg);
        chartInstance = new Chart(canvas, cfg);
        chartInstance.update("none");
      }
    }

    function renderRaceChart() {
      const useBpm   = !!document.getElementById("bp-toggle")?.checked;
      const useAnger = !!document.getElementById("anger-toggle")?.checked;
      const multiplier = (useBpm ? bpm : 1) * (useAnger ? anger : 1);

      const scaled = originalData.map(v => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n * multiplier : 0;
      });
      console.log("Rendering with multiplier", multiplier, "scaled:", scaled);
      initOrUpdate(scaled);
    }

    renderRaceChart();
    document.getElementById("bp-toggle")?.addEventListener("change", renderRaceChart);
    document.getElementById("anger-toggle")?.addEventListener("change", renderRaceChart);
  })();
`
