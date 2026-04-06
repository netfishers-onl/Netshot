import { Stack, StackProps } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

export default function TableButtonStack(props: PropsWithChildren<StackProps>) {
	const { children, ...rest } = props
	return (
		<Stack
			direction="row"
			gap="0"
			justifyContent="end"
			marginTop="-10px"
			marginBottom="-10px"
			{...rest}>
			{children}
		</Stack>
	)
}
