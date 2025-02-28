import { chakra, ChakraComponent, HTMLChakraProps } from "@chakra-ui/react";
import { createElement } from "react";
import * as icons from "react-feather";
import { Javascript, Python } from "./icons";

/**
 * @note Permet d'encapsuler les icons provenant de la lib "react-feather"
 * dans un ChakraComponent, cela permet de profiter des props de ChakraUI
 *
 * @example
 * Avant:
 * <Activity color="red" size="16" />
 *
 * Après:
 * <Icon name="activity" color="red.500" />
 * (le size est renseigné automatiquement dans Icon)
 */
const Icon: { [k: string]: ChakraComponent<"svg", IconProps> } = {};

for (const icon in icons) {
  const key = icon[0].toLowerCase() + icon.slice(1);
  Icon[key] = chakra(icons[icon]);
  Icon[key].displayName = key;
}

// Add custom icon
Icon["javascript"] = chakra(Javascript);
Icon["python"] = chakra(Python);

type IconProps = {
  name: keyof typeof Icon;
  size?: number;
} & HTMLChakraProps<"svg">;

export default (props: IconProps) => {
  const { name, ...other } = props;

  if (Icon[name] == null) {
    return null;
  }

  return createElement(Icon[name], {
    size: 16,
    ...other,
  });
};
