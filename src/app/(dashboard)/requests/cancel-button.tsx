"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { cancelLeave } from "./actions";
import { Button } from "@/components/ui/button";

export function CancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);

  // 모달 열렸을 때 배경 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, pending]);

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const res = await cancelLeave(requestId);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        <X />
        취소
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          {/* 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setOpen(false)}
          />
          {/* 다이얼로그 */}
          <div className="relative z-10 w-full max-w-sm rounded-lg border bg-card p-6 text-center shadow-xl">
            <h2 id="cancel-dialog-title" className="text-base font-semibold">
              연차를 취소할까요?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              취소하면 해당 연차 등록이 삭제되고 잔여 일수가 복구됩니다. 이 작업은
              되돌릴 수 없습니다.
            </p>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                닫기
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={confirm}
              >
                {pending ? "취소 중…" : "연차 취소"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
