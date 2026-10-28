export const RequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  RETURN_PENDING: "RETURN_PENDING",
  RETURNED: "RETURNED",
} as const;

export type RequestStatusType = (typeof RequestStatus)[keyof typeof RequestStatus];

// Allowed state transitions according to system rules:
export const ALLOWED_TRANSITIONS: Record<RequestStatusType, RequestStatusType[]> = {
  PENDING: [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED],
  APPROVED: [RequestStatus.RETURN_PENDING],
  RETURN_PENDING: [RequestStatus.RETURNED, RequestStatus.APPROVED],
  REJECTED: [],
  CANCELLED: [],
  RETURNED: [],
};

