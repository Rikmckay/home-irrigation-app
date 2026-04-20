import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons broken by Webpack/Vite asset handling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GPS_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
const ACCURACY_GOOD = 5;
const ACCURACY_FAIR = 15;

function accuracyColor(accuracy) {
  if (accuracy <= ACCURACY_GOOD) return "text-green-600 bg-green-50 border-green-300";
  if (accuracy <= ACCURACY_FAIR) return "text-yellow-600 bg-yellow-50 border-yellow-300";
  return "text-red-600 bg-red-50 border-red-300";
}

function accuracyLabel(accuracy) {
  if (accuracy <= ACCURACY_GOOD) return "Good";
  if (accuracy <= ACCURACY_FAIR) return "Fair";
  return "Poor";
}

function MapCenterer({ coords }) {
  const map = useMap();
  const didCenterRef = useRef(false);
  useEffect(() => {
    if (coords && !didCenterRef.current) {
      map.setView([coords.lat, coords.lng], 18);
      didCenterRef.current = true;
    }
  }, [coords, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange }) {
  const hasInitial = lat != null && lng != null;
  const [uiState, setUiState] = useState(hasInitial ? "success" : "idle");
  const [coords, setCoords] = useState(
    hasInitial ? { lat, lng, accuracy: null } : null
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualError, setManualError] = useState("");
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function notifyParent(next) {
    if (onChange) onChange(next.lat, next.lng);
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setErrorMsg("Geolocation is not supported by this browser or device.");
      setUiState("error");
      return;
    }
    setUiState("acquiring");
    setCoords(null);
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setCoords(next);
        setUiState("success");
        notifyParent(next);
      },
      (err) => {
        let msg;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = "Location access was denied. Enable location permissions in your browser settings, then try again.";
            break;
          case err.POSITION_UNAVAILABLE:
            msg = "Location information is unavailable. Make sure GPS or network connectivity is on.";
            break;
          case err.TIMEOUT:
            msg = "GPS timed out after 15 seconds. Try stepping outside for a better signal.";
            break;
          default:
            msg = `An unknown error occurred (code ${err.code}). Please try again.`;
        }
        setErrorMsg(msg);
        setUiState("error");
      },
      GPS_OPTIONS
    );
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    setManualError("");
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) { setManualError("Latitude must be between -90 and 90."); return; }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) { setManualError("Longitude must be between -180 and 180."); return; }
    const next = { lat: parsedLat, lng: parsedLng, accuracy: null };
    setCoords(next);
    setUiState("success");
    notifyParent(next);
  }

  if (uiState === "idle") return (
    <div className="flex flex-col items-center gap-4 p-4">
      <p className="text-sm text-gray-500 text-center">Walk to the device location, then tap the button below.</p>
      <button onClick={captureLocation} className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-lg py-4 px-6 rounded-2xl shadow-md transition-colors">
        <span className="text-2xl" aria-hidden="true">📍</span>
        Capture My Location
      </button>
    </div>
  );

  if (uiState === "acquiring") return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Acquiring GPS signal" />
      <p className="text-base font-medium text-gray-700">Getting your location…</p>
      <p className="text-sm text-gray-400">Hold still for best accuracy.</p>
    </div>
  );

  if (uiState === "success" && coords) {
    const accColor = coords.accuracy !== null ? accuracyColor(coords.accuracy) : "text-gray-600 bg-gray-50 border-gray-300";
    const accLabel = coords.accuracy !== null ? accuracyLabel(coords.accuracy) : "Manual";
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-2xl" aria-hidden="true">✅</span>
          <span className="font-semibold text-green-700 text-base">Location captured</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 font-mono text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Latitude</span><span className="text-gray-800 font-medium">{coords.lat.toFixed(7)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Longitude</span><span className="text-gray-800 font-medium">{coords.lng.toFixed(7)}</span></div>
        </div>
        {coords.accuracy !== null && (
          <div className={`inline-flex items-center gap-2 self-start border rounded-full px-3 py-1 text-sm font-medium ${accColor}`}>
            <span>±{coords.accuracy} m</span><span className="opacity-70">•</span><span>{accLabel} accuracy</span>
          </div>
        )}
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 260 }}>
          <MapContainer center={[coords.lat, coords.lng]} zoom={18} maxZoom={19} style={{ height: "100%", width: "100%" }} attributionControl={false}>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <MapCenterer coords={coords} />
            <Marker
              position={[coords.lat, coords.lng]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat: nLat, lng: nLng } = e.target.getLatLng();
                  const next = { lat: nLat, lng: nLng, accuracy: null };
                  setCoords(next);
                  notifyParent(next);
                },
              }}
            />
          </MapContainer>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Drag the pin to adjust, or pan and zoom to find the exact spot.
        </p>
        <button onClick={captureLocation} className="w-full flex items-center justify-center gap-2 border border-green-600 text-green-700 hover:bg-green-50 font-medium py-3 px-4 rounded-xl transition-colors">
          <span aria-hidden="true">🔄</span> Recapture
        </button>
      </div>
    );
  }

  if (uiState === "error") return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <span className="text-red-500 text-xl shrink-0" aria-hidden="true">⚠️</span>
        <p className="text-sm text-red-700 leading-snug">{errorMsg}</p>
      </div>
      <button onClick={captureLocation} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
        <span aria-hidden="true">📍</span> Try Again
      </button>
      <div className="flex items-center gap-3"><div className="flex-1 border-t border-gray-200" /><span className="text-xs text-gray-400 font-medium">or enter manually</span><div className="flex-1 border-t border-gray-200" /></div>
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="manual-lat" className="text-sm font-medium text-gray-700">Latitude</label>
          <input id="manual-lat" type="number" step="any" placeholder="e.g. 49.3204" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" inputMode="decimal" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="manual-lng" className="text-sm font-medium text-gray-700">Longitude</label>
          <input id="manual-lng" type="number" step="any" placeholder="e.g. -124.3456" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" inputMode="decimal" />
        </div>
        {manualError && <p className="text-sm text-red-600">{manualError}</p>}
        <button type="submit" className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors">Use These Coordinates</button>
      </form>
    </div>
  );

  return null;
}
