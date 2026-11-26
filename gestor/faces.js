/* GFaces: agrupa rostos de uma galeria, tudo no navegador do Matheus (face-api).
   Nao sai nenhum dado biometrico daqui: o que se guarda no banco e so "quais fotos tem essa pessoa"
   e a posicao do rosto na foto de capa. Os vetores do rosto ficam so na memoria e somem ao fechar. */
(function () {
  'use strict';
  const VER = '1.7.15';
  const cfg = { lib: '/gestor/vendor/face-api.js', models: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@' + VER + '/model/' };
  let ready = null;

  function configure(o) { Object.assign(cfg, o || {}); }

  function load() {
    if (ready) return ready;
    ready = (async () => {
      if (!window.faceapi) {
        await new Promise((ok, ko) => {
          const s = document.createElement('script');
          s.src = cfg.lib; s.onload = ok;
          s.onerror = () => ko(new Error('Nao carregou o reconhecimento de rostos'));
          document.head.appendChild(s);
        });
      }
      const f = window.faceapi;
      await Promise.all([f.nets.ssdMobilenetv1.loadFromUri(cfg.models), f.nets.faceLandmark68Net.loadFromUri(cfg.models), f.nets.faceRecognitionNet.loadFromUri(cfg.models)]);
      return f;
    })().catch(e => { ready = null; throw e; });
    return ready;
  }

  const clamp = v => Math.max(0, Math.min(1, v));

  // el = canvas ou img. Devolve rostos com caixa em fracoes (0 a 1) e vetor de 128 numeros.
  async function detect(el, opt) {
    const o = Object.assign({ minScore: 0.6, minSize: 0.045 }, opt || {});
    const f = await load();
    const W = el.width || el.naturalWidth, H = el.height || el.naturalHeight;
    const res = await f.detectAllFaces(el, new f.SsdMobilenetv1Options({ minConfidence: o.minScore })).withFaceLandmarks().withFaceDescriptors();
    return res.filter(r => r.detection.box.width / W >= o.minSize).map(r => {
      const b = r.detection.box;
      return { box: { x: clamp(b.x / W), y: clamp(b.y / H), w: Math.min(1, b.width / W), h: Math.min(1, b.height / H) }, score: r.detection.score, desc: r.descriptor };
    });
  }

  function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); }

  // faces: [{item, desc, ...}]. Agrupamento por media das distancias. Dois rostos da MESMA foto nunca viram a mesma pessoa.
  function cluster(faces, th) {
    th = th || 0.5;
    const n = faces.length; if (!n) return [];
    const D = Array.from({ length: n }, () => new Float32Array(n));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = dist(faces[i].desc, faces[j].desc);
    const cl = faces.map((f, i) => ({ m: [i], items: new Set([f.item]) }));
    for (;;) {
      let best = null, bd = th;
      for (let a = 0; a < cl.length; a++) for (let b = a + 1; b < cl.length; b++) {
        const A = cl[a], B = cl[b]; let clash = false;
        for (const it of A.items) if (B.items.has(it)) { clash = true; break; }
        if (clash) continue;
        let s = 0; for (const i of A.m) for (const j of B.m) s += D[i][j];
        const d = s / (A.m.length * B.m.length);
        if (d < bd) { bd = d; best = [a, b]; }
      }
      if (!best) break;
      const [a, b] = best; cl[a].m.push(...cl[b].m); for (const it of cl[b].items) cl[a].items.add(it); cl.splice(b, 1);
    }
    return cl.map(c => c.m);
  }

  // Transforma grupos em "pessoas": foto de capa (rosto maior e mais nitido), caixa e lista de fotos.
  function pessoas(faces, groups, max) {
    const out = groups.map(g => {
      const mem = g.map(i => faces[i]);
      const rep = mem.reduce((a, b) => (b.box.w * b.box.h * b.score > a.box.w * a.box.h * a.score ? b : a));
      return { rep_item: rep.item, rep_box: rep.box, itens: [...new Set(mem.map(x => x.item))], n: new Set(mem.map(x => x.item)).size, area: rep.box.w * rep.box.h };
    });
    out.sort((a, b) => b.n - a.n || b.area - a.area);
    return out.slice(0, max || 60).map(({ area, ...p }) => p);
  }

  window.GFaces = { configure, load, detect, dist, cluster, pessoas };
})();
