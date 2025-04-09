# Data Anonymization for AI Services

## Overview

This document describes the data anonymization approach used when interacting with external AI services in LoyaltyStudio.ai. The system ensures that sensitive business data is properly anonymized before being sent to AI models, while still maintaining the quality of AI-generated outputs.

## Implementation

### Data Anonymization Service

The `DataAnonymizerService` provides methods to:

1. Anonymize merchant data before sending it to AI services
2. De-anonymize AI responses to restore original merchant data
3. Maintain context and relevance while protecting sensitive information

### Anonymization Process

When generating AI-powered loyalty programs:

1. The merchant data is retrieved from the database
2. Sensitive fields are anonymized:
   - Business name
   - Email addresses
   - Website URLs
   - Phone numbers
   - Physical addresses
3. Non-sensitive but contextually important fields are preserved:
   - Industry
   - Business type
   - Country
   - Currency
   - Timezone
4. The anonymized data is used to build the prompt for the AI model
5. The AI response is processed to replace anonymized values with original values
6. The final loyalty program is returned to the client

### Security Considerations

- No sensitive data is logged during the anonymization process
- The anonymization is deterministic within a single request but varies between requests
- The original data never leaves our servers and is not sent to external AI providers

## Benefits

- **Data Protection**: Sensitive business information is not exposed to external AI services
- **Compliance**: Helps meet data protection regulations and privacy requirements
- **Quality Preservation**: AI outputs maintain the same quality and relevance
- **Transparency**: The process is documented and can be audited

## Example

Original merchant data:
```json
{
  "name": "Acme Coffee Shop",
  "email": "contact@acmecoffee.com",
  "industry": "Food & Beverage",
  "country": "United States"
}
```

Anonymized data sent to AI:
```json
{
  "name": "A-Business-12345",
  "email": "contact-abcd1234@example.com",
  "industry": "Food & Beverage",
  "country": "United States"
}
```

The AI response containing "A-Business-12345" will be processed to replace it with "Acme Coffee Shop" before being returned to the client.

## Testing

The anonymization process is covered by unit tests to ensure:

1. Sensitive data is properly anonymized
2. Non-sensitive data is preserved
3. AI responses are correctly de-anonymized
4. The process handles edge cases gracefully
