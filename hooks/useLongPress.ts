"use client";

import { useCallback, useRef } from "react";

export function useLongPress(
  onLongPress: (
    e: React.TouchEvent | React.MouseEvent,
    coords: { x: number; y: number },
  ) => void,
  onClick?: (e: React.TouchEvent | React.MouseEvent) => void,
  delay: number = 500,
) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  const isPressing = useRef(false);
  const longPressTriggered = useRef(false);
  const coords = useRef({ x: 0, y: 0 });
  const startCoords = useRef({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      isPressing.current = true;
      longPressTriggered.current = false;

      if ("touches" in event && event.touches.length > 0) {
        coords.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      } else if ("clientX" in event) {
        coords.current = {
          x: (event as React.MouseEvent).clientX,
          y: (event as React.MouseEvent).clientY,
        };
      }
      startCoords.current = coords.current;

      timeout.current = setTimeout(() => {
        if (isPressing.current) {
          onLongPress(event, coords.current);
          longPressTriggered.current = true;
        }
      }, delay);
    },
    [onLongPress, delay],
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      isPressing.current = false;
      clearTimer();

      if (longPressTriggered.current) {
        if (
          event.cancelable &&
          (event.type === "touchend" || event.type === "mouseup")
        ) {
          event.preventDefault();
        }
      } else if (shouldTriggerClick) {
        onClick?.(event);
      }

      longPressTriggered.current = false;
    },
    [clearTimer, onClick],
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onTouchCancel: (e: React.TouchEvent) => clear(e, false),
    onTouchMove: (e: React.TouchEvent) => {
      if (!isPressing.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const hasMoved =
        Math.abs(touch.clientX - startCoords.current.x) > 10 ||
        Math.abs(touch.clientY - startCoords.current.y) > 10;
      if (hasMoved) {
        clear(e, false);
      }
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      coords.current = { x: e.clientX, y: e.clientY };
      onLongPress(e, coords.current);
      longPressTriggered.current = true;
    },
  };
}
