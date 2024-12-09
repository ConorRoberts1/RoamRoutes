import { View, Text, Button, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import sightseeingImage from '../../assets/images/sightseeing.jpg';
import { BackgroundGradient } from '../../constants/globalStyles'; 
import { useNavigation, useRouter } from 'expo-router';


export default function Messages() {
  return (
    <BackgroundGradient>
      <View>
      <Text>Messages</Text>
    </View>
    </BackgroundGradient>
  )
}