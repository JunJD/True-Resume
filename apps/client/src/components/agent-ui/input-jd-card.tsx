/* eslint-disable lingui/no-unlocalized-strings */
import { Button, Card, CardContent, CardHeader, CardTitle, RichInput } from "@reactive-resume/ui";
import { useState } from "react";

type InputJDCardProps = {
  event: { value: string };
  resolve: (value: string) => void;
};

export function InputJDCard({ event, resolve }: InputJDCardProps) {
  const [content, setContent] = useState<string>();

  const handleSubmit = () => {
    const html = (content ?? "").trim();
    if (!html) return;
    resolve(html);
  };

  const handleCancel = () => {
    resolve("");
  };

  return (
    <Card className="my-3 border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">输入职位描述（JD）</CardTitle>
        <p className="mt-1 text-sm text-foreground/70">
          请粘贴或输入完整的职位描述（支持富文本）。
        </p>
        <div className="text-lg font-medium">{event.value}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <RichInput content={content} onChange={setContent} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSubmit}>提交 JD</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
