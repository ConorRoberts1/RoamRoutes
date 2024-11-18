import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../config/firebaseConfig';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const OnCreateAccount = () => {

    if(!email&&!password&&!username){
      Alert.alert("Please fill out information correctly")
    }
    console.log("Creating account for:", email);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("User created:", user);
        Alert.alert("Success", "Account created successfully!");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error creating account:", errorCode, errorMessage);
        Alert.alert("Error", errorMessage);
      });
  };

  return (
    <View
      style={{
        padding: 25,
        paddingTop: 50
      }}
    >
      <Text style={{
        fontWeight:'bold',
        marginTop: 20,
        fontSize: 30
      }}
      >Create New Account</Text>

      <View>
          <Text style={{
            marginTop: 30,
            color: 'black'
          }}>Username</Text>
          <TextInput
          style={styles.input}
          placeholder='Enter Username'
          onChangeText={(value)=>setUsername(value)}
          placeholderTextColor={'gray'}/>
      </View> 

      <View>
          <Text style={{
            marginTop: 20,
            color: 'black'
          }}>Email</Text>
          <TextInput
          style={styles.input}
          placeholder='Enter Email'
          onChangeText={(value)=>setEmail(value)}
          placeholderTextColor={'gray'}/>
        </View> 
        
        <View>
          <Text style={{
            marginTop: 20
          }}>Password</Text>
          <TextInput
          secureTextEntry={true}
          style={styles.input}
          placeholder='Enter Pasword'
          onChangeText={(value)=>setPassword(value)}
          placeholderTextColor={'gray'}/>
      </View> 

       {/* Sign in button */}
       <TouchableOpacity onPress={OnCreateAccount} style={{
        padding:15,
        backgroundColor:'black',
        borderRadius: 15,
        marginTop: 60
      }}>
        <Text style={{
          color: 'white',
          textAlign: 'center'
        }}>Create account</Text>
      </TouchableOpacity>


       {/* Create Account button */}
      <TouchableOpacity
      onPress={()=>router.replace('auth/sign-in')}
      style={{
        padding:15,
        backgroundColor:'white',
        borderRadius: 15,
        marginTop: 20,
        borderWidth: 1
      }}>
        <Text style={{
          color: 'black',
          textAlign: 'center'
        }}>Already have an account?</Text>
      </TouchableOpacity>

    </View>    
  );
}


const styles = StyleSheet.create({
  input:{
      padding: 15,
      borderWidth: 1,
      borderRadius: 15,
      borderColor: 'lightgrey'
  }
})