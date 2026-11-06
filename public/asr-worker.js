// Runs Whisper speech recognition on the user's own device (no server, no API).
import { pipeline, env } from './vendor/transformers.min.js';
env.allowLocalModels = false;
const MODEL = 'onnx-community/whisper-base_timestamped';
let asr = null;
async function load(){
  const progress_callback = p => { if (p.status === 'progress') self.postMessage({ type: 'progress', file: p.file, pct: p.progress }); };
  let gpu = false;
  try { gpu = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) {}
  if (gpu) {
    try { return await pipeline('automatic-speech-recognition', MODEL, { device: 'webgpu', dtype: { encoder_model: 'fp32', decoder_model_merged: 'q4' }, progress_callback }); }
    catch (e) { /* fall back to WASM */ }
  }
  return await pipeline('automatic-speech-recognition', MODEL, { device: 'wasm', dtype: 'q8', progress_callback });
}
self.onmessage = async (e) => {
  try {
    if (!asr) { self.postMessage({ type: 'status', text: 'Loading the speech model (first time only)…' }); asr = await load(); }
    self.postMessage({ type: 'status', text: 'Listening to your audio…' });
    const out = await asr(e.data.audio, { return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
    const words = (out.chunks || []).map(c => ({ text: c.text, start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] + 0.3 }));
    self.postMessage({ type: 'done', words });
  } catch (err) {
    self.postMessage({ type: 'error', message: err && err.message ? err.message : String(err) });
  }
};
