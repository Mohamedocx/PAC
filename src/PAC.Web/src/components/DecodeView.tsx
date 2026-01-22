import { useEffect, useMemo, useRef, useState } from 'react';
import { decode, validate } from '../utils/pac';
import MapView from './MapView';
import {
    FiSearch,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiTrash2,
    FiCopy,
    FiCheck,
    FiExternalLink,
    FiMapPin,
    FiInfo,
} from 'react-icons/fi';

type Decoded = {
    latitude: number;
    longitude: number;
    precision: number;
    floor?: number;
    apartment?: string;
};

type ValidationState =
    | { status: 'idle'; message: '' }
    | { status: 'valid'; message: string; precision: number }
    | { status: 'invalid'; message: string };

export default function DecodeView() {
    const [pacCode, setPacCode] = useState<string>('');
    const [decodedData, setDecodedData] = useState<Decoded | null>(null);
    const [error, setError] = useState<string>('');
    const [isDecoding, setIsDecoding] = useState(false);

    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef<number | null>(null);

    const [validation, setValidation] = useState<ValidationState>({
        status: 'idle',
        message: '',
    });

    // Debounced validation
    useEffect(() => {
        setError('');
        setDecodedData(null);

        const v = pacCode.trim();
        if (!v) {
            setValidation({ status: 'idle', message: '' });
            return;
        }

        const t = window.setTimeout(() => {
            const result = validate(v);

            if (result.isValid) {
                setValidation({
                    status: 'valid',
                    message: `عنوان صحيح • دقة ${result.precision}`,
                    precision: result.precision!,
                });
            } else {
                setValidation({
                    status: 'invalid',
                    message: result.reason || 'عنوان غير صحيح',
                });
            }
        }, 220);

        return () => window.clearTimeout(t);
    }, [pacCode]);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        };
    }, []);

    const isValid = validation.status === 'valid';

    const precisionHint = useMemo(() => {
        if (validation.status !== 'valid') return null;
        return validation.precision === 8 ? '≈ 19m' : '≈ 2.4m';
    }, [validation]);

    const normalizeInput = (value: string) => value.replace(/\s+/g, ' ').trimStart();

    const handleDecode = () => {
        setError('');
        setDecodedData(null);

        const v = pacCode.trim();
        if (!v) {
            setError('يرجى إدخال عنوان PAC');
            return;
        }

        setIsDecoding(true);
        try {
            const result = decode(v);

            if (!result.isValid) {
                setError(result.reason || 'عنوان PAC غير صحيح');
                return;
            }

            setDecodedData({
                latitude: result.latitude!,
                longitude: result.longitude!,
                precision: result.precision!,
                floor: result.floor,
                apartment: result.apartment,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsDecoding(false);
        }
    };

    const handleOpenInMaps = () => {
        if (!decodedData) return;
        const url = `https://www.google.com/maps?q=${decodedData.latitude},${decodedData.longitude}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCopyCoords = async () => {
        if (!decodedData) return;
        try {
            await navigator.clipboard.writeText(`${decodedData.latitude}, ${decodedData.longitude}`);
            setCopied(true);
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
            copyTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setError('تعذر النسخ. تأكد من صلاحيات المتصفح.');
        }
    };

    const statusPill =
        validation.status === 'valid'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : validation.status === 'invalid'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-slate-50 text-slate-600';

    const inputRing =
        validation.status === 'valid'
            ? 'focus:border-emerald-300 focus:ring-4 focus:ring-emerald-200'
            : validation.status === 'invalid'
                ? 'focus:border-rose-300 focus:ring-4 focus:ring-rose-200'
                : 'focus:border-blue-300 focus:ring-4 focus:ring-blue-200';

    return (
        <section dir="rtl" className="w-full">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)]">
                <div className="p-5 md:p-7">
                    {/* Header */}
                    <header className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">
                                فك عنوان <span className="text-slate-600">PAC</span>
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                أدخل الرمز للتحقق ثم اعرض الموقع على الخريطة.
                            </p>
                        </div>

                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${statusPill}`}>
                            {validation.status === 'idle' && <FiClock className="text-sm" />}
                            {validation.status === 'valid' && <FiCheckCircle className="text-sm" />}
                            {validation.status === 'invalid' && <FiXCircle className="text-sm" />}
                            {validation.status === 'idle' ? 'بانتظار الإدخال' : validation.status === 'valid' ? 'صالح' : 'غير صالح'}
                        </div>
                    </header>

                    {/* Input card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                        <label className="block text-sm font-extrabold text-slate-900">أدخل عنوان PAC</label>

                        <div className="mt-2 relative">
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <FiSearch className="text-slate-500" />
                            </div>

                            <input
                                type="text"
                                value={pacCode}
                                onChange={(e) => setPacCode(normalizeInput(e.target.value))}
                                placeholder="THTQ-9C8K-7 أو THTQ-9C8K-7 / F3-A02"
                                className={[
                                    'w-full rounded-xl border border-slate-200 bg-slate-50 px-10 pl-12 py-3 text-sm font-semibold text-slate-900',
                                    'placeholder:text-slate-400 outline-none transition',
                                    inputRing,
                                ].join(' ')}
                                onKeyDown={(e) => e.key === 'Enter' && isValid && !isDecoding && handleDecode()}
                                autoComplete="off"
                                spellCheck={false}
                                aria-invalid={validation.status === 'invalid'}
                            />

                            {pacCode.trim() && (
                                <button
                                    type="button"
                                    onClick={() => setPacCode('')}
                                    className="absolute inset-y-0 left-2 my-2 inline-flex items-center gap-2 rounded-lg px-3 text-xs font-black text-slate-700 hover:bg-slate-100 transition"
                                    aria-label="مسح الإدخال"
                                >
                                    <FiTrash2 />
                                    مسح
                                </button>
                            )}
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            يدعم إدخال الوحدة مثل <span className="font-mono text-slate-700">/ F3-A02</span>. لن يتم حفظ أي بيانات.
                        </p>

                        {/* Validation */}
                        {validation.status !== 'idle' && (
                            <div
                                className={[
                                    'mt-3 rounded-xl border px-3 py-2 text-sm font-bold',
                                    validation.status === 'valid'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-rose-200 bg-rose-50 text-rose-700',
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2">
                                        {validation.status === 'valid' ? <FiCheckCircle /> : <FiXCircle />}
                                        {validation.message}
                                    </span>

                                    {validation.status === 'valid' && precisionHint && (
                                        <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs font-black text-emerald-700">
                                            {precisionHint}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={handleDecode}
                                disabled={!isValid || isDecoding}
                                className={[
                                    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition',
                                    'focus:outline-none focus:ring-4 focus:ring-blue-200',
                                    isValid && !isDecoding
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200',
                                ].join(' ')}
                            >
                                {isDecoding ? (
                                    <>
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        جارٍ الفك...
                                    </>
                                ) : (
                                    <>
                                        <FiSearch />
                                        فك العنوان
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setPacCode('THTQ-9C8K-7 / F3-A02')}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 transition"
                            >
                                <FiMapPin />
                                مثال سريع
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                <span className="font-black">⚠️</span> {error}
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    {decodedData && (
                        <div className="mt-6 space-y-4 animate-fade-in">
                            {/* Coordinates */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-base md:text-lg font-black text-slate-900">
                                        الإحداثيات
                                    </h3>

                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-700">
                                        Precision: {decodedData.precision}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoCell label="خط العرض" value={decodedData.latitude.toFixed(6)} />
                                    <InfoCell label="خط الطول" value={decodedData.longitude.toFixed(6)} />
                                    <InfoCell
                                        label="الدقة التقريبية"
                                        value={decodedData.precision === 8 ? '≈ 19m' : '≈ 2.4m'}
                                    />
                                    {decodedData.floor !== undefined && decodedData.apartment && (
                                        <InfoCell
                                            label="الوحدة"
                                            value={`الطابق ${decodedData.floor} • شقة ${decodedData.apartment}`}
                                        />
                                    )}
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={handleOpenInMaps}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-black text-white hover:brightness-110 transition"
                                    >
                                        <FiExternalLink />
                                        فتح في خرائط Google
                                    </button>

                                    <button
                                        onClick={handleCopyCoords}
                                        className={[
                                            'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition',
                                            'focus:outline-none focus:ring-4 focus:ring-blue-200',
                                            copied
                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                                        ].join(' ')}
                                        title="نسخ الإحداثيات"
                                    >
                                        {copied ? <FiCheck /> : <FiCopy />}
                                        {copied ? 'تم النسخ' : 'نسخ الإحداثيات'}
                                    </button>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-base md:text-lg font-black text-slate-900">الموقع على الخريطة</h3>
                                    <span className="text-xs font-bold text-slate-500">عرض تفاعلي</span>
                                </div>

                                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                                    <MapView
                                        latitude={decodedData.latitude}
                                        longitude={decodedData.longitude}
                                        precision={decodedData.precision}
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 md:p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-sky-200 bg-white text-sky-700">
                                        <FiInfo />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">معلومة</p>
                                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                                            عنوان PAC يحوّل الموقع الجغرافي إلى رمز قصير سهل المشاركة.
                                            <span className="font-black"> كل العمليات تتم محلياً داخل المتصفح</span> دون إرسال أو تخزين بيانات.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="mt-5 text-xs text-slate-500 text-center">
                        نصيحة: للصق سريع استخدم <span className="font-mono text-slate-700">Ctrl/Cmd + V</span>
                    </p>
                </div>
            </div>
        </section>
    );
}

function InfoCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black text-slate-600">{label}</p>
            <p className="mt-1 font-mono text-sm font-black text-slate-900 break-words">{value}</p>
        </div>
    );
}
