# Loyalty Studio Demo Process Guide

This guide provides a comprehensive walkthrough of the Loyalty Studio platform demo process, from landing page to account setup and platform exploration.

## Part 1: Landing Page and Demo Request

### 1. Access the Landing Page
- Open your browser and go to http://localhost:3001
- You should see the Loyalty Studio landing page with information about the platform
- The landing page includes a prominent "Book a Demo" button

![Landing Page](https://via.placeholder.com/800x400?text=Loyalty+Studio+Landing+Page)

### 2. Request a Demo
- Click on the "Book a Demo" button on the landing page
- This will take you to the demo request page at http://localhost:3001/request-demo
- You'll see two options for requesting a demo:

#### Option 1: Fill Out Form
- Fill out the form with the following information:
  - Full Name: [Your Name]
  - Email: [Your Email]
  - Company Name: [Your Company]
  - Company Size: Select an appropriate option
  - Industry: Select an appropriate option
  - Phone Number (Optional): [Your Phone]
  - Job Title (Optional): [Your Job Title]
  - Message (Optional): [Your Message]
- Click the "Request Demo" button to submit your request

#### Option 2: Schedule Directly
- Click on the "Schedule Directly" tab
- You'll see a Cal.com scheduling widget embedded directly in the page
- Select a date and time that works for you
- Fill in your contact information
- Click "Confirm" to schedule your demo call
- You'll receive a calendar invitation and confirmation email automatically

![Demo Request Form](https://via.placeholder.com/800x400?text=Demo+Request+Form)

### 3. Demo Request Confirmation
- After submitting the form, you'll see a confirmation page
- The page will inform you that your request has been submitted successfully
- It will also mention that you'll receive an email with a link to schedule a demo call
- In a production environment, you would receive an actual email with a Cal.com booking link

![Demo Request Confirmation](https://via.placeholder.com/800x400?text=Demo+Request+Confirmation)

## Part 2: Admin Approval Process

### 4. Admin Review (Admin Portal)
- In a real scenario, an admin would review your demo request in the admin portal
- The admin would access http://localhost:3003/admin/demo-requests
- They would see your demo request in the list
- They can view the details of your request by clicking the "View" button
- After reviewing, they can click "Process" to approve or reject the request

![Admin Review](https://via.placeholder.com/800x400?text=Admin+Review+Portal)

### 5. Demo Request Approval
- The admin would select "Approve" in the process dialog
- This would update your user status to "Approved"
- In a production environment, you would receive an approval email with a password reset link
- For our demo, we'll simulate this process

![Demo Request Approval](https://via.placeholder.com/800x400?text=Demo+Request+Approval)

## Part 3: Account Setup and Login

### 6. Simulate Account Approval
- For demonstration purposes, we'll directly create an approved user account
- Open a terminal and run the following command to create a demo request:
  ```bash
  curl -X POST http://localhost:3002/api/demo-requests -H "Content-Type: application/json" -d '{"email":"demo@example.com","name":"Demo User","companyName":"Demo Company","companySize":"1-10","industry":"Technology"}'
  ```
- This will create a demo request and a user account in development mode

### 7. Access the Login Page
- Go to http://localhost:3001/login
- You'll see the login form

![Login Page](https://via.placeholder.com/800x400?text=Login+Page)

### 8. Login to the Platform
- In a production environment, you would set your password via the reset link
- For our demo, we need to manually set up a user in the database
- For now, you can view the platform's features without logging in by exploring the landing page

## Part 4: Exploring the Platform (Demo Mode)

### 9. View Platform Features on Landing Page
- Return to the landing page at http://localhost:3001
- Scroll down to see the different features of the platform:
  - Loyalty Program Management
  - Customer Engagement
  - Rewards and Tiers
  - Analytics and Reporting
- Each section provides information about the platform's capabilities

![Platform Features](https://via.placeholder.com/800x400?text=Platform+Features)

### 10. Learn About Integration Options
- The landing page also includes information about integration options
- This shows how businesses can integrate the loyalty platform with their existing systems
- It highlights the API-first approach of the platform

![Integration Options](https://via.placeholder.com/800x400?text=Integration+Options)

### 11. View Pricing and Plans
- Scroll to the pricing section to see the different plans available
- This gives potential customers an idea of the cost structure
- Each plan includes different features and capabilities

![Pricing and Plans](https://via.placeholder.com/800x400?text=Pricing+and+Plans)

### 12. Contact Information
- At the bottom of the landing page, you'll find contact information
- This includes links to request a demo, contact sales, or access support
- The footer also includes links to documentation, blog, and other resources

![Contact Information](https://via.placeholder.com/800x400?text=Contact+Information)

## Part 5: Next Steps (In Production)

### 13. Schedule a Demo Call
- In a production environment, you would receive an email with a Cal.com booking link
- You would click the link to schedule a demo call at a convenient time
- The Cal.com interface would show available time slots based on the team's availability

![Schedule Demo Call](https://via.placeholder.com/800x400?text=Schedule+Demo+Call)

### 14. Attend the Demo Call
- At the scheduled time, you would join the demo call
- A team member would walk you through the platform's features
- They would answer any questions you have about the platform

### 15. Account Approval
- After the demo call, if you're interested in using the platform, the admin would approve your account
- You would receive an approval email with a link to set your password
- Once your password is set, you can log in to the platform

![Account Approval](https://via.placeholder.com/800x400?text=Account+Approval)

### 16. Start Using the Platform
- After logging in, you would be taken to the dashboard
- From there, you can start setting up your loyalty program
- You can create rewards, tiers, and rules for your program
- You can also manage program members and track analytics

![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

## Technical Setup (For Developers)

### Environment Configuration

1. Create a `.env.local` file in the `apps/api` directory based on `.env.example`
2. Set up the following key environment variables:
   ```
   # Database Configuration
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loyaltystudio
   DIRECT_URL=postgresql://postgres:postgres@localhost:5432/loyaltystudio

   # Supabase Configuration
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   SUPABASE_ANON_KEY=your-supabase-anon-key

   # Email Configuration (Resend)
   RESEND_API_KEY=re_your_resend_api_key
   EMAIL_FROM=noreply@yourdomain.com

   # Cal.com Configuration
   CAL_BOOKING_URL=https://cal.com/your-username/demo
   ```

### Setting Up Resend for Email

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Create an API key in the Resend dashboard
3. Add your API key to the `.env.local` file as `RESEND_API_KEY`
4. Verify your domain in Resend to ensure reliable email delivery
5. Update the `EMAIL_FROM` value to use your verified domain

#### Email Service Implementation

The email service has been implemented with the following features:

- **Production Mode**: Uses Resend for reliable email delivery
- **Development Mode**: Falls back to a mock email service that logs emails to the console
- **Graceful Degradation**: If Resend fails in development, falls back to the mock service
- **Validation**: Validates the Resend API key before initializing the service
- **Error Handling**: Provides detailed error messages for troubleshooting

The email service automatically detects whether a valid Resend API key is available and configures itself accordingly. This ensures that emails work in both development and production environments without requiring changes to the code.

#### Email Templates

The platform uses the following email templates:

1. **Demo Request Confirmation Email**
   - Sent to users after they submit a demo request
   - Includes a link to schedule a demo call via Cal.com
   - Provides information about the next steps

2. **Admin Notification Email**
   - Sent to administrators when a new demo request is submitted
   - Includes details about the requester and their company
   - Contains a link to the admin portal to review the request

3. **Approval Email**
   - Sent to users when their demo request is approved
   - Includes a password reset link to set up their account
   - Provides information about getting started with the platform

4. **Rejection Email**
   - Sent to users when their demo request is rejected
   - Includes the reason for rejection if provided
   - Offers alternative options or contact information for questions

### Setting Up Cal.com for Demo Scheduling

1. Sign up for a Cal.com account at [cal.com](https://cal.com)
2. Create a new event type for demo calls
3. Configure your availability and meeting duration
4. Copy your booking link and add it to the `.env.local` file as `CAL_BOOKING_URL`

#### Cal.com Integration

The Cal.com integration has been implemented with the following features:

- **Direct Embedding**: Cal.com scheduling widget is embedded directly in the demo request page
- **Email Integration**: Cal.com booking links are also included in demo request confirmation emails
- **Tabbed Interface**: Users can choose between filling out a form or scheduling directly
- **URL Parameter Support**: The page supports `?tab=calendar` parameter to directly open the calendar tab
- **Automatic URL Validation**: The system validates the Cal.com booking URL before using it
- **Fallback Mechanism**: If no custom URL is provided, it uses the default URL from the environment configuration
- **Customizable**: The booking URL can be easily changed in the environment configuration without code changes

The integration ensures that users can easily schedule demo calls through Cal.com, providing a seamless experience for both users and administrators. The direct embedding approach eliminates the need for users to navigate to a separate website, reducing friction in the booking process.

### Running the API Server
```bash
cd apps/api
PORT=3002 npm run dev
```

### Running the Merchant Web App
```bash
cd apps/merchant-web
npm run dev
```

### Running the Admin Portal
```bash
cd apps/admin
npm run dev
```

## Troubleshooting

### Landing Page Redirects to Login
If the landing page redirects to the login page, check the following:
1. Clear your browser's local storage
2. Make sure the middleware is configured correctly
3. Ensure the landing page component doesn't have a redirect for unauthenticated users

### API Connection Issues
If you're having trouble connecting to the API:
1. Make sure the API server is running on port 3002
2. Check that CORS is properly configured
3. Verify that the API endpoints are correctly defined

### Demo Request Submission Fails
If you can't submit a demo request:
1. Check the browser console for errors
2. Ensure the API server is running
3. Verify that the demo request endpoint is accessible
4. Make sure all required fields are filled out

## Support

For additional support or questions about the demo process, please contact:
- Email: support@loyaltystudio.ai
- Phone: +1-555-123-4567
