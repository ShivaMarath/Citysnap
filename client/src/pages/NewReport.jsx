import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../utils/api';

const CATS = [
  { k: 'pothole', l: 'Pothole' },
  { k: 'garbage', l: 'Garbage' },
  { k: 'streetlight', l: 'Street light' },
  { k: 'flooding', l: 'Flooding' },
  { k: 'infrastructure', l: 'Infrastructure' },
  { k: 'other', l: 'Other' },
];

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const data = await res.json();
  return data?.display_name || '';
}

export default function NewReport() {
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [category, setCategory] = useState('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState([19.076, 72.8777]); // default: Mumbai-ish
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [city, setCity] = useState('');
  const [mlHint, setMlHint] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted) => {
    const next = [...files, ...accepted].slice(0, 5);
    setFiles(next);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
  });

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await reverseGeocode(coords[0], coords[1]);
        if (alive) setAddress(a);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [coords]);

  const catButtons = useMemo(
    () =>
      CATS.map((c) => (
        <button
          key={c.k}
          type="button"
          onClick={() => setCategory(c.k)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            category === c.k ? 'border-civic-red bg-civic-red text-white' : 'border-black/15 hover:bg-black/5'
          }`}
        >
          {c.l}
        </button>
      )),
    [category]
  );

  async function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
      () => toast.error('Could not get your location'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function submit() {
    if (files.length === 0) return toast.error('Add at least one image');
    setSubmitting(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      fd.append('title', title);
      fd.append('description', description);
      fd.append('category', category);
      fd.append('address', address);
      fd.append('ward', ward);
      fd.append('city', city);
      fd.append('lat', String(coords[0]));
      fd.append('lng', String(coords[1]));

      const res = await api.post('/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMlHint(res.data.ml || null);

      if (res.data.isDuplicate) toast.success('Similar issue found nearby — upvoted!');
      else toast.success('Report submitted! Authorities notified.');

      nav(`/report/${res.data.reportId}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="font-display text-5xl tracking-wide leading-none">New report</div>
      <div className="text-sm text-black/70 mt-2">Upload up to 5 photos. Pin the exact spot. We’ll prevent duplicates within 50m.</div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5 space-y-5">
          <div>
            <div className="font-mono text-xs text-black/60 mb-2">Images</div>
            <div
              {...getRootProps()}
              className={`rounded-xl border border-dashed p-6 text-center cursor-pointer transition ${
                isDragActive ? 'border-civic-red bg-civic-red/5' : 'border-black/20 hover:bg-black/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className="font-display text-2xl tracking-wide">Drag & drop</div>
              <div className="text-sm text-black/70 mt-1">or click to browse (max 5, 10MB each)</div>
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {previews.map((src, idx) => (
                  <div key={src} className="relative rounded-lg overflow-hidden border border-black/10">
                    <img src={src} alt={`preview-${idx}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 rounded-md bg-black/70 text-white text-xs px-2 py-1"
                      onClick={() => setFiles((p) => p.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="font-mono text-xs text-black/60 mb-2">Category</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{catButtons}</div>
            {mlHint?.confidence > 0 && (
              <div className="mt-3 text-xs font-mono text-black/70">
                ML hint: <b>{mlHint.category}</b> ({Math.round(mlHint.confidence * 100)}%) — {mlHint.source}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <div className="font-mono text-xs text-black/60">Title</div>
              <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <div className="font-mono text-xs text-black/60">Description</div>
              <textarea className="input mt-1 min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-xs text-black/60">Ward</div>
                <input className="input mt-1" value={ward} onChange={(e) => setWard(e.target.value)} />
              </div>
              <div>
                <div className="font-mono text-xs text-black/60">City</div>
                <input className="input mt-1" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-black/60">Address</div>
              <input className="input mt-1" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="auto-filled from pin" />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-ghost" type="button" onClick={useMyLocation}>
              Use my location
            </button>
            <button className="btn-primary flex-1" type="button" disabled={submitting} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-black/60">Location</div>
              <div className="font-display text-2xl tracking-wide">Drop the pin</div>
            </div>
            <div className="font-mono text-xs text-black/60">
              {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
            </div>
          </div>

          <div className="mt-4 h-[520px] rounded-xl overflow-hidden border border-black/10">
            <MapContainer center={coords} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <ClickPicker onPick={(ll) => setCoords(ll)} />
              <Marker position={coords} />
            </MapContainer>
          </div>
          <div className="text-xs font-mono text-black/60 mt-3">Tip: click the map to reposition the pin.</div>
        </div>
      </div>
    </div>
  );
}

