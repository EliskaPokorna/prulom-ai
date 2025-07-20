document.addEventListener('DOMContentLoaded', ()=>{
  const root = getComputedStyle(document.documentElement);
  const cMain = root.getPropertyValue('--c-main').trim();
  const cAcc = root.getPropertyValue('--c-acc').trim();

  function hexToRgba(hex, alpha){
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function palette(n){
    const levels=[1,1,0.8,0.8,0.6,0.6,0.4,0.4];
    const colors=[];
    for(let i=0;i<n;i++){
      const base = i%2===0 ? cAcc : cMain;
      const alpha = n<=2 ? 1 : (levels[i] ?? 0.3);
      colors.push(n<=2 ? base : hexToRgba(base, alpha));
    }
    return colors;
  }

  const highlight={
    id:'highlight',
    afterEvent(chart){
      const act = chart.getActiveElements();
      chart.data.datasets.forEach(ds=>{
        if(!ds._bg) ds._bg = ds.backgroundColor.slice();
        ds.backgroundColor = ds._bg.slice();
      });
      if(act.length){
        const {datasetIndex:index, index:i} = act[0];
        chart.data.datasets.forEach((ds,di)=>{
          ds.backgroundColor = ds.backgroundColor.map((c,ci)=>
            di===index && ci===i ? ds._bg[ci] : 'lightgray');
        });
      }
      chart.update('none');
    }
  };

  const charts=[];
  const ctx1=document.getElementById('pie-rules').getContext('2d');
  charts.push(new Chart(ctx1,{
    type:'doughnut',
    data:{labels:['bez pravidel','má pravidla'],datasets:[{data:[97,3],backgroundColor:palette(2),hoverOffset:5}]},
    options:{plugins:{legend:{display:false}}},
    plugins:[highlight]
  }));

  const ctx2=document.getElementById('pie-use').getContext('2d');
  charts.push(new Chart(ctx2,{
    type:'doughnut',
    data:{labels:['Ano','Ne'],datasets:[{data:[51,49],backgroundColor:palette(2),hoverOffset:5}]},
    options:{plugins:{legend:{position:'bottom'}}},
    plugins:[highlight]
  }));

  const ctx3=document.getElementById('bar-areas').getContext('2d');
  charts.push(new Chart(ctx3,{
    type:'bar',
    data:{
      labels:['generování textů a nápadů','komunikace s občany (web, chatboty, app)','generování obrázků','práce s daty a tabulkami','automatizace agend a opakujících se úkonů','ostatní'],
      datasets:[{data:[55,19,13,5,3,5],backgroundColor:palette(6),hoverOffset:5}]
    },
    options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{max:60,ticks:{callback:v=>v+'%'}},y:{ticks:{font:{size:12}}}}},
    plugins:[highlight]
  }));

  const ctx4=document.getElementById('pie-attitude').getContext('2d');
  charts.push(new Chart(ctx4,{
    type:'doughnut',
    data:{
      labels:['pozitivní','neutrální','negativní'],
      datasets:[
        {data:[49,45,6],backgroundColor:palette(3),hoverOffset:5,radius:'100%'},
        {data:[9,40,4,2],backgroundColor:palette(4),hoverOffset:5,radius:'70%'}
      ]
    },
    options:{plugins:{legend:{position:'bottom'}}},
    plugins:[highlight]
  }));

  const ctx5=document.getElementById('bar-barriers').getContext('2d');
  charts.push(new Chart(ctx5,{
    type:'bar',
    data:{
      labels:['nízké povědomí o AI','právní/etická nejasnost','chybějící koncepce a vize','nedostatečně školený personál','nedostatek finančních prostředků','nevyhovující technická infrastruktura','odmítání AI ze strany pracovníků'],
      datasets:[{data:[33,15,15,15,13,5,4],backgroundColor:palette(7),hoverOffset:5}]
    },
    options:{plugins:{legend:{display:false}},scales:{y:{ticks:{font:{size:12}}},x:{max:35,ticks:{callback:v=>v+'%'}}}},
    plugins:[highlight]
  }));

  window.addEventListener('resize',()=>charts.forEach(c=>c.update()));

  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}})},{threshold:0.2});
  document.querySelectorAll('.chart-container').forEach(el=>obs.observe(el));
});
