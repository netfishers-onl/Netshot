import { Button, createStyles, Grid, Group, Modal, ModalProps, Paper, Text } from "@mantine/core";
import { IconAt, IconBrandGithub, IconCopyright, IconLifebuoy, IconVersions } from "@tabler/icons-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { NetshotLogo } from "./NetshotLogo";


const useStyles = createStyles((theme) => ({
	extLink: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center",
		height: 60,
	},
	pointedLink: {
		fontFamily: theme.fontFamilyMonospace,
		minHeight: "1em",
	},
	notes: {
		textAlign: "justify",
	},
}));

export default function AboutModal({ onClose, ...rest }: ModalProps) {
	const { classes } = useStyles();
	const auth = useAuth();
	const [pointedLink, setPointedLink] = useState("");

	const extLinks = [{
		label: "Source code",
		icon: IconBrandGithub,
		link: "https://github.com/netfishers-onl/Netshot"
	}, {
		label: "Support",
		icon: IconLifebuoy,
		link: "https://www.netfishers.onl/netshot",
	}, {
		label: "Contact",
		icon: IconAt,
		link: "mailto:netshot@netfishers.onl",
	}, {
		label: "Releases",
		icon: IconVersions,
		link: "https://github.com/netfishers-onl/Netshot/releases",
	}, {
		label: "License",
		icon: IconCopyright,
		link: "https://github.com/netfishers-onl/Netshot/blob/master/dist/COPYING",
	}];

	return (
		<Modal
			title="About Netshot"
			onClose={onClose}
			{...rest}
		>
			<Paper>
				<Group position="center">
					<NetshotLogo width={300} />
				</Group>
				<Group position="center">
					<Text mb="md" weight="bold">
						This is Netshot v{auth.serverInfo?.serverVersion}
					</Text>
				</Group>
				<Group>
					<Text className={classes.notes}>
						Netshot is open source product. It is distributed "as is",
						without warranty of any sort.
						Netshot developers can't be held responsible for any damage caused to
						your devices or your network by the usage of Netshot.
						Netshot has no relationship with the network device vendors.
					</Text>
				</Group>
				<Grid justify="center" mt="md">
					{extLinks.map((link) => (
						<Grid.Col span={4} key={link.label}>
							<Button<"a">
								component="a"
								href={link.link}
								target="_blank"
								variant="outline"
								className={classes.extLink}
								onMouseEnter={() => setPointedLink(link.link)}
							>
								<div>
									<link.icon />
									<Text>
										{link.label}
									</Text>
								</div>
							</Button>
						</Grid.Col>
					))}
				</Grid>
				<Group position="center" mt="md">
					<Text className={classes.pointedLink}>{pointedLink || " "}</Text>
				</Group>
			</Paper>
		</Modal>
	)
}