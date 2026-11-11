// Compressão de mídia no navegador antes do upload (GestaoS)
// Imagens: JPEG até 1080 px de largura. Vídeos: regravados em até 720 px a ~2,5 Mbps (leva o tempo do vídeo).
(function () {
  'use strict';
  async function compressImage(file, maxW = 1080, q = 0.85) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width), W = Math.round(bmp.width * scale), H = Math.round(bmp.height * scale);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(bmp, 0, 0, W, H); bmp.close && bmp.close();
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
    return { blob, w: W, h: H, type: 'image', ext: 'jpg', mime: 'image/jpeg' };
  }
  function pickMime() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    return ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t)) || null;
  }
  async function videoPoster(url, at = 0.6) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = rej; });
    v.currentTime = Math.min(at, (v.duration || 1) / 2); await new Promise(r => v.onseeked = r);
    const s = Math.min(1, 540 / v.videoWidth), cv = document.createElement('canvas'); cv.width = Math.round(v.videoWidth * s); cv.height = Math.round(v.videoHeight * s);
    cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    return { blob: await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.8)), w: v.videoWidth, h: v.videoHeight, duration: v.duration };
  }
  // onProgress(0..1). ac = AudioContext criado no clique do usuário (política de autoplay)
  async function compressVideo(file, onProgress, ac, maxW = 720, vbps = 2500000) {
    const mime = pickMime(); if (!mime) return null;
    const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error('Não consegui ler esse vídeo')); });
    const s = Math.min(1, maxW / v.videoWidth), W = Math.round(v.videoWidth * s / 2) * 2, H = Math.round(v.videoHeight * s / 2) * 2;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    const stream = cv.captureStream(30);
    let ownAc = false; if (!ac) { ac = new AudioContext(); ownAc = true; } if (ac.state === 'suspended') await ac.resume();
    const src = ac.createMediaElementSource(v), dest = ac.createMediaStreamDestination(); src.connect(dest);
    dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: vbps, audioBitsPerSecond: 128000 });
    const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise(r => rec.onstop = r);
    let alive = true;
    const draw = () => { if (!alive) return; ctx.drawImage(v, 0, 0, W, H); onProgress && onProgress(v.duration ? v.currentTime / v.duration : 0);
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(draw); else requestAnimationFrame(draw); };
    v.onended = () => { alive = false; onProgress && onProgress(1); setTimeout(() => rec.stop(), 150); };
    rec.start(1000); await v.play(); draw();
    await stopped; src.disconnect(); if (ownAc) ac.close(); URL.revokeObjectURL(v.src);
    const type = mime.split(';')[0];
    return { blob: new Blob(chunks, { type }), w: W, h: H, type: 'video', ext: type === 'video/mp4' ? 'mp4' : 'webm', mime: type };
  }
  window.GMedia = { compressImage, compressVideo, videoPoster, canCompressVideo: () => !!pickMime() };
})();
