'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

// Fix broken marker icon paths in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function ServiceAreaMap({ initialGeoJSON, onChange }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const drawnItemsRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return

    const map = L.map(containerRef.current, {
      center: [-40.9006, 174.886],
      zoom: 5,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // FeatureGroup to store drawn items
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)
    drawnItemsRef.current = drawnItems

    // If existing geoJSON, add it
    if (initialGeoJSON) {
      try {
        const layer = L.geoJSON(initialGeoJSON)
        layer.eachLayer((l) => {
          if (l instanceof L.Polygon || l instanceof L.Polyline) {
            drawnItems.addLayer(l)
          }
        })
        if (drawnItems.getBounds().isValid()) {
          map.fitBounds(drawnItems.getBounds())
        }
      } catch (e) {
        // Invalid geoJSON, ignore
      }
    }

    // Draw control
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: '#1f2937', weight: 2 },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
    })
    map.addControl(drawControl)

    // Events
    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      onChange(e.layer.toGeoJSON())
    })

    map.on(L.Draw.Event.EDITED, () => {
      const layers = []
      drawnItems.eachLayer((l) => {
        if (l instanceof L.Polygon || l instanceof L.Polyline) {
          layers.push(l.toGeoJSON())
        }
      })
      onChange(layers.length === 1 ? layers[0] : null)
    })

    map.on(L.Draw.Event.DELETED, () => {
      onChange(null)
    })

    mapInstanceRef.current = map

    // Fix resize issue
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-xl border border-gray-200 bg-gray-100"
    />
  )
}
