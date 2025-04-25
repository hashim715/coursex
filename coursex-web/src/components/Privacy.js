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
    bottomCard: {
        width: '100vw',
        height: '90vh',
        backgroundColor: 'black',
        display: 'flex',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '2vh 0',
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

const PrivacyPolicy = () => {

    const navigate = useNavigate();

    const pageChange = () => {
        navigate('/');
    }

    const privacyText = `Privacy Policy for CourseX

Last Updated: 09/01/2025

Welcome to CourseX! We are committed to protecting your privacy and handling your data in an open and transparent manner. All data collected using CourseX is used for the sole purpose of improving the service and creating a better way for students to connect with one another. CourseX is committed to fostering a productive community for students; your data will only be used to improve this experience.

1. Information Collection

- How we collect:
  Directly from you when you provide it to us.
  Automatically when you use the app.
  Via Assistant APIs, when you interact with our AI-powered features.

- When you use CourseX, we may collect the following types of information:
  - Personal Information: This includes your first and last name, school email address, and the courses you are taking, which you provide during the sign-up process.
  - Interaction Data: We collect data about how you interact with our app, including features used and content viewed.
  - Device Data: Information about the device you use to access our app, such as hardware model, operating system, and unique device identifiers.
  - Location Data: We may collect information about your location if you give us permission to do so.
  - Form Data: Information you provide by filling in forms in the app. This information includes posting material, registration information, and feedback.
  - Stored Information and Files: CourseX may also access metadata and other information linked to other files stored on your device. This may encompass various data types, such as photographs (though it's important to note that such photographs cannot be attributed to a specific user).
  - User Contributions: Your contributions (messages and replies) are posted and transmitted to others at your own risk. We cannot control the actions of those with whom you may choose to share your contributions.
  - Assistant API Data: In addition to the above, we also collect data through Assistant APIs when you upload or interact with documents or other content on the platform. This includes any files, notes, documents, or other materials you provide within the app.

2. Use of Information

- The information we collect is used for the following purposes:
  - To provide and improve our services.
  - To personalize your experience on the app.
  - To communicate with you about app updates, features, and promotional offers.
  - For app analytics and performance improvement.
  - Estimate our audience size and usage patterns.
  - Recognize you when you use the app.

We may also utilize your information to reach out to you regarding our own offerings and services that could be of interest to you. If you prefer not to have your information used in this manner, you can choose not to download the CourseX app or uninstall it from your device.

To reiterate, all data collected on CourseX is used for the sole purpose of improving the service and creating a better way for students to connect with one another.

3. Data Protection

We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure.

4. Sharing of Information

Currently, we do not sell or release any personal data to third parties outside of CourseX. If in the future we decide to share data with third parties, we will update this privacy policy and provide you with notice.

5. Data Retention

We will retain your information for as long as your account is active or as needed to provide you services. If you wish to cancel your account or request that we no longer use your information, please contact us at help@coursex.us.

6. Children Under the Age of 4

CourseX is designed for users aged 4 and above. We do not knowingly collect personal information from individuals under the age of 4. If we become aware that we have inadvertently collected or received personal information from a user under the age of 4 without appropriate parental consent verification, we will promptly delete that information. If you believe that we may have collected information from or about a user under the age of 4, please contact us at help@coursex.us. Your cooperation in this matter is highly appreciated.

7. Third-Party Data Collection

- When you use CourseX and its content, certain third parties may employ automatic information collection technologies to gather data related to you or your device. These third parties may include:
  - Advertisers, ad networks, and ad servers (when you interact with their specific websites or apps, such as clicking on ads or engaging with their platforms).
  - Your mobile device's manufacturer.
  - Your mobile service provider.

It's important to note that we do not directly share your information with these third parties. They may utilize tracking technologies to collect data about your usage of the CourseX app. The data they gather might be associated with your personal information, or they may collect information, including personal details, about your online activities across various websites, apps, and other online services. This information could be used to provide you with interest-based (behavioral) advertising or other personalized content.

We want to emphasize that we do not have control over the tracking technologies or their usage by these third parties. If you have inquiries regarding any advertisements or other personalized content, please reach out to the respective provider directly. Your understanding of this matter is greatly appreciated.

8. Changes to this Privacy Policy

We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated.

9. Contact Information

To ask questions or comment about this privacy policy and our privacy practices, email us at help@coursex.us.
To register a complaint or concern, please email us at help@coursex.us.`;

    return (
        <div style={styles.Screen}>
            <div style={styles.topCard}>
                <div 
                    style={styles.Text} 
                    onClick={() => pageChange()}
                >
                    Home
                </div>
            </div>
            <div style={styles.bottomCard}>
                <div style={styles.contentText}>{privacyText}</div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;