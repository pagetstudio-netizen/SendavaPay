import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email || 'onboarding@resend.dev'
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text
    });

    if (result.error) {
      console.error('Email send error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent successfully:', result.data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}

function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ' + currency;
}

function getBaseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: 700; color: #059669; text-align: center; margin: 20px 0; }
    .info-box { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    h2 { color: #111827; margin-bottom: 20px; }
    p { color: #374151; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SendavaPay</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>SendavaPay - Paiements Mobile Money en Afrique de l'Ouest</p>
      <p>Togo | Bénin | Burkina Faso | Cameroun | Côte d'Ivoire | RDC | Congo</p>
      <p style="margin-top: 15px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  welcome: (data: { fullName: string; email: string }) => {
    const content = `
      <h2>Bienvenue sur SendavaPay!</h2>
      <p>Bonjour ${data.fullName},</p>
      <p>Votre compte SendavaPay a été créé avec succès. Vous pouvez maintenant :</p>
      <div class="info-box">
        <ul style="margin: 0; padding-left: 20px;">
          <li>Créer des liens de paiement</li>
          <li>Effectuer des dépôts via Mobile Money</li>
          <li>Envoyer de l'argent à vos contacts</li>
          <li>Effectuer des retraits instantanés</li>
        </ul>
      </div>
      <p>Pour profiter de toutes les fonctionnalités, pensez à vérifier votre identité (KYC).</p>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard" class="button">Accéder à mon compte</a>
      </p>
      <p>À bientôt,<br>L'équipe SendavaPay</p>
    `;
    return {
      subject: 'Bienvenue sur SendavaPay!',
      html: getBaseTemplate(content, 'Bienvenue sur SendavaPay'),
      text: `Bienvenue sur SendavaPay! Bonjour ${data.fullName}, votre compte a été créé avec succès.`
    };
  },

  paymentReceived: (data: { 
    merchantName: string; 
    amount: number; 
    currency: string;
    transactionId: string;
    payerPhone: string;
    paymentLinkTitle?: string;
  }) => {
    const content = `
      <h2>Paiement reçu!</h2>
      <p>Bonjour ${data.merchantName},</p>
      <p>Vous avez reçu un nouveau paiement sur votre compte SendavaPay :</p>
      <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Téléphone payeur</span>
          <span class="detail-value">${data.payerPhone}</span>
        </div>
        ${data.paymentLinkTitle ? `
        <div class="detail-row">
          <span class="detail-label">Lien de paiement</span>
          <span class="detail-value">${data.paymentLinkTitle}</span>
        </div>
        ` : ''}
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' } as any)}</span>
        </div>
      </div>
      <p>Le montant a été crédité sur votre solde SendavaPay.</p>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard" class="button">Voir mon solde</a>
      </p>
    `;
    return {
      subject: `Paiement reçu: ${formatCurrency(data.amount, data.currency)}`,
      html: getBaseTemplate(content, 'Paiement reçu'),
      text: `Vous avez reçu un paiement de ${formatCurrency(data.amount, data.currency)}. Transaction #${data.transactionId}`
    };
  },

  paymentConfirmation: (data: {
    payerName?: string;
    amount: number;
    currency: string;
    transactionId: string;
    merchantName: string;
    productTitle?: string;
  }) => {
    const content = `
      <h2>Confirmation de paiement</h2>
      <p>Bonjour${data.payerName ? ` ${data.payerName}` : ''},</p>
      <p>Votre paiement a été effectué avec succès :</p>
      <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Marchand</span>
          <span class="detail-value">${data.merchantName}</span>
        </div>
        ${data.productTitle ? `
        <div class="detail-row">
          <span class="detail-label">Produit</span>
          <span class="detail-value">${data.productTitle}</span>
        </div>
        ` : ''}
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' } as any)}</span>
        </div>
      </div>
      <p>Merci pour votre confiance!</p>
    `;
    return {
      subject: `Confirmation de paiement - ${formatCurrency(data.amount, data.currency)}`,
      html: getBaseTemplate(content, 'Confirmation de paiement'),
      text: `Votre paiement de ${formatCurrency(data.amount, data.currency)} à ${data.merchantName} a été effectué avec succès. Transaction #${data.transactionId}`
    };
  },

  withdrawalCompleted: (data: {
    userName: string;
    amount: number;
    currency: string;
    transactionId: string;
    phone: string;
    operator: string;
  }) => {
    const content = `
      <h2>Retrait effectué</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Votre retrait a été traité avec succès :</p>
      <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Téléphone</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Opérateur</span>
          <span class="detail-value">${data.operator}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' } as any)}</span>
        </div>
      </div>
      <p>L'argent sera disponible sur votre compte Mobile Money sous quelques instants.</p>
    `;
    return {
      subject: `Retrait effectué: ${formatCurrency(data.amount, data.currency)}`,
      html: getBaseTemplate(content, 'Retrait effectué'),
      text: `Votre retrait de ${formatCurrency(data.amount, data.currency)} vers ${data.phone} a été effectué. Transaction #${data.transactionId}`
    };
  },

  kycApproved: (data: { userName: string }) => {
    const content = `
      <h2>Identité vérifiée!</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Félicitations! Votre demande de vérification d'identité (KYC) a été <strong style="color: #059669;">approuvée</strong>.</p>
      <div class="info-box">
        <p style="margin: 0;"><strong>Vous pouvez maintenant :</strong></p>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          <li>Effectuer des retraits illimités</li>
          <li>Accéder à toutes les fonctionnalités de la plateforme</li>
          <li>Bénéficier de limites de transaction plus élevées</li>
        </ul>
      </div>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard" class="button">Continuer</a>
      </p>
    `;
    return {
      subject: 'Votre identité a été vérifiée!',
      html: getBaseTemplate(content, 'KYC Approuvé'),
      text: `Félicitations ${data.userName}! Votre demande de vérification d'identité a été approuvée.`
    };
  },

  kycRejected: (data: { userName: string; reason?: string }) => {
    const content = `
      <h2>Vérification d'identité</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Nous avons examiné votre demande de vérification d'identité (KYC).</p>
      <p>Malheureusement, votre demande a été <strong style="color: #dc2626;">rejetée</strong>.</p>
      ${data.reason ? `
      <div class="info-box" style="background-color: #fef2f2; border-left-color: #dc2626;">
        <p style="margin: 0;"><strong>Raison :</strong></p>
        <p style="margin: 10px 0 0;">${data.reason}</p>
      </div>
      ` : ''}
      <p>Vous pouvez soumettre une nouvelle demande avec des documents valides.</p>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard/kyc" class="button">Nouvelle demande</a>
      </p>
    `;
    return {
      subject: 'Vérification d\'identité - Action requise',
      html: getBaseTemplate(content, 'KYC Rejeté'),
      text: `Bonjour ${data.userName}, votre demande KYC a été rejetée. ${data.reason ? `Raison: ${data.reason}` : ''}`
    };
  },

  transferReceived: (data: {
    recipientName: string;
    senderName: string;
    amount: number;
    currency: string;
    transactionId: string;
    note?: string;
  }) => {
    const content = `
      <h2>Vous avez reçu de l'argent!</h2>
      <p>Bonjour ${data.recipientName},</p>
      <p><strong>${data.senderName}</strong> vous a envoyé de l'argent via SendavaPay :</p>
      <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expéditeur</span>
          <span class="detail-value">${data.senderName}</span>
        </div>
        ${data.note ? `
        <div class="detail-row">
          <span class="detail-label">Note</span>
          <span class="detail-value">${data.note}</span>
        </div>
        ` : ''}
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' } as any)}</span>
        </div>
      </div>
      <p>Le montant a été crédité sur votre solde SendavaPay.</p>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard" class="button">Voir mon solde</a>
      </p>
    `;
    return {
      subject: `${data.senderName} vous a envoyé ${formatCurrency(data.amount, data.currency)}`,
      html: getBaseTemplate(content, 'Transfert reçu'),
      text: `${data.senderName} vous a envoyé ${formatCurrency(data.amount, data.currency)}. Transaction #${data.transactionId}`
    };
  },

  depositCompleted: (data: {
    userName: string;
    amount: number;
    currency: string;
    transactionId: string;
    phone: string;
    operator: string;
  }) => {
    const content = `
      <h2>Dépôt effectué</h2>
      <p>Bonjour ${data.userName},</p>
      <p>Votre dépôt a été crédité sur votre compte SendavaPay :</p>
      <div class="amount">${formatCurrency(data.amount, data.currency)}</div>
      <div class="info-box">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">#${data.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Téléphone</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Opérateur</span>
          <span class="detail-value">${data.operator}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Date</span>
          <span class="detail-value">${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' } as any)}</span>
        </div>
      </div>
      <p style="text-align: center;">
        <a href="https://sendavapay.com/dashboard" class="button">Voir mon solde</a>
      </p>
    `;
    return {
      subject: `Dépôt reçu: ${formatCurrency(data.amount, data.currency)}`,
      html: getBaseTemplate(content, 'Dépôt effectué'),
      text: `Votre dépôt de ${formatCurrency(data.amount, data.currency)} a été crédité sur votre compte. Transaction #${data.transactionId}`
    };
  }
};

export async function sendWelcomeEmail(to: string, fullName: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.welcome({ fullName, email: to });
  return sendEmail({ to, ...template });
}

export async function sendPaymentReceivedEmail(to: string, data: Parameters<typeof emailTemplates.paymentReceived>[0]): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.paymentReceived(data);
  return sendEmail({ to, ...template });
}

export async function sendPaymentConfirmationEmail(to: string, data: Parameters<typeof emailTemplates.paymentConfirmation>[0]): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.paymentConfirmation(data);
  return sendEmail({ to, ...template });
}

export async function sendWithdrawalEmail(to: string, data: Parameters<typeof emailTemplates.withdrawalCompleted>[0]): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.withdrawalCompleted(data);
  return sendEmail({ to, ...template });
}

export async function sendKycApprovedEmail(to: string, userName: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.kycApproved({ userName });
  return sendEmail({ to, ...template });
}

export async function sendKycRejectedEmail(to: string, userName: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.kycRejected({ userName, reason });
  return sendEmail({ to, ...template });
}

export async function sendTransferReceivedEmail(to: string, data: Parameters<typeof emailTemplates.transferReceived>[0]): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.transferReceived(data);
  return sendEmail({ to, ...template });
}

export async function sendDepositEmail(to: string, data: Parameters<typeof emailTemplates.depositCompleted>[0]): Promise<{ success: boolean; error?: string }> {
  const template = emailTemplates.depositCompleted(data);
  return sendEmail({ to, ...template });
}
