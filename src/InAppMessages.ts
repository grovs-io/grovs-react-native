export type InAppDismissReason =
  | 'close_button'
  | 'backdrop'
  | 'swipe'
  | 'app'
  | 'orientation';

export type InAppMessageEvent =
  | { type: 'shown'; campaignId: string }
  | {
      type: 'clicked';
      campaignId: string;
      buttonId?: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'dismissed';
      campaignId: string;
      reason: InAppDismissReason | (string & {});
    }
  | {
      type: 'answered';
      campaignId: string;
      value: number | string;
      comment?: string;
    }
  | { type: 'failed'; campaignId?: string; message: string };

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Validates a raw native event body and drops null or missing optional keys. */
export function toInAppMessageEvent(raw: unknown): InAppMessageEvent | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const body = raw as Record<string, unknown>;
  const campaignId = optionalString(body.campaignId);

  if (body.type === 'failed') {
    const message = optionalString(body.message);
    if (message === undefined) {
      return null;
    }
    return campaignId === undefined
      ? { type: 'failed', message }
      : { type: 'failed', campaignId, message };
  }

  if (campaignId === undefined) {
    return null;
  }

  switch (body.type) {
    case 'shown':
      return { type: 'shown', campaignId };
    case 'clicked': {
      const event: InAppMessageEvent = { type: 'clicked', campaignId };
      const buttonId = optionalString(body.buttonId);
      if (buttonId !== undefined) {
        event.buttonId = buttonId;
      }
      if (typeof body.payload === 'object' && body.payload !== null) {
        event.payload = body.payload as Record<string, unknown>;
      }
      return event;
    }
    case 'dismissed': {
      const reason = optionalString(body.reason);
      if (reason === undefined) {
        return null;
      }
      return { type: 'dismissed', campaignId, reason };
    }
    case 'answered': {
      const value = body.value;
      if (typeof value !== 'number' && typeof value !== 'string') {
        return null;
      }
      const event: InAppMessageEvent = { type: 'answered', campaignId, value };
      const comment = optionalString(body.comment);
      if (comment !== undefined) {
        event.comment = comment;
      }
      return event;
    }
    default:
      return null;
  }
}
