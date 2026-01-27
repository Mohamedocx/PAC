import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Alert, Dimensions, Linking } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Clipboard from 'expo-clipboard';
import { decode, validate } from '../utils/pac';
import GradientBackground from '../components/GradientBackground';
import { Card, Button, Label } from '../components/UI';
import { Feather } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DecodeScreen() {
    const [pacCode, setPacCode] = useState('');
    const [decodedData, setDecodedData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [validationMsg, setValidationMsg] = useState('');
    const [isValid, setIsValid] = useState(false);

    // Debounced Validation
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const value = pacCode.trim();

        if (!value) {
            setValidationMsg('');
            setIsValid(false);
            setIsChecking(false);
            return;
        }

        setIsChecking(true);

        const timer = setTimeout(() => {
            const result = validate(value);
            setIsValid(result.isValid);
            setValidationMsg(result.isValid ? 'PAC Code Valid' : (result.reason || 'Invalid Code'));
            setIsChecking(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [pacCode]);


    const handleDecode = () => {
        if (!isValid) return;
        setLoading(true);
        setDecodedData(null);

        try {
            const result = decode(pacCode.trim());
            if (!result.isValid) {
                Alert.alert('Error', result.reason);
                setLoading(false);
                return;
            }

            setDecodedData(result);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const openGoogleMaps = () => {
        if (!decodedData) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${decodedData.latitude},${decodedData.longitude}`;
        Linking.openURL(url);
    };

    const copyCoordinates = async () => {
        if (decodedData) {
            const str = `${decodedData.latitude}, ${decodedData.longitude}`;
            await Clipboard.setStringAsync(str);
            Alert.alert('Copied', 'Coordinates copied to clipboard');
        }
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>فك عنوان PAC</Text>
                        <Text style={styles.subtitle}>أدخل الرمز للتحقق وعرض الموقع</Text>
                    </View>
                    {validationMsg !== '' && (
                        <View style={[styles.badge, isValid ? styles.badgeValid : styles.badgeInvalid]}>
                            <Feather
                                name={isValid ? 'check-circle' : 'x-circle'}
                                size={12}
                                color={isValid ? '#047857' : '#be123c'}
                            />
                            <Text style={[styles.badgeText, { color: isValid ? '#047857' : '#be123c' }]}>
                                {isValid ? ' صالح' : ' غير صالح'}
                            </Text>
                        </View>
                    )}
                </View>

                <Card>
                    <Text style={styles.label}>أدخل عنوان PAC</Text>
                    <View style={styles.inputContainer}>
                        <View style={styles.searchIcon}>
                            <Feather name="search" size={18} color="#94a3b8" />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="THTQ-9C8K-7..."
                            placeholderTextColor="#94a3b8"
                            value={pacCode}
                            onChangeText={setPacCode}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                        {pacCode.length > 0 && (
                            <Button
                                title=""
                                icon="trash-2"
                                onPress={() => setPacCode('')}
                                variant="dark"
                                style={styles.clearBtn}
                            />

                        )}
                    </View>

                    <View style={{ marginTop: 16 }}>
                        <Button
                            title="فك العنوان"
                            icon="search"
                            onPress={handleDecode}
                            loading={loading}
                            disabled={!isValid || loading}
                        />


                    </View>
                </Card>

                {decodedData && (
                    <View style={styles.resultContainer}>
                        {/* Info Card */}
                        <Card style={{ padding: 16 }}>
                            <Text style={styles.sectionHeader}>الإحداثيات</Text>

                            <View style={styles.infoGrid}>
                                <InfoItem label="Lat" value={decodedData.latitude.toFixed(6)} />
                                <InfoItem label="Lng" value={decodedData.longitude.toFixed(6)} />
                            </View>

                            <View style={[styles.infoGrid, { marginTop: 10 }]}>
                                <InfoItem label="Precision" value={decodedData.precision === 8 ? '≈ 19m' : '≈ 2.4m'} />
                                {decodedData.floor !== undefined && (
                                    <InfoItem label="Unit" value={`F${decodedData.floor} - A${decodedData.apartment}`} />
                                )}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        title="Google Maps"
                                        icon="external-link"
                                        onPress={openGoogleMaps}
                                        variant="dark"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Button
                                        title="Copy"
                                        icon="copy"
                                        onPress={copyCoordinates}
                                        variant="secondary"
                                    />
                                </View>
                            </View>
                        </Card>

                        {/* Map */}
                        <Card style={{ padding: 0, overflow: 'hidden' }}>
                            <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                                <Text style={styles.sectionHeader}>الموقع على الخريطة</Text>
                            </View>
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={{
                                    latitude: decodedData.latitude,
                                    longitude: decodedData.longitude,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                                region={{
                                    latitude: decodedData.latitude,
                                    longitude: decodedData.longitude,
                                    latitudeDelta: 0.002,
                                    longitudeDelta: 0.002,
                                }}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: decodedData.latitude,
                                        longitude: decodedData.longitude,
                                    }}
                                    title="PAC Location"
                                />
                                <Circle
                                    center={{
                                        latitude: decodedData.latitude,
                                        longitude: decodedData.longitude,
                                    }}
                                    radius={decodedData.precision === 8 ? 19 : 2.4}
                                    strokeColor="rgba(37,99,235, 0.5)"
                                    fillColor="rgba(37,99,235, 0.2)"
                                />
                            </MapView>
                        </Card>
                    </View>
                )}
            </ScrollView>
        </GradientBackground>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
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
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
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
        backgroundColor: '#fff1f2',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        height: 50,
    },
    searchIcon: {
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        textAlign: 'left', // Keep LTR for input
    },
    clearBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 6,
    },
    resultContainer: {
        marginTop: 20,
        gap: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    infoItem: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#0f172a',
    },
    map: {
        width: '100%',
        height: 250,
    },
});
