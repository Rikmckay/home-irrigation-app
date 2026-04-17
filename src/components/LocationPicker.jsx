import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'

// Default center: Victoria, BC — user will pan to their yard
const DEFAULT_CENTER = [48.4284, -123.3656]
const DEFAULT_ZOOM = 15

/**
 * Internal component: listens for map clicks and calls onPick(lat, lng)
 */
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Internal component: flies to existing coordinates on first render (edit mode)
 */
function InitialView({ lat, lng }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (!done.current && lat != null && lng != null) {
      map.setView([lat, lng], 18)
      done.current = true
    }
  }, [lat, lng, map])
  return null
}

/**
 * LocationPicker
 *
 * Props:
 *   lat     — current latitude (null if not set)
 *   lng     — current longitude (null if not set)
 *   onChange(lat, lng) — called when user clicks the map
 */
export default function LocationPicker({ lat, lng, onChange }) {
  return (
    <div className="space-y-1.5">
      <div
        className="rounded-xl overflow-hidden border border-gray-300 shadow-sm cursor-crosshair"
        style={{ height: 300 }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <InitialView lat={lat} lng={lng} />
          {lat != null && lng != null && (
            <Marker position={[lat, lng]} />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 flex items-center gap-1">
        <MapPin size={11} />
        {lat != null && lng != null
          ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : 'Click the map to place a pin. Pan/zoom to your yard first.'}
      </p>
    </div>
  )
}
