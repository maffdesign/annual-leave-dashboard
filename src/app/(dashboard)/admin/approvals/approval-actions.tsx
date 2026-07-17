"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveRequest, rejectRequest, type ApprovalResult } from "../actions";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(action: (id: string) => Promise<ApprovalResult>) {
    setError(undefined);
    startTransition(async () => {
      const res = await action(requestId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(rejectRequest)}
        >
          <X />
          반려
        </Button>
        <Button size="sm" disabled={pending} onClick={() => run(approveRequest)}>
          <Check />
          승인
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
