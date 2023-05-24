/* eslint-disable max-len */
import React from "react";
import { useMantineTheme } from "@mantine/core";

interface NetshotLogoProps extends React.ComponentPropsWithoutRef<"svg"> {
  variant?: "white" | "default";
  width?: number;
}

export function NetshotLogo({ variant = "default", width = 110, ...others }: NetshotLogoProps) {
	const theme = useMantineTheme();
	const mainColor = (variant === "white") ? "#FFF" : theme.colors[theme.primaryColor][6];

	return (
		<svg {...others} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 100" width={width}>
			<ellipse
				style={{ fill: "none", stroke: mainColor, strokeWidth: 4 }}
				cx="108.74383"
				cy="-25.976542"
				rx="47.619049"
				ry="47.619045"
				transform="rotate(40)"
			/>
			<path
				style={{ fill: "none", stroke: mainColor, strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" }}
				d="M 64.779197,53.08142 122.49756,23.188443 103.08142,85.2208"
			/>
			<path
				style={{ fill: "none", stroke: mainColor, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
				d="M 72.043368,63.093004 122.49756,23.188443"
			/>
			<path
				style={{ fill: "none", stroke: mainColor, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
				d="M 81.359158,72.215288 122.49756,23.188443"
			/>
			<path
				style={{ fill: "none", stroke: mainColor, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
				d="M 91.960523,79.805482 122.49756,23.188443"
			/>
			<g
				aria-label="Text"
				style={{ fontSize: 64, fontFamily: "Gurmukhi MT", fill: mainColor, stroke: "none" }}
			>
				<path d="m 170.81909,72.279884 v -50.176 h 4.608 l 30.848,42.496 v -42.496 h 4.608 v 50.176 h -4.608 l -30.848,-42.432 v 42.432 z" />
				<path d="m 247.04308,53.783884 h -26.048 q 0,7.36 3.392,11.264 3.456,3.84 9.024,3.84 4.224,0 8.128,-2.688 1.088,-0.704 2.304,-1.728 1.216,-1.088 2.624,-2.496 v 5.568 q -1.536,1.152 -2.88,2.048 -1.28,0.832 -2.432,1.408 -4.032,2.112 -8.064,2.112 -6.976,0 -11.84,-4.8 -5.248,-5.056 -5.248,-13.12 0,-7.616 4.736,-12.736 4.8,-5.184 11.84,-5.184 6.848,0 10.88,4.992 3.584,4.544 3.584,11.52 z m -25.408,-3.904 h 20.032 q -0.768,-4.352 -3.328,-6.464 -2.496,-2.176 -6.08,-2.176 -3.968,0 -6.72,2.496 -2.56,2.304 -3.904,6.144 z" />
				<path d="m 256.13107,27.927884 h 4.224 v 10.048 h 9.024 v 4.16 h -9.024 v 21.76 q 0,2.688 0.96,3.84 1.024,1.152 3.456,1.152 1.408,0 2.368,-0.32 1.024,-0.32 2.24,-0.832 v 4.16 q -1.024,0.32 -2.496,0.576 -1.408,0.32 -2.88,0.32 -3.84,0 -5.952,-1.728 -2.368,-1.792 -2.368,-5.76 v -23.168 h -5.76 v -4.16 h 5.76 z" />
				<path d="m 273.34701,69.335884 v -5.568 q 3.968,3.2 8.064,4.48 1.216,0.32 2.368,0.512 1.152,0.128 2.368,0.128 3.904,0 6.464,-1.792 2.624,-1.92 2.624,-4.288 0,-1.28 -0.96,-2.624 -1.344,-1.664 -7.168,-3.008 -6.912,-1.728 -9.216,-2.88 -4.48,-2.56 -4.48,-7.168 0,-4.288 3.712,-7.04 3.776,-2.816 9.408,-2.816 2.56,0 4.608,0.448 2.048,0.448 3.84,1.216 1.792,0.704 3.328,1.792 v 5.568 q -2.688,-2.24 -5.632,-3.52 -2.944,-1.344 -6.208,-1.344 -3.264,0 -5.632,1.472 -2.432,1.472 -2.432,3.84 0,3.136 5.76,4.992 2.688,0.768 5.312,1.536 2.624,0.768 5.312,1.536 5.824,2.496 5.824,7.552 0,4.288 -4.032,7.552 -4.096,3.2 -10.176,3.2 -2.688,0 -5.248,-0.576 -4.096,-0.896 -7.808,-3.2 z" />
				<path d="m 305.73091,22.103884 h 4.608 v 22.08 q 1.6,-2.56 3.904,-4.288 3.52,-2.624 7.872,-2.624 2.688,0 4.8,0.768 2.176,0.768 3.968,2.24 3.776,3.328 3.776,9.344 v 22.656 h -4.672 v -22.016 q 0,-3.712 -2.368,-6.272 -2.368,-2.56 -5.76,-2.56 -4.928,0 -8.192,3.904 -3.328,4.032 -3.328,9.216 v 17.728 h -4.608 z" />
				<path d="m 355.13887,73.111884 q -6.592,0 -11.584,-4.8 -5.312,-5.056 -5.312,-13.12 0,-7.616 4.672,-12.736 4.8,-5.184 11.84,-5.184 6.976,0 11.776,5.184 4.736,5.12 4.736,12.672 0,7.936 -5.12,13.12 -4.736,4.864 -11.008,4.864 z m -0.448,-4.224 q 4.608,0 8.192,-3.84 3.456,-3.904 3.456,-9.92 0,-6.208 -3.712,-10.112 -3.392,-3.584 -7.872,-3.584 -4.608,0 -7.872,3.712 -3.584,4.096 -3.584,10.048 0,6.016 3.52,10.048 3.264,3.648 7.872,3.648 z" />
				<path d="m 380.48276,27.927884 h 4.224 v 10.048 h 9.024 v 4.16 h -9.024 v 21.76 q 0,2.688 0.96,3.84 1.024,1.152 3.456,1.152 1.408,0 2.368,-0.32 1.024,-0.32 2.24,-0.832 v 4.16 q -1.024,0.32 -2.496,0.576 -1.408,0.32 -2.88,0.32 -3.84,0 -5.952,-1.728 -2.368,-1.792 -2.368,-5.76 v -23.168 h -5.76 v -4.16 h 5.76 z" />
			</g>
		</svg>
	);
}
