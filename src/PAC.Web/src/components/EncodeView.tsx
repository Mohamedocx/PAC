import { useEffect, useMemo, useRef, useState } from 'react';
import { encode } from '../utils/pac';
import {
    FiHome,
    FiGrid,
    FiNavigation,
    FiCrosshair,
    FiMapPin,
    FiCopy,
    FiCheck,
    FiAlertTriangle,
    FiTarget,
    FiSliders,
    FiCheckCircle,
} from 'react-icons/fi';

type LocationType = 'house' | 'apartment';

export default function EncodeView() {
    const [locationType, setLocationType] = useState<LocationType>('house');
    const [latitude, setLatitude] = useState<string>('');
    const [longitude, setLongitude] = useState<string>('');
    const [precision, setPrecision] = useState<8 | 9>(8);
    const [floor, setFloor] = useState<string>('');
    const [apartment, setApartment] = useState<string>('');
    const [pacCode, setPacCode] = useState<string>('');
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [copied, setCopied] = useState(false);

    const copyTimerRef = useRef<number | null>(null);

    const latNum = useMemo(() => parseFloat(latitude), [latitude]);
    const lngNum = useMemo(() => parseFloat(longitude), [longitude]);

    const coordsAreValid = useMemo(() => {
        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return false;
        if (latNum < -90 || latNum > 90) return false;
        if (lngNum < -180 || lngNum > 180) return false;
        return true;
    }, [latNum, lngNum]);

    const requiresUnit = locationType === 'apartment';
    const unitComplete = !requiresUnit || (floor.trim() !== '' && apartment.trim() !== '');

    const canGenerate = coordsAreValid && unitComplete && !isLoading;

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        };
    }, []);

    const normalizeNumberInput = (v: string) => v.replace(/,/g, '.').trimStart();

    const handleUseMyLocation = () => {
        setIsLoading(true);
        setError('');
        setPacCode('');

        if (!navigator.geolocation) {
            setError('المتصفح لا يدعم تحديد الموقع الجغرافي');
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
                setGpsAccuracy(position.coords.accuracy);
                setIsLoading(false);
            },
            (err) => {
                setError(`خطأ في تحديد الموقع: ${err.message}`);
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleGenerate = () => {
        setError('');
        setPacCode('');

        if (!coordsAreValid) {
            setError('يرجى إدخال إحداثيات صحيحة ضمن النطاق المسموح');
            return;
        }

        if (requiresUnit && !unitComplete) {
            setError('يرجى إدخال رقم الطابق ورقم الشقة');
            return;
        }

        try {
            const result = encode({
                latitude: latNum,
                longitude: lngNum,
                precision,
                floor: requiresUnit ? parseInt(floor, 10) : undefined,
                apartment: requiresUnit ? apartment : undefined,
            });

            setPacCode(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(pacCode);
            setCopied(true);
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
            copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
        } catch {
            setError('فشل النسخ إلى الحافظة');
        }
    };

    // Clear error automatically when coordinates become valid
    useEffect(() => {
        if (latitude && longitude && coordsAreValid) setError('');
    }, [latitude, longitude, coordsAreValid]);

    return (
        <section dir="rtl" className="w-full">
            <div className="rounded-3xl border border-slate-200 bg-white">
                <div className="p-5 md:p-7">
                    {/* Title */}
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">
                                توليد عنوان <span className="text-slate-600">PAC</span>
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                أدخل الإحداثيات أو استخدم موقعك الحالي لإنشاء رمز قابل للمشاركة.
                            </p>
                        </div>

                        {/* Status badge */}
                        <div
                            className={[
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold',
                                coordsAreValid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600',
                            ].join(' ')}
                            aria-live="polite"
                        >
                            <span className={coordsAreValid ? 'text-emerald-600' : 'text-slate-500'}>
                                {coordsAreValid ? <FiCheckCircleMini /> : <FiCrosshair className="text-sm" />}
                            </span>
                            {coordsAreValid ? 'إحداثيات صحيحة' : 'تحقق من الإحداثيات'}
                        </div>
                    </div>

                    {/* Location type segmented */}
                    <div className="mb-6">
                        <Label icon={<FiGrid />} text="نوع الموقع" />
                        <div className="mt-2 inline-flex w-full rounded-2xl border border-slate-200 bg-slate-50 p-1">
                            <SegButton
                                active={locationType === 'house'}
                                onClick={() => setLocationType('house')}
                                icon={<FiHome />}
                                title="منزل"
                            />
                            <SegButton
                                active={locationType === 'apartment'}
                                onClick={() => setLocationType('apartment')}
                                icon={<FiGrid />}
                                title="شقة"
                            />
                        </div>
                    </div>

                    {/* Use my location */}
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-extrabold text-slate-900">استخدم موقعي الحالي</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    يفضّل تفعيل GPS للحصول على أفضل دقة.
                                </p>
                            </div>

                            <button
                                onClick={handleUseMyLocation}
                                disabled={isLoading}
                                className={[
                                    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition',
                                    'focus:outline-none focus:ring-4 focus:ring-blue-200',
                                    isLoading
                                        ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500'
                                        : 'border border-slate-200 bg-slate-900 text-white hover:brightness-110',
                                ].join(' ')}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                        جاري التحديد...
                                    </>
                                ) : (
                                    <>
                                        <FiMapPin className="text-base" />
                                        استخدم موقعي
                                    </>
                                )}
                            </button>
                        </div>

                        {gpsAccuracy !== null && (
                            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <FiTarget />
                                    دقة GPS
                                </div>
                                <span className="text-xs font-black text-slate-900">
                                    ±{gpsAccuracy.toFixed(0)} m
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Coordinates */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldCard
                            label="خط العرض"
                            hint="Latitude"
                            icon={<FiNavigation />}
                            value={latitude}
                            onChange={(v) => setLatitude(normalizeNumberInput(v))}
                            placeholder="31.235700"
                        />
                        <FieldCard
                            label="خط الطول"
                            hint="Longitude"
                            icon={<FiNavigation />}
                            value={longitude}
                            onChange={(v) => setLongitude(normalizeNumberInput(v))}
                            placeholder="30.044400"
                        />
                    </div>

                    {/* Precision */}
                    <div className="mb-6">
                        <Label icon={<FiSliders />} text="الدقة (Precision)" />
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <Chip
                                active={precision === 8}
                                onClick={() => setPrecision(8)}
                                title="8"
                                subtitle="≈ 19m"
                            />
                            <Chip
                                active={precision === 9}
                                onClick={() => setPrecision(9)}
                                title="9"
                                subtitle="≈ 2.4m"
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            اختر دقة أعلى للشقق أو لتحديد نقطة أدق، ودقة أقل للمنزل أو العنوان العام.
                        </p>
                    </div>

                    {/* Apartment */}
                    {requiresUnit && (
                        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                <FiGrid />
                                تفاصيل الوحدة
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldCard
                                    label="الطابق"
                                    hint="Floor"
                                    required
                                    icon={<FiGrid />}
                                    value={floor}
                                    onChange={(v) => setFloor(v.trimStart())}
                                    placeholder="3"
                                    type="number"
                                />
                                <FieldCard
                                    label="رقم الشقة"
                                    hint="Apartment"
                                    required
                                    icon={<FiGrid />}
                                    value={apartment}
                                    onChange={(v) => setApartment(v.trimStart())}
                                    placeholder="A02"
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate */}
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className={[
                            'w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition',
                            'focus:outline-none focus:ring-4 focus:ring-blue-200',
                            canGenerate
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200',
                        ].join(' ')}
                    >
                        <FiTarget className="text-base" />
                        توليد عنوان PAC
                    </button>

                    {/* Error */}
                    {error && (
                        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            <div className="flex items-start gap-2">
                                <FiAlertTriangle className="mt-0.5 shrink-0" />
                                <p className="font-bold">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Output */}
                    {pacCode && (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                            <p className="text-sm font-extrabold text-slate-900">عنوان PAC الخاص بك</p>
                            <p className="mt-1 text-xs text-slate-500">
                                انسخ الرمز وشاركه بسهولة.
                            </p>

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-lg font-black text-slate-900 text-center break-all">
                                    {pacCode}
                                </div>

                                <button
                                    onClick={handleCopy}
                                    className={[
                                        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition',
                                        'focus:outline-none focus:ring-4 focus:ring-blue-200',
                                        copied
                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border border-slate-200 bg-slate-900 text-white hover:brightness-110',
                                    ].join(' ')}
                                    title="نسخ"
                                >
                                    {copied ? <FiCheck /> : <FiCopy />}
                                    {copied ? 'تم النسخ' : 'نسخ'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

/* ---------- Small UI helpers ---------- */

function Label({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <span className="text-slate-600">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

function SegButton({
    active,
    onClick,
    icon,
    title,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition',
                'focus:outline-none focus:ring-4 focus:ring-blue-200',
                active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-white',
            ].join(' ')}
            aria-pressed={active}
        >
            <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
            <span>{title}</span>
        </button>
    );
}

function Chip({
    active,
    onClick,
    title,
    subtitle,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    subtitle: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'rounded-2xl border px-4 py-3 text-left transition',
                'focus:outline-none focus:ring-4 focus:ring-blue-200',
                active
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
            ].join(' ')}
            aria-pressed={active}
        >
            <div className="flex items-center justify-between">
                <span className={['text-sm font-black', active ? 'text-blue-700' : 'text-slate-900'].join(' ')}>
                    {title}
                </span>
                <span className={['text-xs font-bold', active ? 'text-blue-700/80' : 'text-slate-500'].join(' ')}>
                    {subtitle}
                </span>
            </div>
        </button>
    );
}

function FieldCard({
    label,
    hint,
    icon,
    value,
    onChange,
    placeholder,
    required,
    type = 'text',
}: {
    label: string;
    hint?: string;
    icon: React.ReactNode;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-slate-600">{icon}</span>
                    <p className="text-sm font-extrabold text-slate-900">
                        {label} {required && <span className="text-rose-500">*</span>}
                    </p>
                </div>
                {hint && <span className="text-xs font-bold text-slate-400">{hint}</span>}
            </div>

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={[
                    'mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900',
                    'placeholder:text-slate-400 outline-none transition',
                    'focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-200',
                ].join(' ')}
            />
        </div>
    );
}

function FiCheckCircleMini() {
    return <FiCheckCircle className="text-sm" />;
}
