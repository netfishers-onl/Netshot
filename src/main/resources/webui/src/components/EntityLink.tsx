import { Steps, Text, TextProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react"
import { Link, LinkProps } from "react-router"

export type EntityLinkProps = PropsWithChildren<LinkProps & TextProps>

export function EntityLink(props: EntityLinkProps) {
  const { children, ...linkProps } = props

  return (
    <Text {...linkProps} textDecoration="underline" asChild><Link>
        {children}
      </Link></Text>
  );
}
