/**
 * Scroll an element to the top
 * @param el element to scroll
 */
export function scrollToTop(el: HTMLElement) {
	setTimeout(() => {
		el?.scrollTo({ top: 0 });
	});
}
