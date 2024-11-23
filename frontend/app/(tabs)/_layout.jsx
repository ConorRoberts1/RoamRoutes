import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import Fontisto from '@expo/vector-icons/Fontisto';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
        headerShown:false,
        tabBarActiveTintColor:'black',
        tabBarInactiveTintColor:'gray',
    }}>
        <Tabs.Screen name="trips"
            options={{
                tabBarLabel:'My Trips',
                tabBarIcon:({color})=><Fontisto name="holiday-village" size={24} color={color}/>
            }}
        />
        
        <Tabs.Screen name="connections"/>
        <Tabs.Screen name="profile"
            options={{
                tabBarLabel:'Profile',
                tabBarIcon:({color})=><FontAwesome name="user-circle" size={24} color={color}/>
            }}
        />
    </Tabs>
  )
}