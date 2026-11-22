import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";

// With edge-to-edge, scroll content draws under the transparent status bar
// and nav bar and collides with their icons at any mid-scroll position.
// These solid covers make content disappear at the screen edges instead.
// Must render after the screen's scroll view so they sit on top of it.
export function EdgeScrims() {
  const insets = useSafeAreaInsets();
  return (
    <>
      {insets.top > 0 && (
        <View
          pointerEvents="none"
          style={[styles.scrim, { top: 0, height: insets.top }]}
        />
      )}
      {insets.bottom > 0 && (
        <View
          pointerEvents="none"
          style={[styles.scrim, { bottom: 0, height: insets.bottom }]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
  },
});
