import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    children?: React.ReactNode;
    style?: ViewStyle;
}

export default function GradientBackground({ children, style }: Props) {
    return (
        <View style={[styles.container, style]}>
            {/* Background gradients layered to match the web design */}
            <LinearGradient
                colors={['#e2e8f0', '#f1f5f9', '#cbd5e1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Blue radial-like effect (simulated with linear gradient overlay) */}
            <LinearGradient
                colors={['rgba(59,130,246,0.1)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.8 }}
                style={StyleSheet.absoluteFill}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
