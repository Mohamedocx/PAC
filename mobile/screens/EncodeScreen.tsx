import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { encode } from '../utils/pac';
import GradientBackground from '../components/GradientBackground';
import { Card, SegButton, FieldCard, Chip, Button, Label } from '../components/UI';
import { Feather } from '@expo/vector-icons';

export default function EncodeScreen() {
    const [locationType, setLocationType] = useState<'house' | 'apartment'>('house');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [precision, setPrecision] = useState<8 | 9>(8);
    const [floor, setFloor] = useState('');
    const [apartment, setApartment] = useState('');
    const [pacCode, setPacCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    const coordsAreValid = useMemo(() => {
        if (isNaN(latNum) || isNaN(lngNum)) return false;
        if (latNum < -90 || latNum > 90) return false;
        if (lngNum < -180 || lngNum > 180) return false;
        return true;
    }, [latNum, lngNum]);

    const requiresUnit = locationType === 'apartment';
    const unitComplete = !requiresUnit || (floor.trim() !== '' && apartment.trim() !== '');
    const canGenerate = coordsAreValid && unitComplete && !loading;

    const handleUseMyLocation = async () => {
        setLoading(true);
        setPacCode('');
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setLatitude(location.coords.latitude.toFixed(6));
            setLongitude(location.coords.longitude.toFixed(6));
            setGpsAccuracy(location.coords.accuracy);
        } catch (error) {
            Alert.alert('Error', 'Could not fetch location');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!canGenerate) return;

        try {
            const result = encode({
                latitude: latNum,
                longitude: lngNum,
                precision,
                floor: requiresUnit ? parseInt(floor, 10) : undefined,
                apartment: requiresUnit ? apartment : undefined,
            });
            setPacCode(result);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(pacCode);
        Alert.alert('تم النسخ', 'تم نسخ عنوان PAC إلى الحافظة');
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>توليد عنوان PAC</Text>
                        <Text style={styles.subtitle}>أدخل الإحداثيات أو استخدم موقعك الحالي</Text>
                    </View>
                    <View style={[styles.badge, coordsAreValid ? styles.badgeValid : styles.badgeInvalid]}>
                        <Feather
                            name={coordsAreValid ? 'check-circle' : 'crosshair'}
                            size={12}
                            color={coordsAreValid ? '#047857' : '#64748b'}
                        />
                        <Text style={[styles.badgeText, coordsAreValid ? { color: '#047857' } : { color: '#64748b' }]}>
                            {coordsAreValid ? ' إحداثيات صحيحة' : ' تحقق من الإحداثيات'}
                        </Text>
                    </View>
                </View>

                <Card>
                    {/* Location Type */}
                    <Label icon="grid" text="نوع الموقع" />
                    <View style={styles.segRow}>
                        <SegButton
                            active={locationType === 'house'}
                            onPress={() => setLocationType('house')}
                            icon="home"
                            title="منزل"
                        />
                        <View style={{ width: 8 }} />
                        <SegButton
                            active={locationType === 'apartment'}
                            onPress={() => setLocationType('apartment')}
                            icon="grid"
                            title="شقة"
                        />
                    </View>

                    {/* Use Location */}
                    <View style={styles.locationSection}>
                        <View style={styles.locationHeader}>
                            <Text style={styles.sectionTitle}>استخدم موقعي الحالي</Text>
                            <Text style={styles.sectionSubtitle}>يفضّل تفعيل GPS لأعلى دقة</Text>
                        </View>
                        <Button
                            title="استخدم موقعي"
                            icon="map-pin"
                            onPress={handleUseMyLocation}
                            loading={loading}
                            variant="dark"
                        />
                        {gpsAccuracy !== null && (
                            <View style={styles.gpsBadge}>
                                <Feather name="target" size={12} color="#334155" />
                                <Text style={styles.gpsText}>دقة GPS ±{gpsAccuracy.toFixed(0)}m</Text>
                            </View>
                        )}
                    </View>

                    {/* Coordinates */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <FieldCard
                                label="خط العرض"
                                icon="compass"
                                value={latitude}
                                onChange={setLatitude}
                                placeholder="31.23..."
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <FieldCard
                                label="خط الطول"
                                icon="compass"
                                value={longitude}
                                onChange={setLongitude}
                                placeholder="30.04..."
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Precision */}
                    <View style={{ marginTop: 12 }}>
                        <Label icon="sliders" text="الدقة (Precision)" />
                        <View style={styles.row}>
                            <Chip
                                active={precision === 8}
                                onPress={() => setPrecision(8)}
                                title="8"
                                subtitle="≈ 19m"
                            />
                            <Chip
                                active={precision === 9}
                                onPress={() => setPrecision(9)}
                                title="9"
                                subtitle="≈ 2.4m"
                            />
                        </View>
                        <Text style={styles.helperText}>اختر دقة أعلى للشقق، وأقل للمنازل.</Text>
                    </View>

                    {/* Apartment Details */}
                    {requiresUnit && (
                        <View style={styles.apartmentBox}>
                            <View style={styles.rowCenter}>
                                <Feather name="grid" size={14} color="#0f172a" />
                                <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>تفاصيل الوحدة</Text>
                            </View>
                            <View style={[styles.row, { marginTop: 12 }]}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <FieldCard
                                        label="الطابق"
                                        icon="layers"
                                        value={floor}
                                        onChange={setFloor}
                                        required
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <FieldCard
                                        label="رقم الشقة"
                                        icon="hash"
                                        value={apartment}
                                        onChange={setApartment}
                                        required
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Generate Button */}
                    <View style={{ marginTop: 24 }}>
                        <Button
                            title="توليد عنوان PAC"
                            icon="target"
                            onPress={handleGenerate}
                            disabled={!canGenerate}
                            variant={canGenerate ? 'primary' : 'disabled'}
                        />
                    </View>

                    {/* Result */}
                    {pacCode ? (
                        <View style={styles.resultBox}>
                            <Text style={styles.resultTitle}>عنوان PAC الخاص بك</Text>
                            <View style={styles.codeContainer}>
                                <Text style={styles.codeText}>{pacCode}</Text>
                            </View>
                            <Button
                                title="نسخ"
                                icon="copy"
                                onPress={handleCopy}
                                variant="secondary"
                            />
                        </View>
                    ) : null}
                </Card>
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 4,
        textAlign: 'left', // Force LTR for now
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'left',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeValid: {
        borderColor: '#a7f3d0',
        backgroundColor: '#ecfdf5',
    },
    badgeInvalid: {
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    segRow: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    locationSection: {
        backgroundColor: '#f8fafc', // white in web but this card is white, so maybe slate50
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        marginBottom: 20,
    },
    locationHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    gpsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignSelf: 'flex-start',
    },
    gpsText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        marginLeft: 6,
    },
    row: {
        flexDirection: 'row',
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    helperText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 8,
        marginBottom: 20,
    },
    apartmentBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        marginBottom: 20,
    },
    resultBox: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center',
    },
    codeContainer: {
        backgroundColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    codeText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});
