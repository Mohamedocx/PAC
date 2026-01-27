import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

import EncodeScreen from '../screens/EncodeScreen';
import DecodeScreen from '../screens/DecodeScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#ffffff',
                        borderTopColor: '#e2e8f0',
                        height: Platform.OS === 'ios' ? 88 : 60,
                        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
        </NavigationContainer>
    );
}
