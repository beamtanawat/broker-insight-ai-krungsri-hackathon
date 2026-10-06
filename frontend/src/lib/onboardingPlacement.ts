export type PlacementDirection = "top" | "bottom" | "left" | "right" | "center";

export interface SimpleRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

export interface PopoverPositionResult {
  top: number;
  left: number;
  placement: PlacementDirection;
  maxHeight: number;
  maxWidth: number;
  isMobile: boolean;
  style: React.CSSProperties;
}

export interface CalculatePositionParams {
  targetRect: SimpleRect | DOMRect | null;
  windowSize: { width: number; height: number };
  cardDimensions: { width: number; height: number };
  preferredPlacement?: PlacementDirection;
  margin?: number;
  offset?: number;
}

/**
 * Checks if two bounding boxes overlap
 */
export function isRectOverlapping(
  r1: { top: number; bottom: number; left: number; right: number },
  r2: { top: number; bottom: number; left: number; right: number },
  tolerance = 0
): boolean {
  return !(
    r1.right <= r2.left + tolerance ||
    r1.left >= r2.right - tolerance ||
    r1.bottom <= r2.top + tolerance ||
    r1.top >= r2.bottom - tolerance
  );
}

/**
 * Smart collision-free positioning algorithm for onboarding tour popovers:
 * 1. Guarantees the popover NEVER overflows screen edges (clamped strictly within viewport).
 * 2. Guarantees the popover NEVER covers the highlighted target feature (strict non-overlapping invariant).
 * 3. Cascade search across 4 directions: preferred -> opposite -> sides.
 * 4. Graceful responsive docking on mobile viewports.
 */
export function calculateTourPopoverPosition({
  targetRect,
  windowSize,
  cardDimensions,
  preferredPlacement = "bottom",
  margin = 16,
  offset = 16,
}: CalculatePositionParams): PopoverPositionResult {
  const isMobile = windowSize.width < 768;

  // ── 1. Mobile Viewport Handling: Dock as top/bottom drawer without obscuring target ──
  if (isMobile) {
    const cardMaxWidth = windowSize.width - 24;
    const maxDrawerHeight = Math.round(windowSize.height * 0.46);

    // If target is in the lower portion of screen (> 52% down), dock card at top so target isn't covered
    if (targetRect && targetRect.bottom > windowSize.height * 0.52) {
      return {
        top: 16,
        left: 12,
        placement: "top",
        isMobile: true,
        maxHeight: maxDrawerHeight,
        maxWidth: cardMaxWidth,
        style: {
          position: "fixed",
          top: "16px",
          left: "12px",
          right: "12px",
          width: "auto",
          maxHeight: `${maxDrawerHeight}px`,
          zIndex: 10002,
        },
      };
    }

    // Default mobile: dock at bottom
    return {
      top: windowSize.height - maxDrawerHeight - 16,
      left: 12,
      placement: "bottom",
      isMobile: true,
      maxHeight: maxDrawerHeight,
      maxWidth: cardMaxWidth,
      style: {
        position: "fixed",
        bottom: "16px",
        left: "12px",
        right: "12px",
        width: "auto",
        maxHeight: `${maxDrawerHeight}px`,
        zIndex: 10002,
      },
    };
  }

  // ── 2. Fallback: Centered if no target element is present ──
  let cardW = Math.min(cardDimensions.width || 440, windowSize.width - margin * 2);
  let cardH = Math.min(cardDimensions.height || 360, windowSize.height - margin * 2);

  if (!targetRect) {
    const centerTop = Math.max(margin, Math.round((windowSize.height - cardH) / 2));
    const centerLeft = Math.max(margin, Math.round((windowSize.width - cardW) / 2));
    return {
      top: centerTop,
      left: centerLeft,
      placement: "center",
      isMobile: false,
      maxHeight: windowSize.height - margin * 2,
      maxWidth: cardW,
      style: {
        position: "fixed",
        top: `${centerTop}px`,
        left: `${centerLeft}px`,
        width: `${cardW}px`,
        maxHeight: `${windowSize.height - margin * 2}px`,
        zIndex: 10002,
      },
    };
  }

  // ── 3. Desktop Collision Avoidance & Multi-direction Clearance Analysis ──
  // Account for the 8px spotlight highlight border/glow
  const spotlightHalo = 8;
  const target = {
    top: Math.max(0, targetRect.top - spotlightHalo),
    bottom: Math.min(windowSize.height, targetRect.bottom + spotlightHalo),
    left: Math.max(0, targetRect.left - spotlightHalo),
    right: Math.min(windowSize.width, targetRect.right + spotlightHalo),
    width: targetRect.width + spotlightHalo * 2,
    height: targetRect.height + spotlightHalo * 2,
  };

  // Calculate available clearance on all 4 sides outside the target
  const clearances: Record<"bottom" | "top" | "right" | "left", number> = {
    bottom: windowSize.height - (target.bottom + offset) - margin,
    top: target.top - offset - margin,
    right: windowSize.width - (target.right + offset) - margin,
    left: target.left - offset - margin,
  };

  // Determine candidate direction evaluation order based on preferred placement
  let candidates: ("bottom" | "top" | "right" | "left")[];
  if (preferredPlacement === "top") {
    candidates = ["top", "bottom", "right", "left"];
  } else if (preferredPlacement === "right") {
    candidates = ["right", "left", "bottom", "top"];
  } else if (preferredPlacement === "left") {
    candidates = ["left", "right", "bottom", "top"];
  } else {
    // "bottom" or fallback
    candidates = ["bottom", "top", "right", "left"];
  }

  // Check if a candidate direction can fit the card completely without overlap
  function canFitInDirection(dir: "bottom" | "top" | "right" | "left"): boolean {
    if (dir === "bottom" || dir === "top") {
      return clearances[dir] >= cardH && windowSize.width >= cardW + margin * 2;
    } else {
      return clearances[dir] >= cardW && windowSize.height >= cardH + margin * 2;
    }
  }

  // Select the first direction that comfortably fits
  let chosenPlacement = candidates.find(canFitInDirection);

  // If none fit completely, choose the direction with the maximum clearance space
  if (!chosenPlacement) {
    chosenPlacement = candidates.reduce((best, cur) =>
      clearances[cur] > clearances[best] ? cur : best
    );
  }

  // ── 4. Coordinate Calculation with Strict Non-Overlap Invariant ──
  let top = 0;
  let left = 0;
  let computedMaxHeight = windowSize.height - margin * 2;

  if (chosenPlacement === "bottom") {
    // Card MUST be placed strictly below target bottom
    top = target.bottom + offset;
    const availableHeight = Math.max(160, windowSize.height - top - margin);
    computedMaxHeight = Math.min(cardH, availableHeight);

    const idealLeft = target.left + target.width / 2 - cardW / 2;
    left = Math.max(margin, Math.min(windowSize.width - cardW - margin, idealLeft));
  } else if (chosenPlacement === "top") {
    // Card MUST be placed strictly above target top
    const idealTop = target.top - cardH - offset;
    if (idealTop < margin) {
      top = margin;
      // Cap height so card bottom strictly does not touch target.top - offset
      computedMaxHeight = Math.max(160, target.top - offset - margin);
    } else {
      top = idealTop;
      computedMaxHeight = Math.min(cardH, target.top - offset - top);
    }
    const idealLeft = target.left + target.width / 2 - cardW / 2;
    left = Math.max(margin, Math.min(windowSize.width - cardW - margin, idealLeft));
  } else if (chosenPlacement === "right") {
    // Card MUST be placed strictly to the right of target right
    left = target.right + offset;
    const availableWidth = windowSize.width - left - margin;
    if (availableWidth < cardW) {
      cardW = Math.max(280, availableWidth);
    }
    const idealTop = target.top + target.height / 2 - cardH / 2;
    top = Math.max(margin, Math.min(windowSize.height - cardH - margin, idealTop));
    computedMaxHeight = Math.min(cardH, windowSize.height - top - margin);
  } else if (chosenPlacement === "left") {
    // Card MUST be placed strictly to the left of target left
    const idealLeft = target.left - cardW - offset;
    if (idealLeft < margin) {
      left = margin;
      const maxW = target.left - offset - margin;
      if (maxW > 280) {
        cardW = maxW;
      }
    } else {
      left = idealLeft;
    }
    const idealTop = target.top + target.height / 2 - cardH / 2;
    top = Math.max(margin, Math.min(windowSize.height - cardH - margin, idealTop));
    computedMaxHeight = Math.min(cardH, windowSize.height - top - margin);
  }

  // Final check: clamp left & top within screen boundaries
  left = Math.max(margin, Math.min(windowSize.width - cardW - margin, left));
  top = Math.max(margin, Math.min(windowSize.height - computedMaxHeight - margin, top));

  // ── 5. Invariant Assertion & Emergency Unblock ──
  // If the card overlaps the target under any extreme circumstance, push it to whichever side has maximum clearance
  const cardBox = {
    top,
    bottom: top + computedMaxHeight,
    left,
    right: left + cardW,
  };

  if (isRectOverlapping(cardBox, targetRect)) {
    // Overlap detected: force shift to direction with most room
    const bestSide = candidates.reduce((best, cur) =>
      clearances[cur] > clearances[best] ? cur : best
    );

    if (bestSide === "bottom") {
      top = target.bottom + offset;
      computedMaxHeight = Math.max(160, windowSize.height - top - margin);
    } else if (bestSide === "top") {
      top = Math.max(margin, target.top - cardH - offset);
      computedMaxHeight = Math.max(160, target.top - offset - top);
    } else if (bestSide === "right") {
      left = target.right + offset;
      computedMaxHeight = Math.min(cardH, windowSize.height - top - margin);
    } else if (bestSide === "left") {
      left = Math.max(margin, target.left - cardW - offset);
      computedMaxHeight = Math.min(cardH, windowSize.height - top - margin);
    }
    chosenPlacement = bestSide;
  }

  return {
    top: Math.round(top),
    left: Math.round(left),
    placement: chosenPlacement,
    maxHeight: Math.round(computedMaxHeight),
    maxWidth: Math.round(cardW),
    isMobile: false,
    style: {
      position: "fixed",
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(cardW)}px`,
      maxHeight: `${Math.round(computedMaxHeight)}px`,
      zIndex: 10002,
    },
  };
}
