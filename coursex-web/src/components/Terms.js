import { useNavigate } from "react-router-dom";

const styles = {
    Screen: {
        backgroundColor: "black",
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    topCard: {
        width: '95vw',
        height: '10vh',
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 3vw',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    },
    Text: {
        color: 'white',
        fontSize: '1.5rem',
        fontFamily: 'Red Hat Display, sans-serif',
        fontWeight: 700,
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        transition: 'background-color 0.3s ease',
    },
    TextHover: {
        backgroundColor: '#333',
    },
    bottomCard: {
        width: '100vw',
        height: '90vh',
        backgroundColor: 'black',
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '2vh 0',
    },
    textContainer: {
        width: '90vw',
        maxWidth: '800px',
        backgroundColor: 'black',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontFamily: 'Red Hat Display, sans-serif',
    },
    contentText: {
        color: 'white',
        width: "90vw",
        fontSize: '1rem',
        lineHeight: '1.6',
        textAlign: 'left',
        whiteSpace: 'pre-wrap', // Maintains line breaks
    },
};

const TermsAndConditions = () => {

    const navigate = useNavigate();

    const pageChange = () => {
        navigate('/');
    }

    const termsText = `Terms and Conditions for CourseX

Last Updated: 09/01/2025

Welcome to CourseX! These Terms and Conditions (“Terms”) govern your use of the CourseX app and any related services provided by CourseX ("we," "us," or "our"). By downloading, accessing, or using CourseX (the “App”), you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the App.

1. Eligibility

- By using the App, you represent and warrant that:
  - You are at least 4 years old.
  - You have the legal capacity to enter into a binding agreement.
  - If you are under 18, you have obtained parental or guardian consent to use the App.
  - If you are under 4 years old, you are not permitted to use the App. We do not knowingly collect personal data from users under the age of 4, and if we become aware of such, we will delete that information.

2. Account Registration

To use the App, you must create an account. When registering, you agree to provide accurate, current, and complete information as requested. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.

3. Use of the App

- You agree to use the App only for lawful purposes and in accordance with these Terms. You may not:
  - Use the App in any way that violates any applicable local, state, national, or international law or regulation.
  - Engage in any conduct that restricts or inhibits anyone else’s use or enjoyment of the App.
  - Upload, post, or transmit any content that is illegal, harmful, offensive, discriminatory, or otherwise inappropriate.
  - Impersonate any person or entity or misrepresent your identity or affiliation with any person or entity.

CourseX reserves the right to suspend or terminate your access to the App if you violate these Terms.

4. User Content

You retain ownership of any content you upload, post, or share via the App, including documents, photos, or messages ("User Content"). By uploading or posting User Content, you grant CourseX a non-exclusive, royalty-free, worldwide license to use, modify, display, and distribute such content for the purpose of providing and improving the App. You are solely responsible for the content you upload, and you must ensure that it does not infringe on any third-party rights.

CourseX reserves the right to remove any User Content that it deems, in its sole discretion, to be in violation of these Terms or inappropriate for the App.

5. Privacy Policy

Your use of the App is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data.

6. Prohibited Activities

- You agree not to engage in any of the following prohibited activities:
  - Interfering with or disrupting the App’s operation or servers.
  - Attempting to gain unauthorized access to the App or other accounts.
  - Using the App to transmit harmful content, such as malware or viruses.
  - Collecting or harvesting data from other users without their consent.
  - Engaging in any activity that could damage, disable, or impair the App’s functionality or reputation.

7. Data Collection and Use

By using CourseX, you agree that we may collect and process data as outlined in our Privacy Policy. This includes information about your usage of the App, your device, and any content you upload. You acknowledge that this data is used to improve the App and provide a better experience.

8. Termination

We may suspend or terminate your access to the App at any time, with or without cause, including if we believe that you have violated these Terms. Upon termination, all rights granted to you under these Terms will immediately cease, and you must stop using the App.

9. Disclaimers and Limitation of Liability

- No Warranty: The App is provided “as is” and “as available” without any warranties, express or implied. We do not guarantee that the App will meet your requirements or be uninterrupted, error-free, or secure.
- Limitation of Liability: To the fullest extent permitted by law, CourseX will not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, even if we have been advised of the possibility of such damages. Our liability to you for any claim will be limited to the amount you paid for the App in the six months preceding the claim.

10. Indemnification

You agree to indemnify, defend, and hold CourseX harmless from any claims, losses, damages, or liabilities (including legal fees) arising out of or in connection with your use of the App or your violation of these Terms.

11. Changes to the Terms

We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on this page. If we make material changes, we will notify you through the App or via email. It is your responsibility to review these Terms periodically for any updates.

12. Governing Law and Dispute Resolution

These Terms will be governed by and construed in accordance with the laws of the City of Houston. Any disputes arising out of or in connection with these Terms will be resolved through binding arbitration in Houston, except where prohibited by law.

13. Contact Information

If you have any questions about these Terms or the App, please contact us at help@coursex.us.

By using the CourseX app, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.`;

    return (
        <div style={styles.Screen}>
            <div style={styles.topCard}>
                <div style={styles.Text} onClick={() => pageChange()}>Home</div>
            </div>
            <div style={styles.bottomCard}>
                <div style={styles.textContainer}>
                    <div style={styles.contentText}>{termsText}</div>
                </div>
            </div>
        </div>
    )
}

export default TermsAndConditions;
