/**
 * Convertie la donnée en gigabyte avec deux flottants
 */
export function getMemorySize(
	size: number,
	format: "mb" | "gb" = "mb",
	fixed = 2
) {
	let normalized = 0;

	if (format === "mb") {
		normalized = size / 1024;
	} else if (format === "gb") {
		normalized = size / 1024 / 1024;
	}
	return normalized.toFixed(fixed);
}
