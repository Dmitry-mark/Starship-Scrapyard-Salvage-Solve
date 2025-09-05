import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import GateScreen from "./screens/GateScreen";   // экран выбора (web/app)
import StartScreen from "./screens/StartScreen";
import Quiz from "./screens/Quiz";
import Game from "./screens/Game";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Gate" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Gate" component={GateScreen} />
        <Stack.Screen name="StartScreen" component={StartScreen} />
        <Stack.Screen name="Quiz" component={Quiz} />
        <Stack.Screen name="Game" component={Game} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
