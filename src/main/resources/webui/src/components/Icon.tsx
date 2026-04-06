import { chakra, ChakraComponent, HTMLChakraProps } from "@chakra-ui/react";
import { createElement } from "react";
import * as icons from "react-feather";
import { Javascript, Python } from "./icons";


type IconBaseProps = { size?: number } & HTMLChakraProps<"svg">;

const Icon: { [k: string]: ChakraComponent<"svg", IconBaseProps> } = {};

for (const icon in icons) {
  const key = icon[0].toLowerCase() + icon.slice(1);
  Icon[key] = chakra(icons[icon as keyof typeof icons]);
  Icon[key].displayName = key;
}

// Add custom icon
Icon["javascript"] = chakra(Javascript);
Icon["python"] = chakra(Python);

type IconProps = {
  name: keyof typeof Icon;
} & IconBaseProps;

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
