import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, FontAwesome5, Feather, Fontisto } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen
        name="trips"
        options={{
          tabBarLabel: 'My Trips',
          tabBarIcon: ({ color }) => (
            <Fontisto name="holiday-village" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          tabBarLabel: "Connections",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="handshake" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => (
            <Feather name="message-square" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user-circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
