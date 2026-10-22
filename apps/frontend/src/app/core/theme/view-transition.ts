import type { TransitionOrigin } from './types/transition-origin';
const REVEAL_CLASS = 'theme-reveal';
const REVEAL_DURATION_MS = 620;
const REVEAL_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

export function transitionOriginOf(element: Element): TransitionOrigin {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
}

export function revealTransition(
  document: Document,
  update: () => void,
  origin?: TransitionOrigin,
): void {
  const view = document.defaultView;
  const prefersReducedMotion = view?.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (
    !view ||
    !origin ||
    prefersReducedMotion ||
    typeof document.startViewTransition !== 'function'
  ) {
    update();
    return;
  }

  const root = document.documentElement;
  root.classList.add(REVEAL_CLASS);

  const transition = document.startViewTransition(update);
  const { x, y } = origin;
  const radius = Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y));

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: REVEAL_DURATION_MS,
          easing: REVEAL_EASING,
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => undefined);

  transition.finished.finally(() => root.classList.remove(REVEAL_CLASS)).catch(() => undefined);
}
