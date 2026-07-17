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

  await postToSlack(url, lines.join("\n"));
}

type AdminCancelNotice = {
  employeeName: string;
  dept: string | null;
  adminName: string;
  startDate: string;
  endDate: string;
  reason: string;
};

/** 관리자가 시기변경권으로 등록된 연차에 개입(취소)했을 때 알림. */
export async function notifyLeaveCancelledByAdmin(
  notice: AdminCancelNotice,
): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const period =
    notice.startDate === notice.endDate
      ? notice.startDate
      : `${notice.startDate} ~ ${notice.endDate}`;

  const lines = [
    `🛠️ *시기변경권 개입* — 관리자가 등록된 연차를 조정(취소)했습니다.`,
    `• 대상: ${notice.employeeName} (${notice.dept ?? "-"})`,
    `• 기간: ${period}`,
    `• 처리자: ${notice.adminName}`,
    `• 사유: ${notice.reason}`,
  ];

  await postToSlack(url, lines.join("\n"));
}

/** 공통 Slack 전송 (실패해도 본 작업을 막지 않도록 조용히 무시). */
async function postToSlack(url: string, text: string): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // 알림 실패는 등록/취소 자체를 막지 않는다.
  }
}
