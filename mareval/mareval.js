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
