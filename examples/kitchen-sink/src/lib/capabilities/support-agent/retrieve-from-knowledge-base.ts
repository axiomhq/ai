import { flag } from '@/lib/app-scope';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { wrapAISDKModel } from 'axiom/ai';

// TOMORROW: MAKE THIS A TOOL

const veryBadKnowledgeBase = [
  {
    id: 'kb_reset_pw',
    title: 'Resetting your password',
    body: 'To reset your password, go to Settings > Security > Reset Password and follow the email link...',
  },
  {
    id: 'kb_cancel',
    title: 'Cancel your subscription',
    body: 'You can cancel any time from Settings > Billing > Cancel subscription. Your current period remains active until the end date...',
  },
  {
    id: 'kb_invoice',
    title: 'Download past invoices',
    body: 'To download past invoices, navigate to Settings > Billing > Invoices and click the download icon next to the invoice...',
  },
  {
    id: 'kb_2fa',
    title: 'Setting up Two-Factor Authentication (2FA)',
    body: 'Secure your account by enabling 2FA in Settings > Security > Two-Factor Authentication. We support Google Authenticator and Authy.',
  },
  {
    id: 'kb_api_keys',
    title: 'Managing API Keys',
    body: 'Generate and revoke API keys in the Developer Dashboard. Never share your secret keys.',
  },
  {
    id: 'kb_sso',
    title: 'Single Sign-On (SSO) Configuration',
    body: 'Enterprise plans support SSO with Okta, Azure AD, and Google Workspace. Configure this in Organization Settings.',
  },
  {
    id: 'kb_user_roles',
    title: 'User Roles and Permissions',
    body: 'Assign roles like Admin, Editor, and Viewer to team members to control access to resources.',
  },
  {
    id: 'kb_delete_account',
    title: 'Delete your account',
    body: 'To permanently delete your account and all data, go to Settings > General > Delete Account. This action is irreversible.',
  },
  {
    id: 'kb_change_email',
    title: 'Change your email address',
    body: 'Update your primary email address in Profile Settings. You will need to verify the new email.',
  },
  {
    id: 'kb_billing_address',
    title: 'Update billing address',
    body: 'Ensure your invoices have the correct details by updating your billing address in the Billing section.',
  },
  {
    id: 'kb_payment_methods',
    title: 'Manage payment methods',
    body: 'Add or remove credit cards and bank accounts in Settings > Billing > Payment Methods.',
  },
  {
    id: 'kb_refund_policy',
    title: 'Refund Policy',
    body: 'We offer a 30-day money-back guarantee for new subscriptions. Contact support for refund requests.',
  },
  {
    id: 'kb_usage_limits',
    title: 'Plan Usage Limits',
    body: 'Check your current usage against your plan limits in the Dashboard overview. Overage fees may apply.',
  },
  {
    id: 'kb_outages',
    title: 'Checking System Status',
    body: 'Visit status.pets.ai to check for ongoing outages or scheduled maintenance.',
  },
  {
    id: 'kb_mobile_app',
    title: 'Mobile App Availability',
    body: 'Our mobile app is available for iOS and Android. Download it from the App Store or Google Play.',
  },
  {
    id: 'kb_desktop_app',
    title: 'Desktop App for Mac and Windows',
    body: 'Download our desktop application for a dedicated workspace experience on your computer.',
  },
  {
    id: 'kb_browser_support',
    title: 'Supported Browsers',
    body: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.',
  },
  {
    id: 'kb_integrations_slack',
    title: 'Slack Integration',
    body: 'Connect your workspace to Slack to receive notifications and updates directly in your channels.',
  },
  {
    id: 'kb_integrations_github',
    title: 'GitHub Integration',
    body: 'Link your repositories to track commits and pull requests related to your projects.',
  },
  {
    id: 'kb_integrations_jira',
    title: 'Jira Integration',
    body: 'Sync issues and tickets between our platform and Jira for better project management.',
  },
  {
    id: 'kb_export_data',
    title: 'Exporting your data',
    body: 'You can export your projects and tasks as CSV or JSON files from the Data Settings menu.',
  },
  {
    id: 'kb_import_data',
    title: 'Importing data from other tools',
    body: 'Use our migration wizard to import data from Trello, Asana, or Monday.com.',
  },
  {
    id: 'kb_audit_logs',
    title: 'Viewing Audit Logs',
    body: 'Admins can view a detailed history of account activity in the Security > Audit Logs section.',
  },
  {
    id: 'kb_notifications',
    title: 'Configuring Notifications',
    body: 'Customize your email and push notification preferences in the Notification Settings tab.',
  },
  {
    id: 'kb_theme_settings',
    title: 'Dark Mode and Themes',
    body: 'Switch between Light, Dark, and System themes in the Appearance settings.',
  },
  {
    id: 'kb_language_settings',
    title: 'Changing Interface Language',
    body: 'We support English, Spanish, French, German, and Japanese. Change your language in Profile Settings.',
  },
  {
    id: 'kb_timezones',
    title: 'Setting your Timezone',
    body: 'Ensure dates and times are displayed correctly by setting your local timezone in Profile Settings.',
  },
  {
    id: 'kb_feature_request',
    title: 'Submitting Feature Requests',
    body: 'Have an idea? Submit and vote on feature requests in our Community Forum.',
  },
  {
    id: 'kb_contact_sales',
    title: 'Contacting Sales',
    body: 'For enterprise inquiries and custom pricing, please contact our sales team via the form on our website.',
  },
  {
    id: 'kb_career',
    title: 'Careers at Pets.ai',
    body: 'Join our team! View open positions and apply on our Careers page.',
  },
  {
    id: 'kb_tos',
    title: 'Terms of Service',
    body: 'Read our Terms of Service to understand your rights and responsibilities when using our platform.',
  },
  {
    id: 'kb_privacy',
    title: 'Privacy Policy',
    body: 'We take your privacy seriously. Read our Privacy Policy to learn how we handle your data.',
  },
  {
    id: 'kb_security_whitepaper',
    title: 'Security Whitepaper',
    body: 'Download our Security Whitepaper to learn about our encryption, compliance, and security practices.',
  },
];

export const veryBadRAG = async (topic: string) => {
  const modelName = flag('supportAgent.retrieveFromKnowledgeBase.model');
  const maxDocuments = flag('supportAgent.retrieveFromKnowledgeBase.maxDocuments');

  const model = wrapAISDKModel(openai(modelName));

  const res = await generateText({
    model: model,
    messages: [
      {
        role: 'system',
        content: `You are a retrieval system for Pets.ai.
Your goal is to help find documents that are relevant for the user's query.
Please retrieve exactly ${maxDocuments} document(s).
If there are no valid documents, you may return the string "NONE"
If there are one or more relevant documents, return their ids separated by commas
(example: "kb_cancel, kb-invoice")
`,
      },
      {
        role: 'system',
        content: `Your knowledge base is:
${veryBadKnowledgeBase.map((item) => `- id: ${item.id} - ${item.title}`).join('\n')}`,
      },
      { role: 'user', content: `I would like to know about: ${topic}` },
    ],
  });

  if (res.text === 'NONE') {
    return { status: 'success', documents: [] };
  }

  const elements = res.text.split(',').map((i) => i.trim().toLowerCase());

  let status = 'success';
  const documents = [];
  for (const element of elements) {
    const doc = veryBadKnowledgeBase.find((item) => item.id === element);
    if (doc) {
      documents.push(doc);
    } else {
      status = 'error_suggested_nonexistent_document';
    }
  }

  if (documents.length === 0) {
    return { status: 'success', documents: [] };
  }

  return { status, documents };
};
