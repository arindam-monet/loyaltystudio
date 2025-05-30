# Lloyds Banking Group - Scenario Testing

## Scenario Overview
As a business owner from Lloyds Banking Group, I want to use Loyalty Studio to manage multiple businesses under the Lloyds umbrella.

### User Story
```
As a Business Owner from Lloyds Banking Group,
I want to register and manage multiple businesses in Loyalty Studio
So that I can manage loyalty programs for different business units
```

### Test Scenario Steps

1. **Initial Registration**
   - [x] Visit Loyalty Studio platform
   - [x] Register as a new user with Lloyds email
   - [ ] Verify email (if implemented)
   - [x] Complete initial setup

2. **First Business Setup (Lex Auto Lease)**
   - [x] Create first merchant "Lex Auto Lease"
   - [x] Verify subdomain generation (e.g., lex-auto-lease.loyaltystudio.ai)
   - [x] Configure basic business details
   - [x] Set up branding (logo, colors)

3. **User Management**
   - [ ] Invite team members
   - [ ] Assign roles and permissions
   - [ ] Verify user access restrictions
   - [ ] Test role-based access control

4. **Multi-Business Management**
   - [ ] Create additional businesses
   - [ ] Verify separate access controls
   - [ ] Test user isolation between businesses
   - [ ] Manage cross-business permissions

5. **Authentication Flow**
   - [x] Test logout functionality
   - [x] Test login with registered credentials
   - [x] Verify session management
   - [ ] Test password reset flow

6. **Subdomain Access**
   - [x] Access platform via Lloyds-specific subdomain
   - [x] Verify branded experience
   - [x] Test subdomain-based routing
   - [x] Verify security boundaries

### Current Implementation Status

#### Ready for Testing
- [x] User authentication (login/logout)
- [x] Merchant creation with subdomain
- [x] Basic merchant details
- [x] Branding customization (logo, colors)
- [x] Subdomain generation and validation
- [x] API endpoints for merchant management
- [x] Session management
- [x] Basic security boundaries

#### In Progress
- [ ] Team member management
- [ ] Role-based access control
- [ ] Multi-business management
- [ ] Email verification system

#### Pending Implementation
- [ ] Password reset flow
- [ ] Cross-business permission management
- [ ] Enhanced device management
- [ ] Advanced IP tracking
- [ ] Advanced multi-device support

### Known Limitations
1. Email verification not implemented yet
2. Password reset flow not available
3. Team invitation system pending
4. Multi-business management pending

### Test Environment Requirements
- Development environment URL: http://localhost:3001
- Test user credentials (to be created)
- Test merchant details
  - Name: Lex Auto Lease
  - Email: test@lloydsbanking.com
  - Subdomain: lex-auto-lease

### Success Criteria
1. [x] Successfully register and login
2. [x] Create and configure Lex Auto Lease business
3. [x] Generate and access via subdomain
4. [ ] Manage team members and permissions
5. [x] Maintain security boundaries between businesses
6. [ ] Complete email verification process
7. [ ] Reset password when needed
8. [ ] Invite and manage team members
9. [x] Customize merchant branding

## Next Steps
1. Implement team management functionality:
   - User invitation system
   - Role-based access control
   - Permission management
2. Add email verification system
3. Implement password reset flow
4. Add multi-business management features
5. Enhance security features:
   - Device management
   - IP tracking
   - Multi-device support

## Notes
- Basic merchant creation and branding flow is complete
- Focus should be on team management and security features next
- Need to implement proper file upload for logo management
