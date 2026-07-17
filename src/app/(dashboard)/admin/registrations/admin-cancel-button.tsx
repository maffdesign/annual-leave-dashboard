"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { adminCancelLeave } from "../actions";
import { Button } from "@/components/ui/button";

export function AdminCancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  function cancel() {
    setError(undefined);
    startTransition(async () => {
      const res = await adminCancelLeave(requestId);
      if (res?.error) setError(res.error);
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            취소
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={cancel}
          >
            확인
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          <Ban />
          시기변경
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
