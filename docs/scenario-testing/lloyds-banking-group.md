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
   - [ ] Visit Loyalty Studio platform
   - [ ] Register as a new user with Lloyds email
   - [ ] Verify email (if implemented)
   - [ ] Complete initial setup

2. **First Business Setup (Lex Auto Lease)**
   - [ ] Create first merchant "Lex Auto Lease"
   - [ ] Verify subdomain generation (e.g., lex-auto-lease.loyaltystudio.ai)
   - [ ] Configure basic business details
   - [ ] Set up branding (logo, colors)

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
   - [ ] Test logout functionality
   - [ ] Test login with registered credentials
   - [ ] Verify session management
   - [ ] Test password reset flow (if implemented)

6. **Subdomain Access**
   - [ ] Access platform via Lloyds-specific subdomain
   - [ ] Verify branded experience
   - [ ] Test subdomain-based routing
   - [ ] Verify security boundaries

### Current Implementation Status

#### Ready for Testing
- [x] User authentication (login/logout)
- [x] Merchant creation with subdomain
- [x] Basic role management
- [x] Permission system
- [x] API key management
- [x] Email verification
- [x] Password reset flow
- [x] User invitation system
- [x] Team member management UI
- [x] Merchant branding customization UI

#### Pending Implementation
- [ ] Cross-business permission management
- [ ] Enhanced device management
- [ ] Advanced IP tracking
- [ ] Advanced multi-device support

### Known Limitations
1. Email verification not implemented yet
2. Password reset flow not available
3. UI components for merchant management pending
4. Team invitation system pending

### Test Environment Requirements
- Development environment URL: http://localhost:3001
- Test user credentials (to be created)
- Test merchant details
  - Name: Lex Auto Lease
  - Email: test@lloydsbanking.com
  - Subdomain: lex-auto-lease

### Success Criteria
1. Successfully register and login
2. Create and configure Lex Auto Lease business
3. Generate and access via subdomain
4. Manage team members and permissions
5. Maintain security boundaries between businesses
6. Complete email verification process
7. Reset password when needed
8. Invite and manage team members
9. Customize merchant branding

## Next Steps
1. Implement missing components:
   - Cross-business permission management
   - Enhanced device management
   - Advanced IP tracking
   - Advanced multi-device support
2. Create test data set
3. Set up test environment
4. Document test results

## Notes
- This scenario will be updated as development progresses
- Additional test cases will be added based on new features
- Security testing will be performed separately
