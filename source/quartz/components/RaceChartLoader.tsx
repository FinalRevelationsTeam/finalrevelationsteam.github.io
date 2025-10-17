import { QuartzComponent } from "./types"
// make sure Chart.js is available globally or import it:
// import Chart from "chart.js/auto"

export const RaceChartLoader: QuartzComponent = () => null

RaceChartLoader.afterDOMLoaded = `
(function() {
  console.log("🏁 RaceChartLoader start, Chart:", window.Chart);
  if (!window.Chart) return;

  const canvases = document.querySelectorAll("canvas.chart-block");
  canvases.forEach((canvas) => {
    const rawConfig = JSON.parse(canvas.dataset.chart);
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
            legend: { display: false }
          },
          scales: {
            y: { suggestedMin: 1, suggestedMax: 10 }
          }
        }
      };
    
      if (chartInstance) {
        chartInstance.destroy(); // 💥 destroy the old chart
      }
    
      chartInstance = new Chart(canvas, cfg);
      chartInstance.update("none");
    }
    

    function renderRaceChart() {
      const bpToggle = canvas.parentElement.querySelector("input[id^='bp-toggle']");
      const angerToggle = canvas.parentElement.querySelector("input[id^='anger-toggle']");
      const useBpm = bpToggle?.checked;
      const useAnger = angerToggle?.checked;
      const multiplier = (useBpm ? bpm : 1) * (useAnger ? anger : 1);
    
      const exemptLabels = ["SPD", "RCV", "RGN"];
      const labels = rawConfig.labels || [];
    
      const scaled = originalData.map((v, i) => {
        const label = labels[i];
        const n = parseFloat(v);
        const shouldScale = !exemptLabels.includes(label);
        return Number.isFinite(n) ? n * (shouldScale ? multiplier : 1) : 0;
      });
    
      initOrUpdate(scaled);
    }
    

    renderRaceChart();

    const bpToggle = canvas.parentElement.querySelector("input[id^='bp-toggle']");
    const angerToggle = canvas.parentElement.querySelector("input[id^='anger-toggle']");
    bpToggle?.addEventListener("change", renderRaceChart);
    angerToggle?.addEventListener("change", renderRaceChart);
  });
})();
`
