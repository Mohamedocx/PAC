import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Colors
const COLORS = {
    slate900: '#0f172a',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    white: '#ffffff',
    blue600: '#2563eb',
    blue700: '#1d4ed8',
    blue200: '#bfdbfe',
    blue50: '#eff6ff',
    emerald50: '#ecfdf5',
    emerald200: '#a7f3d0',
    emerald700: '#047857',
    rose50: '#fff1f2',
    rose200: '#fecdd3',
    rose700: '#be123c',
};

// --- Label ---
export function Label({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
    return (
        <View style={styles.labelContainer}>
            <Feather name={icon} size={16} color={COLORS.slate600} />
            <Text style={styles.labelText}>{text}</Text>
        </View>
    );
}

// --- Card ---
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

// --- FieldCard ---
interface FieldCardProps {
    label: string;
    hint?: string;
    icon: keyof typeof Feather.glyphMap;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

export function FieldCard({
    label,
    hint,
    icon,
    value,
    onChange,
    placeholder,
    required,
    keyboardType = 'default',
}: FieldCardProps) {
    return (
        <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
                <View style={styles.labelRow}>
                    <Feather name={icon} size={14} color={COLORS.slate600} />
                    <Text style={styles.fieldLabel}>
                        {label} {required && <Text style={{ color: COLORS.rose700 }}>*</Text>}
                    </Text>
                </View>
                {hint && <Text style={styles.hintText}>{hint}</Text>}
            </View>

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={COLORS.slate400}
                keyboardType={keyboardType}
            />
        </View>
    );
}

// --- Button ---

interface ButtonProps {
    onPress: () => void;
    title: string;
    icon?: keyof typeof Feather.glyphMap;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'dark' | 'disabled';
    disabled?: boolean;
    loading?: boolean;
    style?: any;
}

export function Button({ onPress, title, icon, variant = 'primary', disabled, loading, style }: ButtonProps) {
    let colors = [COLORS.slate900, COLORS.slate900];
    let text = COLORS.white;
    let border = 'transparent';
    let useGradient = false;

    if (variant === 'primary') {
        // Blue Gradient
        colors = ['#3b82f6', '#1d4ed8']; // Blue 500 -> Blue 700
        text = COLORS.white;
        useGradient = true;
    } else if (variant === 'dark') {
        // Slate Gradient
        colors = ['#334155', '#0f172a']; // Slate 700 -> Slate 900
        text = COLORS.white;
        useGradient = true;
    } else if (variant === 'secondary') {
        colors = [COLORS.white, COLORS.white];
        text = COLORS.slate900;
        border = COLORS.slate200;
    } else if (variant === 'success') {
        colors = [COLORS.emerald50, COLORS.emerald50];
        text = COLORS.emerald700;
        border = COLORS.emerald200;
    } else if (variant === 'danger') {
        colors = [COLORS.rose50, COLORS.rose50];
        text = COLORS.rose700;
        border = COLORS.rose200;
    } else if (variant === 'disabled') {
        colors = [COLORS.slate100, COLORS.slate100];
        text = COLORS.slate400;
        border = COLORS.slate200;
    }

    if (disabled) {
        colors = [COLORS.slate100, COLORS.slate100];
        text = COLORS.slate400;
        border = COLORS.slate200;
        useGradient = false;
    }

    const content = (
        <View style={[styles.buttonContent, { paddingVertical: useGradient ? 0 : 16, paddingHorizontal: useGradient ? 0 : 24 }]}>
            {loading ? (
                <ActivityIndicator color={text} size="small" style={{ marginRight: 8 }} />
            ) : icon ? (
                <Feather name={icon} size={20} color={text} style={{ marginRight: 8 }} />
            ) : null}
            <Text style={[styles.buttonText, { color: text }]}>{title}</Text>
        </View>
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.buttonContainer,
                !useGradient && { backgroundColor: colors[0], borderColor: border, borderWidth: 1 },
                style
            ]}
            activeOpacity={0.8}
        >
            {useGradient ? (
                <LinearGradient
                    colors={colors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradient}
                >
                    {content}
                </LinearGradient>
            ) : (
                content
            )}
        </TouchableOpacity>
    );
}

// --- Segmented Control Button ---
export function SegButton({
    active,
    onPress,
    icon,
    title,
}: {
    active: boolean;
    onPress: () => void;
    icon: keyof typeof Feather.glyphMap;
    title: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.segButton,
                active && styles.segButtonActive,
            ]}
        >
            <Feather
                name={icon}
                size={16}
                color={active ? COLORS.white : COLORS.slate500}
                style={{ marginRight: 6 }}
            />
            <Text style={[styles.segText, active && styles.segTextActive]}>{title}</Text>
        </TouchableOpacity>
    );
}

// --- Chip ---
export function Chip({
    active,
    onPress,
    title,
    subtitle,
}: {
    active: boolean;
    onPress: () => void;
    title: string;
    subtitle: string;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.chip,
                active ? styles.chipActive : styles.chipInactive,
            ]}
        >
            <View style={styles.chipRow}>
                <Text style={[styles.chipTitle, active && { color: COLORS.blue700 }]}>{title}</Text>
                <Text style={[styles.chipSubtitle, active ? { color: COLORS.blue700 } : { color: COLORS.slate500 }]}>
                    {subtitle}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.slate900,
    },
    fieldCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        padding: 16,
        marginBottom: 12,
    },
    fieldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fieldLabel: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.slate900,
    },
    hintText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.slate400,
    },
    input: {
        backgroundColor: COLORS.slate50,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.slate900,
    },
    buttonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '800',
    },
    segButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    segButtonActive: {
        backgroundColor: COLORS.slate900,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segText: {
        fontWeight: '800',
        color: COLORS.slate500,
        fontSize: 13,
    },
    segTextActive: {
        color: COLORS.white,
    },
    chip: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: COLORS.blue50,
        borderColor: COLORS.blue200,
    },
    chipInactive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.slate200,
    },
    chipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chipTitle: {
        fontWeight: '900',
        fontSize: 14,
        color: COLORS.slate900,
    },
    chipSubtitle: {
        fontSize: 12,
        fontWeight: '700',
    },
});
