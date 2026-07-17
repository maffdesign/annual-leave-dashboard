"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { adminCancelLeave } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AdminCancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const res = await adminCancelLeave(requestId, reason);
      if (res?.error) {
        setError(res.error);
      } else {
        setConfirming(false);
        setReason("");
      }
    });
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          <Ban />
          시기변경
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-60 flex-col items-end gap-2">
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="시기변경 사유 (필수) — 업무상 지장 등"
        rows={2}
        className="text-xs"
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setReason("");
            setError(undefined);
          }}
        >
          닫기
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending || reason.trim() === ""}
          onClick={submit}
        >
          {pending ? "처리 중…" : "취소 확정"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
