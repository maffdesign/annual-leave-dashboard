import { Badge, type BadgeProps } from "@/components/ui/badge";
import { STATUS_LABEL, type RequestStatus } from "@/types";

const variantMap: Record<RequestStatus, BadgeProps["variant"]> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={variantMap[status]}>{STATUS_LABEL[status]}</Badge>;
}
