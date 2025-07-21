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

// umí vzít hex nebo rgb/rgba string a nastavit novou alfa
function toRgba(color, alpha) {
  if (color.startsWith('#')) {
    return hexToRgba(color, alpha);
  }
  // foo: "rgb(r,g,b)" nebo "rgba(r,g,b,x)"
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(',').map(s=>s.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }
  return color;
}

// nový plugin, rychlejší a s draw(), ne update()
const fadeOthersFast = {
  id: 'fadeOthersFast',
  beforeEvent(chart, args) {
    const e = args.event;
    if (e.type !== 'mousemove' && e.type !== 'mouseout') return;

    // ulož původní barvy jednou
    chart.data.datasets.forEach(ds => {
      if (!ds._orig) ds._orig = ds.backgroundColor.slice();
    });

    const active = chart.getActiveElements();
    if (active.length) {
      const { datasetIndex: di, index: i } = active[0];
      chart.data.datasets.forEach((ds, idx) => {
        ds.backgroundColor = ds._orig.map((c, ci) =>
          (idx === di && ci === i)
            ? ds._orig[ci]
            : toRgba(ds._orig[ci], 0.2)
        );
      });
    } else {
      // žádný hover → vrať všechny barvy
      chart.data.datasets.forEach(ds => {
        ds.backgroundColor = ds._orig.slice();
      });
    }

    // redraw bez resetu tooltipu
    chart.draw();
  }
};

 // GENERIC ANIMATION FUNCTION -----------------------------------------
  function animateChart(chart) {
    // collect all items
    const items = [];
    chart.data.datasets.forEach((ds, di) => {
      ds.data.forEach((v, idx) => items.push({ di, idx, value: v }));
    });
    // init to zero
    chart.data.datasets.forEach(ds => { ds.data = ds.data.map(() => 0); });
    chart.update();
    // sort descending
    items.sort((a, b) => b.value - a.value);
    // sequentially animate
    items.forEach((item, k) => {
      setTimeout(() => {
        chart.data.datasets[item.di].data[item.idx] = item.value;
        chart.update();
      }, k * 400);
    });
  }

  const charts = [];
  const observers = [];

  function observeAnimation(container, chartObj) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio === 1) {
          animateChart(chartObj);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 1.0 });
    obs.observe(container);
    observers.push(obs);
  }



  //////////////
const dataLabelPlugin = {
  id: 'dataLabelPlugin',
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      meta.data.forEach((arc, index) => {
        const value = dataset.data[index];
        // pokud je hodnota 0, štítek nekresli
        if (value === 0) return;

        // spočti pozici štítku
        const { x, y } = arc.tooltipPosition();
        // styl textu
        ctx.fillStyle = '#fff';
        ctx.font = 'regular 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // vykresli
        ctx.fillText(`${value}%`, x, y);
      });
    });
  }
};


/* GRAF 1 */

const ctx1 = document.getElementById('pie-rules').getContext('2d');
const chart1 = new Chart(ctx1, {
  type: 'doughnut',
  data: {
    labels: ['bez pravidel', 'má pravidla'],
    datasets: [{
      data: [97, 3],
      backgroundColor: palette(2),
      hoverOffset: 5
    }]
  },
  plugins: [fadeOthersFast, dataLabelPlugin],
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 20 } }
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: ctx => `${ctx.parsed}%`
        }
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    }
  }
});
charts.push(chart1);
observeAnimation(document.getElementById('pie-rules').parentElement, chart1);


/* GRAF 2 */
const areaValueLabels = {
  id: 'areaValueLabels',
  afterDatasetsDraw(chart) {
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 12 : 18;
    const xOffset  = isMobile ? 28 : 42;

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
        ctx.fillStyle = '#1e2034'; // tmavá barva textu
        ctx.fillText(`${value}%`, xPos, yPos);
        ctx.restore();
      });
    });
  }
};

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return {
    r: (num >> 16) & 0xFF,
    g: (num >> 8)  & 0xFF,
    b: num & 0xFF
  };
}

// Funkce pro generování odstínů dané barvy (základní hex + procento zesvětlení/ztmavení)
function shadeColor(color, percent) {
  // color jako "#rrggbb", percent v rozsahu -100..100
  const num = parseInt(color.slice(1), 16);
  const r = (num >> 16);
  const g = (num >> 8) & 0x00FF;
  const b = num & 0x0000FF;

  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;

  const R = Math.round((t - r) * p + r);
  const G = Math.round((t - g) * p + g);
  const B = Math.round((t - b) * p + b);

  return `#${(0x1000000 + (R << 16) + (G << 8) + B)
    .toString(16)
    .slice(1)}`;
}

const ctx2 = document.getElementById('bar-areas').getContext('2d');
const areaLabels = [
  'generování textů a nápadů',
  'komunikace s občany',
  'generování obrázků',
  'práce s daty a tabulkami',
  'automatizace úkonů',
  'ostatní'
];
const areaData = [55, 19, 13, 5, 3, 5];
const basePurple = '#414a9a';

// Převod do RGB
const { r, g, b } = hexToRgb(basePurple);

// Pole alfa hodnot od 1 (nejtmavší/opaque) po např. 0.2 (nejsvětlejší/průhlednější)
const alphas = [1, 0.8, 0.6, 0.5, 0.3, 0.2];

// Vytvoříme RGBA barvy
const areaColors = alphas.map(alpha => `rgba(${r}, ${g}, ${b}, ${alpha})`);

const chart2 = new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: areaLabels,
    datasets: [{
      data: areaData,
      backgroundColor: areaColors
    }]
  },
  plugins: [areaValueLabels, fadeOthersFast],
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: ctx => `${ctx.parsed.x}%`
        }
      }
    },
    scales: {
      x: {
        max: 60,
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
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    }
  }
});
charts.push(chart2);
observeAnimation(document.getElementById('bar-areas').parentElement, chart2);


/* GRAF 3 */
  const ctx3 = document.getElementById('detailed-attitude').getContext('2d');

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

  //const detailedAttitudeChart = new Chart(ctx3, {
  const chart3 = new Chart(ctx3, {
  type: 'bar',
  data: {
    labels: [''],  // jediná kategorie, necháme prázdnou
    datasets: [
      { label: 'velmi nevýhodná',  data: [2],  backgroundColor: '#d74090'   },
      { label: 'spíše nevýhodná',  data: [4],  backgroundColor: '#d7409080' },
      { label: 'neutrální',      data: [45], backgroundColor: '#414a9a80' },
      { label: 'spíše přínosná', data: [40], backgroundColor: '#414a9ab3' },
      { label: 'velmi přínosná',  data: [9],  backgroundColor: '#414a9a'   }
    ]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 20 } }
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          title: items => items[0].dataset.label,
          label: ctx => `${ctx.parsed.x}%`
        }
      }
    },

    // aby hover fungoval okamžitě jako u Grafů 2 a 4
    interaction: {
      mode: 'nearest',
      intersect: true
    },
    hover: {
      mode: 'nearest',
      intersect: true
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
  plugins: [valueLabelsPlugin]
});
charts.push(chart3);
observeAnimation(document.getElementById('detailed-attitude').parentElement, chart3);



/* GRAF 4 – růžový */
const barrierValueLabels = {
  id: 'barrierValueLabels',
  afterDatasetsDraw(chart) {
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 12 : 18;
    const xOffset  = isMobile ? 28 : 42;

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

const ctx4 = document.getElementById('bar-barriers').getContext('2d');
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

// Základní růžová barva
const basePink = '#d74090';

// Převod do RGB
const { r: r2, g: g2, b: b2 } = hexToRgb(basePink);

// Pole alfa hodnot (1 = nejsytější, 0.2 = nejsvětlejší)
const alphas2 = [1, 0.8, 0.6, 0.5, 0.3, 0.2, 0.1];

// Vytvoříme RGBA barvy
const barrierColors = alphas2.map(alpha => `rgba(${r2}, ${g2}, ${b2}, ${alpha})`);

const chart4 = new Chart(ctx4, {
  type: 'bar',
  data: {
    labels: barrierLabels,
    datasets: [{
      data: barrierData,
      backgroundColor: barrierColors
    }]
  },
  plugins: [barrierValueLabels, fadeOthersFast],
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: ctx => `${ctx.parsed.x}%`
        }
      }
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
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    }
  }
});
charts.push(chart4);
observeAnimation(document.getElementById('bar-barriers').parentElement, chart4);




// ————— GRAF 5 —————
const ctx5 = document.getElementById('bar-employee-attitude').getContext('2d');

const employeeLabels = [
  'Nevíme / nedokážeme říct',
  'Zatím ne, zaměstnanci reagovali pozitivně',
  'Některé obavy se objevily, ale podařilo se je zvládnout',
  'Ano, čelili jsme odporu nebo obavám'
];

const employeeData = [54, 35, 7, 4];

// Use the same palette function as in Graf 1 for consistent colouring
const employeeColors = palette(employeeLabels.length);

const chart5 = new Chart(ctx5, {
  type: 'bar',
  data: {
    labels: employeeLabels,
    datasets: [{
      data: employeeData,
      backgroundColor: employeeColors
    }]
  },
  plugins: [barrierValueLabels, fadeOthersFast],
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: ctx => `${ctx.parsed.x}%`
        }
      }
    },
    scales: {
      x: {
        max: 100,
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
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    }
  }
});
charts.push(chart5);
observeAnimation(document.getElementById('bar-employee-attitude').parentElement, chart5);


// ————— GRAF 6 —————
const ctx6 = document.getElementById('pie-impact-future').getContext('2d');
const chart6 = new Chart(ctx6, {
  type: 'doughnut',
  data: {
    labels: [
      'Minimální dopad',
      'Obavy z negativních důsledků',
      'Postupné zlepšování',
      'Výrazná transformace'
    ],
    datasets: [{
      data: [20, 11, 53, 16],
      backgroundColor: palette(4),
      hoverOffset: 5
    }]
  },
  plugins: [fadeOthersFast, dataLabelPlugin],
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 18 } }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => `${ctx.parsed}%`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    },
    hover: {
      mode: 'nearest',
      intersect: true
    }
  }
});
charts.push(chart6);
observeAnimation(document.getElementById('pie-impact-future').parentElement, chart6);




// ————— GRAF 7 —————
const ctx7 = document.getElementById('pie-plan-implementation').getContext('2d');
const chart7 = new Chart(ctx7, {
  type: 'doughnut',
  data: {
    labels: [
      'Ano, ale bez konkrétního plánu',
      'Ne, v blízké době neplánujeme'
    ],
    datasets: [{
      data: [38, 62],
      backgroundColor: palette(2),
      hoverOffset: 5
    }]
  },
  plugins: [fadeOthersFast, dataLabelPlugin],
  options: {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 18 } }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: ctx => `${ctx.parsed}%`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    },
    hover: {
      mode: 'nearest',
      intersect: true
    }
  }
});

charts.push(chart7);
observeAnimation(document.getElementById('pie-plan-implementation').parentElement, chart7);


  // Správa zobrazení titulku od 768px
  function updateChartTitle() {
    chart3.options.plugins.title.display = window.innerWidth >= 768;
    chart3.update();
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
  }, { threshold: 1.0 });
  document.querySelectorAll('.chart-container').forEach(el => obs.observe(el));
});




/* ANIMACE % */
document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('percent');
      const start = 0;
      const end = 97;
      const duration = 1500;
      const frameRate = 60;
      const totalFrames = Math.round(frameRate * (duration / 1000));
      const increment = (end - start) / totalFrames;
      let current = start;
      let frame = 0;

      const counter = setInterval(() => {
        frame++;
        current += increment;
        if (frame >= totalFrames) {
          current = end;
          clearInterval(counter);
        }
        el.textContent = Math.floor(current) + ' %';
      }, duration / totalFrames);
    });
