// Reproduce las ejecuciones reales grabadas en data.js (window.BANDEJA).
(function () {
  const D = window.BANDEJA || [];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON = { alta: '🔴', media: '🟠', baja: '🟢' };
  const CANAL = { email: 'Email', web: 'Web', whatsapp: 'WhatsApp' };
  const NOMBRE_CAT = { pedido: 'Pedido', reparacion: 'Reparación', garantia: 'Garantía', cita: 'Cita', factura: 'Factura', queja: 'Queja', otro: 'Otro' };

  const inbox = $('inbox');
  const steps = [...document.querySelectorAll('#pipe li')];
  const cards = [...document.querySelectorAll('#out .card')];
  let timers = [];

  const iniciales = (n) => (n || '?').replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

  D.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'option');
    b.innerHTML =
      `<span class="av ${m.canal}" aria-hidden="true">${esc(iniciales(m.nombre))}</span>` +
      `<span><span class="who">${esc(m.nombre || 'Sin nombre')}<small>${CANAL[m.canal] || m.canal}</small></span>` +
      `<span class="prev">${esc(m.texto)}</span></span>`;
    b.addEventListener('click', () => {
      mostrar(i);
      // En pantallas estrechas el resultado queda debajo de la lista: lo acercamos.
      if (matchMedia('(max-width: 960px)').matches) $('pipe').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    inbox.appendChild(b);
  });

  function aviso(m) {
    const r = m.r;
    const extra = [r.datos?.referencia_pedido && 'Pedido: ' + r.datos.referencia_pedido, r.datos?.modelo_reloj && 'Modelo: ' + r.datos.modelo_reloj, r.datos?.telefono && 'Tel: ' + r.datos.telefono].filter(Boolean).join(' · ');
    return `<b>${ICON[r.urgencia] || '⚪'} Nuevo ticket ${esc(r.ticket)}</b> · ${esc(r.departamento)}\n` +
      `<b>${esc(r.categoria)}</b> · urgencia ${esc(r.urgencia)}\n\n<i>${esc(r.resumen)}</i>\n\n` +
      `De: ${esc(m.nombre || 'sin nombre')}${m.email ? ' &lt;' + esc(m.email) + '&gt;' : ''} (${esc(m.canal)})\n` +
      (extra ? esc(extra) + '\n' : '') +
      (r.borrador ? `\n<b>Borrador de respuesta:</b>\n${esc(r.borrador)}` : '');
  }

  function mostrar(i) {
    const m = D[i];
    const r = m.r;
    timers.forEach(clearTimeout); timers = [];
    [...inbox.children].forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));

    $('msg').innerHTML =
      `<div class="meta"><span>${CANAL[m.canal] || m.canal}</span><span>${esc(m.nombre || 'Sin nombre')}</span>${m.asunto ? `<span>Asunto: ${esc(m.asunto)}</span>` : ''}</div>` +
      `<p>${esc(m.texto)}</p>`;
    $('ia').innerHTML =
      `<dt>Categoría</dt><dd>${NOMBRE_CAT[r.categoria] || r.categoria}</dd>` +
      `<dt>Urgencia</dt><dd><span class="tag ${r.urgencia}">${r.urgencia}</span></dd>` +
      `<dt>Sentimiento</dt><dd>${esc(r.sentimiento)}</dd>` +
      `<dt>Confianza</dt><dd><span class="bar"><i style="width:${Math.round((r.confianza || 0) * 100)}%"></i></span>${Math.round((r.confianza || 0) * 100)} %</dd>` +
      `<dt>Departamento</dt><dd>${esc(r.departamento)}</dd>` +
      `<dt>Tiempo IA</dt><dd>${(r.ms / 1000).toFixed(1).replace('.', ',')} s</dd>`;
    $('resumen').textContent = r.resumen;
    $('tg').innerHTML = aviso(m);
    const al = $('alerta');
    al.classList.toggle('si', !!r.alerta);
    al.innerHTML = r.alerta
      ? `<p class="lbl">Alerta al responsable</p><p><strong>🚨 Sí.</strong> ${r.categoria === 'queja' ? 'Es una queja' : 'Urgencia alta'}: el responsable recibe también el mensaje original.</p>`
      : `<p class="lbl">Alerta al responsable</p><p>No hace falta: ni urgente ni queja.</p>`;

    steps.forEach((s) => s.classList.remove('on', 'skip', 'hot'));
    cards.forEach((c) => c.classList.remove('on'));
    const paso = (k) => {
      steps[k].classList.add('on');
      if (k === 4) steps[4].classList.add(r.alerta ? 'hot' : 'skip');
      cards.forEach((c) => { if (+c.dataset.show === k) c.classList.add('on'); });
      if (k === 3) cards.find((c) => +c.dataset.show === 4)?.classList.remove('on');
    };
    if (reduce) { for (let k = 0; k < 5; k++) paso(k); return; }
    [0, 1, 2, 3, 4].forEach((k) => timers.push(setTimeout(() => paso(k), 120 + k * 420)));
  }

  // Mediana real del tiempo de la IA
  const ms = D.map((m) => m.r.ms).sort((a, b) => a - b);
  if (ms.length) $('n-ms').textContent = (ms[Math.floor(ms.length / 2)] / 1000).toFixed(0) + ' s';

  if (D.length) mostrar(D.findIndex((m) => m.id === 2) >= 0 ? D.findIndex((m) => m.id === 2) : 0);
})();
