export const TICKET_NUMBER_PREFIX = 'SOP';

export function buildTicketNumber(year: number, sequence: number): string {
  return `${TICKET_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, '0')}`;
}

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_ATTACHMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const REPORT_ROUTE_PREFIX = '/reportar';

export function buildReportUrl(publicAssetCode: string, baseUrl: string): string {
  return `${baseUrl}${REPORT_ROUTE_PREFIX}/${publicAssetCode}`;
}
