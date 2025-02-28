export function stopPropagate(callback: () => void) {
	return (e: { stopPropagation: () => void }) => {
		e.stopPropagation();
		callback();
	};
}
