import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { sharedStyles } from "../styles";

type RefreshButtonProps = {
  onPress: () => void;
  isLoading?: boolean;
};

export function RefreshButton({ onPress, isLoading = false }: RefreshButtonProps) {
  return (
    <TouchableOpacity 
      style={sharedStyles.refreshButton} 
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={sharedStyles.refreshButtonText}>🔄 Refresh</Text>
      )}
    </TouchableOpacity>
  );
}

