import React, { useState, useRef } from 'react';
import { testAudioOutput, listOutputDevices } from '../utils/audioCheck';

export default function AudioTest() {
  const [status, setStatus] = useState('idle');
  const [devices, setDevices] = useState([]);
  const [sinkSupported, setSinkSupported] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('');
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const nodeRef = useRef(null);

  const onTest = async () => {
    setStatus('testing');
    const res = await testAudioOutput();
    setSinkSupported(!!res.sinkSupported);
    setStatus(res.ok ? 'OK — test tone played' : `Failed — ${res.reason || 'no audio output'}`);
    if (res.sinkSupported) {
      const outs = await listOutputDevices();
      setDevices(outs);
    } else {
      setDevices([]);
    }
    if (!res.ok) {
      alert('Audio test failed. Please: unmute tab/system, enable speakers/headphones, allow site sound, then try again.');
    }
  };

  async function playToneOnDevice(deviceId) {
    try {
      // stop previous
      stopTone();

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('No AudioContext');

      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.frequency.value = 880;
      osc.connect(gain);

      // create a MediaStreamDestination so we can route to <audio> and setSinkId
      const dest = ctx.createMediaStreamDestination();
      gain.connect(dest);
      osc.start();

      // connect and play through audio element
      const audioEl = audioRef.current;
      if (!audioEl) throw new Error('No audio element');

      audioEl.srcObject = dest.stream;
      audioEl.onended = stopTone;
      audioEl.onpause = () => { /* noop */ };

      if (deviceId && 'setSinkId' in HTMLMediaElement.prototype) {
        try {
          await audioEl.setSinkId(deviceId);
        } catch (e) {
          console.warn('setSinkId failed', e);
        }
      }

      await audioEl.play();
      nodeRef.current = { osc, gain };
      // ramp volume up a bit
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      // stop after 1s
      setTimeout(stopTone, 1000);
    } catch (e) {
      console.error(e);
      setStatus('Error playing tone');
    }
  }

  function stopTone() {
    try {
      if (nodeRef.current) {
        try { nodeRef.current.osc.stop(); } catch (e) {}
        nodeRef.current = null;
      }
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch (e) {}
        ctxRef.current = null;
      }
      const audioEl = audioRef.current;
      if (audioEl) {
        try { audioEl.pause(); audioEl.srcObject = null; } catch (e) {}
      }
    } catch (e) { /* ignore */ }
  }

  const onDeviceChange = async (e) => {
    const id = e.target.value;
    setSelectedDevice(id);
    if (!id) return;
    setStatus('Playing test tone on selected device...');
    await playToneOnDevice(id);
    setStatus('Done');
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Audio check</h3>
      <p style={{ margin: '6px 0' }}>Use this to verify speakers/headphones and to select an output device (if supported).</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={onTest} style={{ padding: '8px 12px', background: '#ffcc00', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Test Audio Output
        </button>
        {sinkSupported && devices.length > 0 && (
          <select value={selectedDevice} onChange={onDeviceChange} style={{ padding: '8px', borderRadius: 6 }}>
            <option value=''>Select output device</option>
            {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}
          </select>
        )}
      </div>
      <p style={{ marginTop: 10 }}>Status: {status}</p>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}