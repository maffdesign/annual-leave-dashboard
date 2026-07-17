"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { cancelLeave } from "./actions";
import { Button } from "@/components/ui/button";

export function CancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const res = await cancelLeave(requestId);
            if (res?.error) setError(res.error);
          });
        }}
      >
        <X />
        취소
      </Button>
      {error && <p className="max-w-[160px] text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
