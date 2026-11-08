const clients = [
  {
    name: "Tier-1 US Energy Corporation",
    region: "Energy & Utilities / United States",
    scope: "A full ERP and EPM transformation spanning core finance processes, financial consolidation, performance management (EPM/IPM) insights, and ARCS. The work connected the wider systems program with the financial close and reporting.",
    contribution: "Worked on the EPM side of the broader transformation, including ARCS reconciliation workflows and performance management insights for close and review.",
    value: "Streamlined the financial close and improved data visibility through reconciliation workflows and actionable performance insights.",
    lat: 32, lon: -101
  },
  {
    name: "Major Canadian Insurance Company",
    region: "Insurance & Financial Services / Canada",
    scope: "An ARCS implementation covering Reconciliation Compliance and Transaction Matching. The solution addressed both bank-account and subledger reconciliations, including high-volume matching.",
    contribution: "Worked on ARCS reconciliation and transaction-matching use cases for bank accounts and subledgers, with a focus on reducing manual matching and supporting stronger controls.",
    value: "Automated high-volume transaction matching, reducing manual reconciliation work and strengthening financial controls.",
    lat: 55, lon: -106
  },
  {
    name: "Large Midwestern US Healthcare Group",
    region: "Healthcare & Insurance / United States",
    scope: "An enterprise EPM modernization with ARCS at the center of reconciliation and transaction matching. The work addressed complex healthcare subledgers and the need for scalable close processes.",
    contribution: "Worked on ARCS reconciliation and matching processes for healthcare subledgers, drawing on financial-services-grade practices for control and repeatability.",
    value: "Established scalable, automated reconciliation across complex healthcare subledgers using financial-services-grade practices.",
    lat: 43, lon: -88
  },
  {
    name: "Innovative LA-Based Gaming & Interactive Studio",
    region: "Gaming & Entertainment / United States",
    scope: "A full ERP and EPM transformation for the gaming business. Within the wider program, the FCCS workstream focused on Task Manager for Month-End Close (MEC), structuring close activities into a coordinated workflow.",
    contribution: "Worked on the FCCS close workstream, developing the Task Manager workflow and organizing month-end activities and cross-functional handoffs.",
    value: "Designed a structured Task Manager workflow to improve close efficiency and cross-functional accountability.",
    lat: 34, lon: -118
  },
  {
    name: "Global Retail Media & Ad-Tech Leader",
    region: "Digital Advertising & Technology / France & Spain",
    scope: "A full ERP and EPM transformation across the global finance organization. The EPM work connected forward-looking Planning with ARCS reconciliation as part of a wider systems and process change.",
    contribution: "Worked on the Planning and ARCS workstreams within the broader transformation, with attention to data consistency between strategic forecasts and account reconciliation.",
    value: "Connected forward-looking financial planning with account reconciliation to strengthen data integrity across the finance process.",
    lat: 43, lon: -2
  }
];

const globeCanvas = document.querySelector('#client-globe');
const pinLayer = document.querySelector('#globe-pins');
if (globeCanvas && pinLayer) {
  const context = globeCanvas.getContext('2d');
  const stage = globeCanvas.parentElement;
  const choices = [...document.querySelectorAll('.client-choice')];
  const detail = document.querySelector('#client-detail');
  const counter = document.querySelector('#client-counter');
  const pins = clients.map((client, index) => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'globe-pin';
    pin.textContent = String(index + 1).padStart(2, '0');
    pin.setAttribute('aria-label', `Show ${client.name}`);
    pin.addEventListener('click', () => selectClient(index, false));
    pinLayer.append(pin);
    return pin;
  });

  const land = window.GLOBE_LAND?.polygons || [];

  let centerLon = -83;
  let centerLat = 26;
  let selected = 0;
  let width = 0;
  let height = 0;
  let radius = 0;
  let drag = null;

  const rad = value => value * Math.PI / 180;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function project(lon, lat) {
    const phi = rad(lat);
    const delta = rad(lon - centerLon);
    const tilt = rad(centerLat);
    const x = Math.cos(phi) * Math.sin(delta);
    const y = Math.cos(tilt) * Math.sin(phi) - Math.sin(tilt) * Math.cos(phi) * Math.cos(delta);
    const z = Math.sin(tilt) * Math.sin(phi) + Math.cos(tilt) * Math.cos(phi) * Math.cos(delta);
    return { x: width / 2 + radius * x, y: height / 2 - radius * y, z };
  }

  function drawCurve(points, stroke, lineWidth) {
    context.beginPath();
    let started = false;
    for (const [lon, lat] of points) {
      const point = project(lon, lat);
      if (point.z <= 0) { started = false; continue; }
      if (!started) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
      started = true;
    }
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function horizonPoint(from, to) {
    let low = 0;
    let high = 1;
    let deltaLon = to[0] - from[0];
    if (deltaLon > 180) deltaLon -= 360;
    if (deltaLon < -180) deltaLon += 360;
    const frontAtStart = project(from[0], from[1]).z > 0;
    for (let i = 0; i < 18; i++) {
      const mid = (low + high) / 2;
      const point = project(from[0] + deltaLon * mid, from[1] + (to[1] - from[1]) * mid);
      if ((point.z > 0) === frontAtStart) low = mid;
      else high = mid;
    }
    const t = (low + high) / 2;
    return project(from[0] + deltaLon * t, from[1] + (to[1] - from[1]) * t);
  }

  function paintLandPath(points, alongHorizon) {
    if (points.length < 3) return;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
    if (alongHorizon) {
      const first = points[0];
      const last = points[points.length - 1];
      const start = Math.atan2(last.y - height / 2, last.x - width / 2);
      const finish = Math.atan2(first.y - height / 2, first.x - width / 2);
      const delta = ((finish - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      context.arc(width / 2, height / 2, radius, start, start + delta, delta < 0);
    }
    context.closePath();
    context.fillStyle = 'rgba(67,147,144,.67)';
    context.strokeStyle = 'rgba(111,214,197,.58)';
    context.lineWidth = .7;
    context.fill();
    context.stroke();
  }

  function drawLandRing(ring) {
    const projected = ring.map(([lon, lat]) => project(lon, lat));
    const firstBack = projected.findIndex(point => point.z <= 0);
    if (firstBack === -1) {
      paintLandPath(projected, false);
      return;
    }
    let chain = [];
    for (let step = 1; step <= ring.length; step++) {
      const previousIndex = (firstBack + step - 1) % ring.length;
      const currentIndex = (firstBack + step) % ring.length;
      const previous = projected[previousIndex];
      const current = projected[currentIndex];
      const previousFront = previous.z > 0;
      const currentFront = current.z > 0;
      if (!previousFront && currentFront) {
        chain = [horizonPoint(ring[previousIndex], ring[currentIndex]), current];
      } else if (previousFront && currentFront) {
        chain.push(current);
      } else if (previousFront && !currentFront) {
        chain.push(horizonPoint(ring[previousIndex], ring[currentIndex]));
        paintLandPath(chain, true);
        chain = [];
      }
    }
  }

  function draw() {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const glow = context.createRadialGradient(cx - radius * .3, cy - radius * .4, radius * .05, cx, cy, radius * 1.25);
    glow.addColorStop(0, '#1e5667');
    glow.addColorStop(.65, '#123949');
    glow.addColorStop(1, '#061521');
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = glow;
    context.fill();
    context.save();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.clip();

    for (let lat = -60; lat <= 60; lat += 30) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 2) points.push([lon, lat]);
      drawCurve(points, 'rgba(100,210,205,.18)', 1);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 2) points.push([lon, lat]);
      drawCurve(points, 'rgba(100,210,205,.17)', 1);
    }

    for (const polygon of land) drawLandRing(polygon[0]);
    context.restore();
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(99,228,211,.65)';
    context.lineWidth = 2;
    context.stroke();
    context.beginPath();
    context.arc(cx, cy, radius + 13, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(84,183,184,.16)';
    context.lineWidth = 1;
    context.stroke();

    pins.forEach((pin, index) => {
      const point = project(clients[index].lon, clients[index].lat);
      pin.hidden = point.z < .06;
      pin.style.left = `${point.x}px`;
      pin.style.top = `${point.y}px`;
      pin.classList.toggle('is-active', index === selected);
    });
  }

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    globeCanvas.width = Math.round(width * scale);
    globeCanvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    radius = Math.min(width, height) * .42;
    draw();
  }

  function selectClient(index, rotate = true) {
    selected = index;
    const client = clients[index];
    if (rotate) {
      centerLon = client.lon;
      centerLat = clamp(client.lat * .45, -35, 40);
    }
    detail.querySelector('.client-industry').textContent = client.region.toUpperCase();
    detail.querySelector('h3').textContent = client.name;
    detail.querySelectorAll('dd')[0].textContent = client.scope;
    detail.querySelectorAll('dd')[1].textContent = client.contribution;
    detail.querySelectorAll('dd')[2].textContent = client.value;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / 05`;
    choices.forEach((choice, choiceIndex) => {
      const active = choiceIndex === index;
      choice.classList.toggle('is-active', active);
      choice.setAttribute('aria-pressed', String(active));
    });
    draw();
  }

  choices.forEach((choice, index) => choice.addEventListener('click', () => selectClient(index)));
  globeCanvas.addEventListener('pointerdown', event => {
    drag = { x: event.clientX, y: event.clientY };
    globeCanvas.setPointerCapture(event.pointerId);
  });
  globeCanvas.addEventListener('pointermove', event => {
    if (!drag) return;
    centerLon -= (event.clientX - drag.x) * .38;
    centerLat = clamp(centerLat + (event.clientY - drag.y) * .25, -70, 70);
    drag = { x: event.clientX, y: event.clientY };
    draw();
  });
  globeCanvas.addEventListener('pointerup', () => { drag = null; });
  globeCanvas.addEventListener('pointercancel', () => { drag = null; });
  new ResizeObserver(resize).observe(stage);
  resize();
}
