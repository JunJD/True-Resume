import { t } from "@lingui/macro";
import {
  ArrowsClockwiseIcon,
  DownloadIcon,
  GearIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { Button, Tooltip } from "@reactive-resume/ui";

import { useResumeStore } from "@/client/stores/resume";

export const AgentHeader = () => {
  const title = useResumeStore((state) => state.resume.title);

  return (
    <div className="flex h-12 items-center justify-between bg-[var(--background-gray-main)] px-6">
      {/* Left side - Resume title */}
      <div className="flex items-center gap-x-3">
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-x-2">
        <Tooltip content={t`Refresh`}>
          <Button size="icon" variant="ghost">
            <ArrowsClockwiseIcon />
          </Button>
        </Tooltip>

        <Tooltip content={t`Share`}>
          <Button size="icon" variant="ghost">
            <ShareNetworkIcon />
          </Button>
        </Tooltip>

        <Tooltip content={t`Export`}>
          <Button size="icon" variant="ghost">
            <DownloadIcon />
          </Button>
        </Tooltip>

        <Tooltip content={t`Settings`}>
          <Button size="icon" variant="ghost">
            <GearIcon />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
