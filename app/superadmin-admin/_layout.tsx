import BottomBar from "@/components/BottomBar";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function SuperadminLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['left', 'right', 'bottom']}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <BottomBar/>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}