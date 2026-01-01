import { Link } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { sharedStyles } from "../styles";

type NavigationButtonProps = {
  href: string;
  text: string;
};

export function NavigationButton({ href, text }: NavigationButtonProps) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity style={sharedStyles.navButton}>
        <Text style={sharedStyles.navButtonText}>{text}</Text>
      </TouchableOpacity>
    </Link>
  );
}

