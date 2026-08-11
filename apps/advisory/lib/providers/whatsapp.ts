/**
 * Provider-agnostic WhatsApp sender — same pattern as the 7MARKET Growth Office AgentProvider:
 * swap the exported instance for a real implementation without touching any caller.
 */
export interface WhatsAppProvider {
  sendMessage(to: string, text: string): Promise<{ id: string; delivered: boolean }>;
}

/** Logs instead of sending — keeps local/dev/CI runs honest about not having WhatsApp wired up yet. */
class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, text: string) {
    console.log(`[whatsapp:stub] -> ${to}: ${text}`);
    return { id: `stub_${Date.now()}`, delivered: false };
  }
}

/**
 * Real WhatsApp Business Cloud API implementation. Activate by setting WHATSAPP_TOKEN and
 * WHATSAPP_PHONE_NUMBER_ID (see .env.example) — the factory below picks this automatically.
 */
class WhatsAppCloudApiProvider implements WhatsAppProvider {
  constructor(
    private token: string,
    private phoneNumberId: string,
  ) {}

  async sendMessage(to: string, text: string) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    if (!res.ok) throw new Error(`WhatsApp API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { messages: { id: string }[] };
    return { id: data.messages[0].id, delivered: true };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneNumberId) return new WhatsAppCloudApiProvider(token, phoneNumberId);
  return new ConsoleWhatsAppProvider();
}
