// Mareval · Calibre M-01: el reloj de la portada marca la hora real del visitante.
(() => {
  const NS = 'http://www.w3.org/2000/svg'
  const $ = (id) => document.getElementById(id)
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches

  // minutero (60 marcas) e índices (12 barras; doble a las 12)
  const ticks = $('ticks'), idx = $('indices')
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue
    const l = document.createElementNS(NS, 'line')
    l.setAttribute('x1', 200); l.setAttribute('x2', 200); l.setAttribute('y1', 30); l.setAttribute('y2', 38)
    l.setAttribute('class', 'tick'); l.setAttribute('transform', `rotate(${i * 6} 200 200)`)
    ticks.appendChild(l)
  }
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue // ventana de fecha
    const g = document.createElementNS(NS, 'g')
    g.setAttribute('transform', `rotate(${i * 30} 200 200)`)
    const barras = i === 0 ? [193.5, 202.5] : [197]
    for (const x of barras) {
      const r = document.createElementNS(NS, 'rect')
      r.setAttribute('x', x); r.setAttribute('y', 32); r.setAttribute('width', i === 0 ? 4 : 6); r.setAttribute('height', i % 3 === 0 ? 34 : 26)
      r.setAttribute('rx', 1); r.setAttribute('class', 'idx')
      g.appendChild(r)
    }
    idx.appendChild(g)
  }

  const hora = $('h-hour'), min = $('h-min'), seg = $('h-sec'), fecha = $('date'), ahora = $('now')
  const girar = (el, grados) => el.setAttribute('transform', `rotate(${grados} 200 200)`)
  const angulos = (d) => {
    const s = d.getSeconds() + d.getMilliseconds() / 1000
    const m = d.getMinutes() + s / 60
    const h = (d.getHours() % 12) + m / 60
    return { h: h * 30, m: m * 6, s: reducir ? Math.floor(s) * 6 : s * 6 }
  }
  const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone?.split('/').pop()?.replace(/_/g, ' ')
  let ultimoMinuto = -1
  const texto = (d) => {
    if (d.getMinutes() === ultimoMinuto) return
    ultimoMinuto = d.getMinutes()
    fecha.textContent = d.getDate()
    ahora.textContent = `Son las ${fmt.format(d)}${zona ? ` en ${zona}` : ''}. El reloj marca tu hora.`
  }

  // entrada: de las 10:10 del escaparate a la hora real, una sola vez
  const inicio = { h: 300 + 10 / 60 * 30, m: 60, s: 0 }
  const objetivo = angulos(new Date(Date.now() + 1400))
  const t0 = performance.now(), dur = reducir ? 0 : 1400
  const ease = (t) => 1 - Math.pow(1 - t, 4)
  const mas = (a, b) => (b < a ? b + 360 : b) // siempre hacia delante
  const fin = { h: mas(inicio.h, objetivo.h), m: mas(inicio.m, objetivo.m), s: mas(inicio.s, objetivo.s) }

  function frame(t) {
    const p = dur ? Math.min(1, (t - t0) / dur) : 1
    if (p < 1) {
      const e = ease(p)
      girar(hora, inicio.h + (fin.h - inicio.h) * e)
      girar(min, inicio.m + (fin.m - inicio.m) * e)
      girar(seg, inicio.s + (fin.s - inicio.s) * e)
    } else {
      const d = new Date(), a = angulos(d)
      girar(hora, a.h); girar(min, a.m); girar(seg, a.s)
      texto(d)
    }
    requestAnimationFrame(frame)
  }
  texto(new Date())
  requestAnimationFrame(frame)

  // color de la esfera
  document.querySelectorAll('input[name="dial"]').forEach((r) =>
    r.addEventListener('change', () => { document.documentElement.dataset.dial = r.value })
  )

  // formulario de cita: es una página de ejemplo, no se envía nada
  const form = $('form-cita'), msg = $('form-msg')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const falta = [...form.elements].find((el) => el.required && !el.checkValidity())
    if (falta) {
      msg.className = 'form-msg bad'
      msg.textContent = falta.name === 'email' ? 'Revisa el correo: falta la @ o el dominio.' : `Falta «${falta.parentElement.firstChild.textContent.trim()}».`
      falta.focus()
      return
    }
    msg.className = 'form-msg ok'
    msg.textContent = 'Cita pedida. Es una web de ejemplo, así que no se ha enviado nada.'
    form.reset()
  })
})()

// ---- Pieza a pieza: el reloj se desmonta en capas con el scroll
;(() => {
  const seccion = document.getElementById('despiece'), stage = document.getElementById('stage')
  if (!seccion || !stage) return
  const partes = [...document.querySelectorAll('#partes li')]
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const VB = 'viewBox="-24 -24 448 448"'
  const svg = (id, cuerpo, defs = '') => `<svg ${VB} xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${cuerpo}</svg>`
  const rad = (g) => (g - 90) * Math.PI / 180
  const pt = (cx, cy, r, g) => [cx + r * Math.cos(rad(g)), cy + r * Math.sin(rad(g))]

  // rueda dentada: n dientes entre r y r-h
  function rueda(cx, cy, r, n, h = 7) {
    let d = ''
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i, w = 360 / n
      const ps = [pt(cx, cy, r - h, a), pt(cx, cy, r, a + w * 0.15), pt(cx, cy, r, a + w * 0.45), pt(cx, cy, r - h, a + w * 0.6)]
      d += (i ? 'L' : 'M') + ps.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')
    }
    return d + 'Z'
  }
  function engranaje(cx, cy, r, n, color, t, inv = false) {
    const radios = [0, 60, 120, 180, 240, 300].map((g) => { const [x, y] = pt(cx, cy, r * 0.72, g); return `M${cx},${cy}L${x.toFixed(1)},${y.toFixed(1)}` }).join('')
    return `<g class="engrane${inv ? ' inv' : ''}" style="--t:${t}s">
      <path d="${rueda(cx, cy, r, n)}" fill="${color}"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.72).toFixed(1)}" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1"/>
      <path d="${radios}" stroke="rgba(0,0,0,.22)" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.18).toFixed(1)}" fill="#B23A48"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.07).toFixed(1)}" fill="#2a1a10"/>
    </g>`
  }
  const acero = (id) => `<radialGradient id="${id}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#F4F6F8"/><stop offset=".5" stop-color="#B9C0C7"/><stop offset="1" stop-color="#6F7881"/></radialGradient>`
  const oro = (id) => `<radialGradient id="${id}" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#F3EEE4"/><stop offset=".45" stop-color="#C9B488"/><stop offset="1" stop-color="#7E6A45"/></radialGradient>`
  const aguja = (id) => `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#8C7449"/><stop offset=".5" stop-color="#F1E6CF"/><stop offset="1" stop-color="#A88E5E"/></linearGradient>`

  let indices = '', marcas = ''
  for (let i = 0; i < 60; i++) if (i % 5) marcas += `<line x1="200" x2="200" y1="30" y2="38" transform="rotate(${i * 6} 200 200)" style="stroke:var(--dial-text)" opacity=".55"/>`
  for (let i = 0; i < 12; i++) if (i !== 3) indices += `<rect x="${i ? 197 : 195}" y="32" width="${i ? 6 : 10}" height="${i % 3 ? 26 : 34}" rx="1" transform="rotate(${i * 30} 200 200)" style="fill:var(--index)"/>`
  let perlado = ''
  for (let r = 30; r < 170; r += 22) for (let g = 0; g < 360; g += 360 / Math.round(r / 7)) { const [x, y] = pt(200, 200, r, g); perlado += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1"/>` }
  let franjas = ''
  for (let x = 40; x < 370; x += 14) franjas += `<line x1="${x}" y1="30" x2="${x}" y2="370" stroke="rgba(0,0,0,.12)" stroke-width="6"/>`
  let tornillos = ''
  for (let g = 30; g < 360; g += 60) { const [x, y] = pt(200, 200, 183, g); tornillos += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#8C959E"/><path d="M${(x - 3).toFixed(1)},${y.toFixed(1)}h6" stroke="#4A535C" stroke-width="1.4"/>` }

  const capas = [
    // 0 cristal
    svg('cristal', `<circle cx="200" cy="200" r="184" fill="url(#cr)" stroke="rgba(255,255,255,.75)" stroke-width="2"/>
      <path d="M90 120 A150 150 0 0 1 250 52" stroke="rgba(255,255,255,.85)" stroke-width="6" fill="none" stroke-linecap="round"/>`,
      `<radialGradient id="cr" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#cfe2f0" stop-opacity=".05"/></radialGradient>`),
    // 1 agujas (10:10)
    svg('agujas', `<g filter="url(#sh)"><path d="M200 214 L193 200 L200 106 L207 200 Z" fill="url(#ag)" transform="rotate(305 200 200)"/>
      <path d="M200 220 L195 200 L200 54 L205 200 Z" fill="url(#ag)" transform="rotate(60 200 200)"/></g>
      <rect x="199.2" y="44" width="1.6" height="190" fill="#B89B66" transform="rotate(200 200 200)"/><circle cx="200" cy="200" r="7" fill="#E5D7B8"/>`,
      aguja('ag') + `<filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".35"/></filter>`),
    // 2 esfera
    svg('esfera', `<circle cx="200" cy="200" r="178" fill="url(#es)"/>${marcas}${indices}
      <text x="200" y="128" text-anchor="middle" style="font:400 22px var(--serif);letter-spacing:.08em;fill:var(--dial-text)">Mareval</text>
      <text x="200" y="292" text-anchor="middle" style="font:500 9.5px var(--sans);letter-spacing:.22em;fill:var(--dial-text)">Automático</text>
      <rect x="282" y="189" width="34" height="22" rx="2" style="fill:var(--date-bg)"/>`,
      `<radialGradient id="es" cx="45%" cy="38%" r="70%"><stop offset="0" style="stop-color:var(--dial-hi)"/><stop offset="1" style="stop-color:var(--dial)"/></radialGradient>`),
    // 3 caja
    svg('caja', `<g fill="url(#cj)"><path d="M92 70 L112 6 L148 6 L150 40 Z"/><path d="M308 70 L288 6 L252 6 L250 40 Z"/>
      <path d="M92 330 L112 394 L148 394 L150 360 Z"/><path d="M308 330 L288 394 L252 394 L250 360 Z"/></g>
      <rect x="392" y="184" width="20" height="32" rx="4" fill="url(#cj)"/>
      <path fill-rule="evenodd" d="M200 4a196 196 0 1 0 0.01 0Z M200 22a178 178 0 1 1 -0.01 0Z" fill="url(#cj)"/>`, oro('cj')),
    // 4 movimiento
    svg('movimiento', `<circle cx="200" cy="200" r="172" fill="url(#pl)"/>${perlado}
      <path d="M70 150 Q120 90 210 96 L240 140 Q160 150 120 210 Z" fill="#C9B488" opacity=".9"/>
      <path d="M250 250 Q300 300 250 345 L205 320 Q240 290 215 260 Z" fill="#C9B488" opacity=".9"/>
      ${engranaje(205, 200, 52, 40, '#D8C49A', 14)}${engranaje(132, 248, 34, 26, '#C5CCD3', 9, true)}${engranaje(268, 128, 28, 22, '#D8C49A', 7, true)}
      ${engranaje(150, 140, 20, 16, '#C5CCD3', 5)}${engranaje(290, 262, 22, 18, '#D8C49A', 6)}
      <g class="volante"><circle cx="112" cy="318" r="30" fill="none" stroke="#D8C49A" stroke-width="5"/><path d="M82 318h60M112 288v60" stroke="#D8C49A" stroke-width="3"/><circle cx="112" cy="318" r="5" fill="#B23A48"/></g>
      <circle cx="112" cy="318" r="40" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1"/>
      <circle cx="320" cy="180" r="5" fill="#B23A48"/><circle cx="90" cy="200" r="5" fill="#B23A48"/><circle cx="230" cy="70" r="5" fill="#B23A48"/>`, acero('pl')),
    // 5 rotor
    svg('rotor', `<clipPath id="rc"><path d="M200 200 L36 200 A164 164 0 0 1 364 200 Z"/></clipPath>
      <g clip-path="url(#rc)"><rect x="30" y="30" width="340" height="180" fill="url(#ro)"/>${franjas}</g>
      <path d="M200 200 L36 200 A164 164 0 0 1 364 200 Z" fill="none" stroke="#7E6A45" stroke-width="2"/>
      <text x="200" y="120" text-anchor="middle" style="font:400 20px var(--serif);letter-spacing:.12em;fill:#5C4A2C">Mareval M-01</text>
      <circle cx="200" cy="200" r="16" fill="#C5CCD3"/><circle cx="200" cy="200" r="6" fill="#B23A48"/>`, oro('ro')),
    // 6 fondo de zafiro
    svg('fondo', `<path fill-rule="evenodd" d="M200 6a194 194 0 1 0 0.01 0Z M200 32a168 168 0 1 1 -0.01 0Z" fill="url(#fo)"/>
      <circle cx="200" cy="200" r="168" fill="#9FC3DA" opacity=".18"/>${tornillos}
      <path id="arco" d="M60 200 A140 140 0 0 0 340 200" fill="none"/>
      <text style="font:500 11px var(--sans);letter-spacing:.3em;fill:#4A535C"><textPath href="#arco" startOffset="50%" text-anchor="middle">Nº 0042 · ZAFIRO · 100 M</textPath></text>`, acero('fo'))
  ]
  // se pintan del fondo al cristal: así, con el reloj montado, queda delante lo que se ve delante
  stage.innerHTML = capas.map((c, i) => `<div class="capa" data-i="${i}">${c}</div>`).reverse().join('')
  const nodos = [...stage.children].sort((a, b) => a.dataset.i - b.dataset.i)
  const N = nodos.length

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const suave = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }
  let activa = -2

  function pintar() {
    const r = seccion.getBoundingClientRect()
    const recorrido = seccion.offsetHeight - innerHeight
    const p = reducir ? 0.6 : clamp(-r.top / recorrido)
    const inclinar = suave(0, 0.18, p) * (1 - suave(0.9, 1, p))
    const abrir = suave(0.16, 0.48, p) * (1 - suave(0.86, 0.97, p))
    const ancho = stage.offsetWidth
    stage.style.transform = `rotateX(${(58 * inclinar).toFixed(2)}deg) rotateZ(${(-26 * inclinar).toFixed(2)}deg)`
    nodos.forEach((n, i) => { n.style.transform = `translateZ(${(((N - 1) / 2 - i) * (1.5 + ancho * 0.2 * abrir)).toFixed(1)}px)` })
    seccion.classList.toggle('moving', p > 0.04)
    stage.classList.toggle('exploding', abrir > 0.6)
    const i = abrir > 0.6 ? Math.min(N - 1, Math.floor(clamp((p - 0.4) / 0.44) * N)) : -1
    if (i !== activa) {
      activa = i
      nodos.forEach((n, k) => n.classList.toggle('on', k === i))
      partes.forEach((li, k) => li.classList.toggle('on', k === i))
    }
  }
  if (reducir) { stage.style.transform = 'none'; partes.forEach((li) => li.classList.add('on')); return }
  let pendiente = false
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; pintar() }) } }, { passive: true })
  addEventListener('resize', pintar)
  pintar()
})()
