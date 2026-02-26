const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const emailService = {
    /**
     * Send an email with attachment
     * @param {Object} options
     * @param {string} options.toEmail
     * @param {string} options.toName
     * @param {string} options.subject
     * @param {string} options.htmlContent
     * @param {Array} options.attachments - [{ content: 'base64str', name: 'file.pdf' }]
     */
    sendEmail: async ({ toEmail, toName, subject, htmlContent, attachments = [] }) => {
        if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'YOUR_API_V3_KEY') {
            console.warn('BREVO_API_KEY not configured. Email not sent.');
            return;
        }

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { "name": "Proyecto Certificados", "email": "dhguilleng@gmail.com" };
        sendSmtpEmail.to = [{ "email": toEmail, "name": toName }];
        
        if (attachments && attachments.length > 0) {
            sendSmtpEmail.attachment = attachments;
        }

        try {
            const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('Email sent successfully. Returned data: ' + JSON.stringify(data));
            return data;
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't throw to avoid breaking the main transaction flow
            return null;
        }
    }
};

module.exports = emailService;
