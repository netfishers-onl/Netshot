/**
 * Permet de scroller un élément vers le haut
 * @param el élément à scroller
 */
export function scrollToTop(el: HTMLElement) {
	setTimeout(() => {
		el?.scrollTo({ top: 0 });
	});
}
