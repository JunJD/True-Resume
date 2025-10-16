import { t } from "@lingui/macro";
import {
  ArrowsClockwiseIcon,
  CircleNotchIcon,
  DownloadIcon,
  GearIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { Button, Tooltip } from "@reactive-resume/ui";
import { useState } from "react";
import { useNavigate } from "react-router";

import { toast } from "@/client/hooks/use-toast";
import { updateResume } from "@/client/services/resume";
import { useResumeStore } from "@/client/stores/resume";

export const AgentHeader = () => {
  const title = useResumeStore((state) => state.resume.title);
  const resume = useResumeStore((state) => state.resume);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const onSaveAndExit = async () => {
    try {
      setSaving(true);
      await updateResume({
        id: resume.id,
        title: resume.title,
        slug: resume.slug,
        visibility: resume.visibility,
        data: resume.data,
      });
      toast({ variant: "success", title: t`Saved`, description: t`Your changes have been saved.` });
      void navigate("/dashboard/resumes");
    } catch (error) {
      toast({ variant: "error", title: t`Save failed`, description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-12 items-center justify-between bg-[var(--background-gray-main)] px-6">
      {/* Left side - Resume title */}
      <div className="flex items-center gap-x-3">
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-x-2">
        <Tooltip content={t`Save & Exit`}>
          <Button size="sm" variant="info" disabled={saving} onClick={onSaveAndExit}>
            {saving ? <CircleNotchIcon className="animate-spin" /> : t`Save & Exit`}
          </Button>
        </Tooltip>

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
