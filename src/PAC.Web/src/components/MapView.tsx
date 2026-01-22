import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet (do once)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
    latitude: number;
    longitude: number;
    precision: number;
}

export default function MapView({ latitude, longitude, precision }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const radius = useMemo(() => (precision === 8 ? 19 : 2.4), [precision]);
    const radiusLabel = useMemo(() => (precision === 8 ? '19' : '2.4'), [precision]);

    // Keep refs for overlays so we can update without nuking the map
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Init map only once
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false, // we add it to bottom-left for a cleaner UI
                attributionControl: false, // we'll add a subtle one
            }).setView([latitude, longitude], 15);

            // Tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Controls (pro placement)
            L.control
                .zoom({ position: 'bottomleft' })
                .addTo(mapRef.current);

            L.control
                .attribution({ position: 'bottomright', prefix: false })
                .addAttribution('© OpenStreetMap contributors')
                .addTo(mapRef.current);
        } else {
            // Smooth pan to new coordinates
            mapRef.current.flyTo([latitude, longitude], 15, {
                animate: true,
                duration: 0.8,
            });
        }

        const map = mapRef.current;

        // Update or create marker
        if (!markerRef.current) {
            markerRef.current = L.marker([latitude, longitude], {
                keyboard: false,
            }).addTo(map);
        } else {
            markerRef.current.setLatLng([latitude, longitude]);
        }

        // Update or create circle (precision/accuracy)
        const circleStyle: L.PathOptions = {
            color: '#1D4ED8',     // blue-700
            weight: 2,
            fillColor: '#3B82F6', // blue-500
            fillOpacity: 0.15,
        };

        if (!circleRef.current) {
            circleRef.current = L.circle([latitude, longitude], {
                ...circleStyle,
                radius,
            }).addTo(map);

            circleRef.current.bindTooltip(`الدقة التقريبية: ±${radiusLabel}m`, {
                direction: 'top',
                opacity: 0.9,
                sticky: true,
            });
        } else {
            circleRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setRadius(radius);
            circleRef.current.setStyle(circleStyle);
            circleRef.current.setTooltipContent(`الدقة التقريبية: ±${radiusLabel}m`);
        }

        // Fit bounds subtly when precision is large (optional nice touch)
        // (keeps user centered, but not annoying)
        const bounds = circleRef.current.getBounds();
        map.fitBounds(bounds, { padding: [24, 24], animate: true, maxZoom: 17 });

        // Cleanup on unmount only
        return () => {
            // no-op here, we keep map instance until component unmounts
        };
    }, [latitude, longitude, radius, radiusLabel]);

    // Destroy map only when component unmounts
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markerRef.current = null;
            circleRef.current = null;
        };
    }, []);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Map */}
            <div ref={mapContainerRef} className="h-72 w-full" />

            {/* Pro badge (theme-aligned) */}
            <div className="absolute top-3 right-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm backdrop-blur">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    الدقة: ±{radiusLabel}m
                </div>
            </div>

            {/* Tiny helper bottom-left (optional, feels premium) */}
            <div className="absolute bottom-3 left-3">
                <div className="rounded-lg border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur">
                    اسحب للتنقل • كبّر/صغّر من الأزرار
                </div>
            </div>
        </div>
    );
}
