export async function testAudioOutput() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return { ok: false, reason: 'no-audio-api' };

  const ctx = new AudioCtx();
  // many browsers require resume on user gesture
  try { if (ctx.state === 'suspended') await ctx.resume(); } catch (e) {}

  let hasOutputDevices = false;
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      hasOutputDevices = devices.some(d => d.kind === 'audiooutput');
    } catch (e) { /* ignore */ }
  }

  // Try a very short test tone (low-volume)
  let played = false;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.00001;
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    o.start();
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    await new Promise(r => setTimeout(r, 250));
    o.stop();
    played = true;
  } catch (e) {
    played = false;
  }

  const sinkSupported = typeof HTMLMediaElement !== 'undefined' &&
                        'setSinkId' in HTMLMediaElement.prototype;

  return {
    ok: played,
    audioApiAvailable: true,
    hasOutputDevices,
    played,
    sinkSupported,
    audioContextState: ctx.state
  };
}

export async function listOutputDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'audiooutput');
}