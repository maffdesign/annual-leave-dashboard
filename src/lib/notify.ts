// FYI 알림 — 결재 요청이 아니라 "등록됐습니다" 팩트를 공유한다.
// SLACK_WEBHOOK_URL 환경변수가 있을 때만 동작(없으면 조용히 skip).
// 서버 전용(서버 액션에서 호출).

type LeaveNotice = {
  name: string;
  dept: string | null;
  startDate: string;
  endDate: string;
  days: number;
  typeLabel: string;
  coverageWarning: boolean;
};

export async function notifyLeaveRegistered(notice: LeaveNotice): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return; // 미설정 시 no-op

  const period =
    notice.startDate === notice.endDate
      ? notice.startDate
      : `${notice.startDate} ~ ${notice.endDate}`;

  const lines = [
    `🗓️ *${notice.name}* (${notice.dept ?? "-"}) 님이 연차를 등록했습니다.`,
    `• 기간: ${period} (${notice.typeLabel} ${notice.days}일)`,
  ];
  if (notice.coverageWarning) {
    lines.push(`• ⚠️ 같은 부서 동시 연차 권장 한도 초과 — 업무 공백 확인 필요`);
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch {
    // 알림 실패가 연차 등록을 막아선 안 되므로 조용히 무시.
  }
}
