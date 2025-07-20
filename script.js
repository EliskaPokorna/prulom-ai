document.addEventListener('DOMContentLoaded', () => {
  const root = getComputedStyle(document.documentElement);
  const cMain = root.getPropertyValue('--c-main').trim();
  const cAcc = root.getPropertyValue('--c-acc').trim();

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function palette(n) {
    const levels = [1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4];
    const colors = [];
    for (let i = 0; i < n; i++) {
      const base = i % 2 === 0 ? cAcc : cMain;
      const alpha = n <= 2 ? 1 : (levels[i] ?? 0.3);
      colors.push(n <= 2 ? base : hexToRgba(base, alpha));
    }
    return colors;
  }

  const highlight = {
    id: 'highlight',
    afterEvent(chart, args) {
      const e = args.event;
      if (e.type !== 'mousemove' && e.type !== 'mouseout') return;
      const act = chart.getActiveElements();
      chart.data.datasets.forEach(ds => {
        if (!ds._bg) ds._bg = ds.backgroundColor.slice();
        ds.backgroundColor = ds._bg.slice();
      });
      if (act.length) {
        const { datasetIndex: index, index: i } = act[0];
        chart.data.datasets.forEach((ds, di) => {
          ds.backgroundColor = ds.backgroundColor.map((c, ci) =>
            di === index && ci === i ? ds._bg[ci] : '#ccc'
          );
        });
      }
      chart.update('none');
    }
  };

  const charts = [];

/* GRAF 1 */

  const ctx1 = document.getElementById('pie-rules').getContext('2d');
  charts.push(new Chart(ctx1, {
  type: 'doughnut',
  data: {
    labels: ['bez pravidel', 'má pravidla'],
    datasets: [{ data: [97, 3], backgroundColor: palette(2), hoverOffset: 5 }]
  },
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 20 }
        }
      }
    }
  },
  plugins: [highlight]
}));



/* GRAF 1 */
  const ctx2 = document.getElementById('pie-use').getContext('2d');
  charts.push(new Chart(ctx2, {
  type: 'doughnut',
  data: {
    labels: ['Ne', 'Ano'],
    datasets: [{ data: [49, 51], backgroundColor: palette(2), hoverOffset: 5 }]
  },
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 20 }
        }
      }
    }
  },
  plugins: [highlight]
}));




/* GRAF 1 */
  const ctx3 = document.getElementById('bar-areas').getContext('2d');
  const areaLabels = [
    'generování textů a nápadů',
    'komunikace s občany',
    'generování obrázků',
    'práce s daty a tabulkami',
    'automatizace úkonů',
    'ostatní'
  ];
  const areaData = [55, 19, 13, 5, 3, 5];
  const singleColor = '#414a9a';
  const areaColors = areaData.map(() => singleColor);

  charts.push(new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: areaLabels,
      datasets: [{
        data: areaData,
        backgroundColor: areaColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          max: 60,
          ticks: {
            callback: v => v + '%',
            font: {
            size: () => window.innerWidth < 768 ? 10 : 16
          }
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            font: {
            size: () => window.innerWidth < 768 ? 10 : 16
          }
          },
          grid: { display: false }
        }
      }
    },
    plugins: [highlight]
  }));




/* GRAF 1 */
  const ctx4 = document.getElementById('detailed-attitude').getContext('2d');

  // Vlastní plugin na vykreslení hodnot uvnitř pruhů, jen od 768px
  const valueLabelsPlugin = {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      // vykresluj jen pak, když je viewport dost široký
      if (window.innerWidth < 1400) return;

      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, dsIndex) => {
        const meta = chart.getDatasetMeta(dsIndex);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index];
          // posuneme text mírně vlevo od konce pruhu
          const xPos = bar.x - 4;
          const yPos = bar.y;

          ctx.save();
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'right';        // zarovnáme doprava
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';         // bílá, aby vynikl na barevném pozadí
          ctx.fillText(`${value}%`, xPos, yPos);
          ctx.restore();
        });
      });
    }
  };

  const detailedAttitudeChart = new Chart(ctx4, {
    type: 'bar',
    data: {
      labels: [''],
      datasets: [
        { label: 'velmi nevýhodná (2 %)', data: [2],  backgroundColor: '#d74090'   },
        { label: 'spíše nevýhodná (4 %)', data: [4],  backgroundColor: '#d7409080' },
        { label: 'neutrální (45 %)',       data: [45], backgroundColor: '#414a9a80' },
        { label: 'spíše přínosná (40 %)',  data: [40], backgroundColor: '#414a9ab3' },
        { label: 'velmi přínosná (9 %)',  data: [9],  backgroundColor: '#414a9a'   }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 16 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed}%`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          max: 100,
          ticks: {
            callback: v => v + '%',
            font: { size: 16 }
          },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: {
            font: { size: 20 }
          },
          grid: { display: false }
        }
      }
    },
    plugins: [highlight, valueLabelsPlugin]
  });




  /* GRAF 5 */
const barrierValueLabels = {
  id: 'barrierValueLabels',
  afterDatasetsDraw(chart) {
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 12 : 18;    // 12px na mobilu, 16px od 768px
    const xOffset  = isMobile ? 28 : 42;    // +34 na mobilu, +40 na tabletu

    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      meta.data.forEach((bar, index) => {
        const value = dataset.data[index];
        const xPos  = bar.x + xOffset;
        const yPos  = bar.y;

        ctx.save();
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e2034';
        ctx.fillText(`${value}%`, xPos, yPos);
        ctx.restore();
      });
    });
  }
};

// 5. Překážky zavádění AI na obcích (s value labels)
const ctx5 = document.getElementById('bar-barriers').getContext('2d');
const barrierLabels = [
  'nízké povědomí o AI',
  'právní/etická nejasnost',
  'chybějící koncepce a vize',
  'nedostatečně školený personál',
  'nedostatek finančních prostředků',
  'nevyhovující technická infrastruktura',
  'odmítání AI ze strany pracovníků'
];
const barrierData = [33, 15, 15, 15, 13, 5, 4];

charts.push(new Chart(ctx5, {
  type: 'bar',
  data: {
    labels: barrierLabels,
    datasets: [{
      data: barrierData,
      backgroundColor: palette(barrierData.length)
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        max: 35,
        ticks: {
          callback: v => v + '%',
          font: { size: () => window.innerWidth < 768 ? 10 : 16 }
        },
        grid: { display: false }
      },
      y: {
        ticks: {
          font: { size: () => window.innerWidth < 768 ? 10 : 16 }
        },
        grid: { display: false }
      }
    }
  },
  plugins: [highlight, barrierValueLabels]
}));




  // Správa zobrazení titulku od 768px
  function updateChartTitle() {
    detailedAttitudeChart.options.plugins.title.display = window.innerWidth >= 768;
    detailedAttitudeChart.update();
  }
  window.addEventListener('resize', updateChartTitle);
  updateChartTitle();








  window.addEventListener('resize',()=>charts.forEach(c=>c.update()));

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.chart-container').forEach(el => obs.observe(el));
});



////////////////////
