/**
 * Communication Service
 * Handles Email and SMS delivery for technician onboarding
 */

// Mock Email Service
export const sendEmail = async (to: string, subject: string, body: string) => {
    console.log(`\n📧 [EMAIL SENT] -------------------------`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: \n${body}`);
    console.log(`----------------------------------------\n`);

    // In a real app, use nodemailer or SendGrid here
    return true;
};

// Mock SMS Service
export const sendSMS = async (to: string, message: string) => {
    console.log(`\n📱 [SMS SENT] ---------------------------`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log(`----------------------------------------\n`);

    // In a real app, use Twilio or other SMS provider here
    return true;
};

// Templates
export const templates = {
    technicianWelcomeEmail: (name: string, url: string, email: string, tempPass: string) => `
        Dear ${name},
        
        Welcome to the Smart Campus Maintenance Team!
        
        Your account has been created. Please log in using the credentials below:
        
        Login URL: ${url}
        Email: ${email}
        Temporary Password: ${tempPass}
        
        IMPORTANT: You will be required to change your password upon first login.
        
        Regards,
        Admin Team
    `,
    technicianWelcomeSMS: (url: string, tempPass: string) =>
        `SmartCampus: Welcome! Login at ${url} using pass: ${tempPass}`
};
