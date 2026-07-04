"use client";

import {
  type DragEvent,
  type HTMLAttributes,
  type TouchEvent,
  useRef,
} from "react";

type SortableItemProps = HTMLAttributes<HTMLElement> & {
  "data-sortable-id": string;
};

type SortableHandleProps = HTMLAttributes<HTMLElement> & {
  draggable: true;
};

export function useSortableList(
  moveItem: (sourceId: string, targetId: string) => void,
) {
  const activeId = useRef<string | null>(null);
  const lastTargetId = useRef<string | null>(null);

  function moveTo(targetId: string) {
    const sourceId = activeId.current;

    if (!sourceId || sourceId === targetId || lastTargetId.current === targetId) {
      return;
    }

    lastTargetId.current = targetId;
    moveItem(sourceId, targetId);
  }

  function getItemProps(itemId: string): SortableItemProps {
    return {
      "data-sortable-id": itemId,
      onDragEnter: () => moveTo(itemId),
      onDragOver: (event: DragEvent<HTMLElement>) => event.preventDefault(),
    };
  }

  function getHandleProps(itemId: string): SortableHandleProps {
    return {
      draggable: true,
      onDragEnd: () => {
        activeId.current = null;
        lastTargetId.current = null;
      },
      onDragStart: (event: DragEvent<HTMLElement>) => {
        activeId.current = itemId;
        lastTargetId.current = itemId;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", itemId);
      },
      onTouchEnd: () => {
        activeId.current = null;
        lastTargetId.current = null;
      },
      onTouchMove: (event: TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];
        const target = document
          .elementFromPoint(touch.clientX, touch.clientY)
          ?.closest<HTMLElement>("[data-sortable-id]");

        if (target?.dataset.sortableId) {
          moveTo(target.dataset.sortableId);
        }
      },
      onTouchStart: () => {
        activeId.current = itemId;
        lastTargetId.current = itemId;
      },
    };
  }

  return { getHandleProps, getItemProps };
}
