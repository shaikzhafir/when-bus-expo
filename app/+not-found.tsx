import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "./styles";
import { colors } from "./theme";

export default function NotFoundScreen() {
  return (
    <View style={[sharedStyles.screen, { justifyContent: "center" }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={sharedStyles.stateContainer}>
        <Ionicons name="help-circle-outline" size={32} color={colors.inkMuted} />
        <Text style={sharedStyles.stateText}>This screen doesn&rsquo;t exist.</Text>
        {/* asChild so the tap target is a real 44pt touchable, not bare text */}
        <Link href="/" asChild>
          <TouchableOpacity
            style={sharedStyles.textButton}
            accessibilityRole="link"
          >
            <Text style={sharedStyles.textButtonLabel}>Go to nearby stops</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
