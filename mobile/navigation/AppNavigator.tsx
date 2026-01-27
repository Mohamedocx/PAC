import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EncodeScreen from '../screens/EncodeScreen';
import DecodeScreen from '../screens/DecodeScreen';

const Tab = createBottomTabNavigator();

function Tabs() {
    const insets = useSafeAreaInsets();

    // ارتفاع “أساسي” للتاب بار بدون safe area
    const baseHeight = 56;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,

                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#e2e8f0',

                    // ✅ أهم سطرين: خلي الارتفاع والبوتوم بادينج يحسبوا safe area
                    height: baseHeight + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 8),

                    paddingTop: 8,
                    elevation: 8,

                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                },

                tabBarActiveTintColor: '#0f172a',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarLabelStyle: {
                    fontWeight: 'bold',
                    fontSize: 12,
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Encode"
                component={EncodeScreen}
                options={{
                    title: 'توليد',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="hash" size={size} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Decode"
                component={DecodeScreen}
                options={{
                    title: 'فك العنوان',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="search" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tabs />
        </NavigationContainer>
    );
}
