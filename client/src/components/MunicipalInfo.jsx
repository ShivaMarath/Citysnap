import { getMunicipalPreview } from '../utils/cityList';

export default function MunicipalInfo({ city }) {
  const info = getMunicipalPreview(city);
  if (!city?.trim()) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Enter a city to select the correct authority.
      </div>
    );
  }

  if (!info.recognized) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        ⚠️ Your report will be sent to the default authority. Please ensure your city name is correct.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
      ✅ <b>{info.name}</b> ({info.state})<br />
      Your report will be sent to this authority.
    </div>
  );
}
