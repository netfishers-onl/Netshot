/**
 * Formate une valeur en byte
 * @param value valeur à formatter
 * @param units unité de formattage
 * @param digits nombre de décimal
 */
export function convertByte(
	value: number,
	unit: "b" | "kb" | "mb" | "gb" | "tb",
	digits = 1
) {
	const navigatorLocal =
		navigator.languages && navigator.languages.length >= 0
			? navigator.languages[0]
			: "en-US";
	const shortUnits = ["b", "kb", "mb", "gb", "tb"];
	const shortUnitIndex = shortUnits.findIndex((u) => u === unit);
	const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
	const unitIndex = Math.max(
		0,
		Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
	);

	const bytes = value * Math.pow(1024, unitIndex - 1);

	return Intl.NumberFormat(navigatorLocal, {
		style: "unit",
		unit: units[shortUnitIndex],
		maximumFractionDigits: digits,
	}).format(bytes / 1024 ** unitIndex);
}
