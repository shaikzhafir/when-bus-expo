import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { sharedStyles } from "../styles";
import { colors } from "../theme";

type TopBarProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function TopBar({ title, subtitle, onBack, right }: TopBarProps) {
  return (
    <View style={sharedStyles.topBar}>
      {onBack && (
        <TouchableOpacity
          style={sharedStyles.iconButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
      )}
      <View style={sharedStyles.topBarTitleWrap}>
        <Text style={sharedStyles.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={sharedStyles.topBarSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
