import { useBreakpoint } from "@reactive-resume/hooks";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  VisuallyHidden,
} from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { Outlet } from "react-router";

import { useBuilderStore } from "@/client/stores/builder";

import { AgentChat } from "./chat";

const onOpenAutoFocus = (event: Event) => {
  event.preventDefault();
};

const OutletSlot = () => (
  <div className="absolute inset-0">
    <Outlet />
  </div>
);

export const AgentLayout = () => {
  const { isDesktop } = useBreakpoint();

  const sheet = useBuilderStore((state) => state.sheet);

  const leftSetSize = useBuilderStore((state) => state.panel.left.setSize);

  const leftHandle = useBuilderStore((state) => state.panel.left.handle);

  return isDesktop ? (
    <div className="relative size-full overflow-hidden">
      <PanelGroup direction="horizontal">
        <Panel
          minSize={45}
          maxSize={65}
          defaultSize={50}
          className={cn("z-10 bg-background", !leftHandle.isDragging && "transition-[flex]")}
          onResize={leftSetSize}
        >
          <AgentChat />
        </Panel>
        <PanelResizeHandle isDragging={leftHandle.isDragging} onDragging={leftHandle.setDragging} />
        <Panel>
          <OutletSlot />
        </Panel>
      </PanelGroup>
    </div>
  ) : (
    <div className="relative">
      <Sheet open={sheet.left.open} onOpenChange={sheet.left.setOpen}>
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle />
            <SheetDescription />
          </SheetHeader>
        </VisuallyHidden>

        <SheetContent
          side="left"
          showClose={false}
          className="top-16 p-0 sm:max-w-xl"
          onOpenAutoFocus={onOpenAutoFocus}
        >
          <AgentChat />
        </SheetContent>
      </Sheet>

      <OutletSlot />
    </div>
  );
};
