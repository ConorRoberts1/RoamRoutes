import { View, Text, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router';



export default function Login() {

  const router=useRouter();
  return (
    <View style={styles.container}>
    <Text style={{
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center'
      
    }}>Roam Routes</Text>

    <Text style={{
      fontSize: 16,
      textAlign: 'center',
      color: Colors.grey,
      marginTop: 10
    }}>Discover new places and meet new people!</Text>

    <TouchableOpacity style={styles.button}
    onPress={()=>router.push('/auth/sign-in')}>
      <Text style={{color: Colors.WHITE, 
      textAlign:'center',
      fontSize: 20}}>Get Started!</Text>
    </TouchableOpacity>
  </View>
  )
} 

const styles = StyleSheet.create({
  container:{
      backgroundColor:'white',
      marginTop: 60,
      height: '100%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 50
  },
  button: {
    padding: 15 ,
    backgroundColor:'black',
    borderRadius: 99,
    marginTop: '25%'

  }
})
