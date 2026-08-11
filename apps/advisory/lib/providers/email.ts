export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string; delivered: boolean }>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage) {
    console.log(`[email:stub] -> ${message.to} :: ${message.subject}`);
    return { id: `stub_${Date.now()}`, delivered: false };
  }
}

/** Real transactional email via Resend. Activate with RESEND_API_KEY + EMAIL_FROM in .env. */
class ResendEmailProvider implements EmailProvider {
  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async send(message: EmailMessage) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: message.to, subject: message.subject, html: message.html }),
    });
    if (!res.ok) throw new Error(`Resend API error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { id: string };
    return { id: data.id, delivered: true };
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) return new ResendEmailProvider(apiKey, from);
  return new ConsoleEmailProvider();
}

export const emailTemplates = {
  wizardConfirmation: (name: string, planCode: string, specialist: string) => ({
    subject: 'Seu próximo passo na 7M Advisory',
    html: `<p>Olá, ${name}!</p><p>Com base no que você contou, seu plano sugerido é <strong>${planCode}</strong> e seu especialista será da área de <strong>${specialist}</strong>.</p><p>Em breve alguém da nossa equipe entra em contato para confirmar o agendamento.</p>`,
  }),
  verificationApproved: (companyName: string) => ({
    subject: '7M Verified aprovado',
    html: `<p>Parabéns! A ${companyName} agora tem o selo <strong>7M Verified</strong> — pré-requisito para Seat, marketplace com selo e 7M Capital.</p>`,
  }),
};
