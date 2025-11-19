# New Features Documentation

## Overview
This document describes the newly implemented features for email verification, password recovery, and server-side PDF generation.

## 1. Email Verification for Registration

### How it works:
1. User registers with email and password
2. System generates a unique verification token
3. Verification email is sent to the user's email address
4. User clicks the link in the email to verify their account
5. User can now login with verified credentials

### API Endpoints:

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "message": "Регистрация успешна. Проверьте вашу почту для подтверждения email.",
  "userId": 1
}
```

#### Verify Email
```
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}

Response:
{
  "message": "Email успешно подтвержден. Теперь вы можете войти."
}
```

### Login with Verification Check
Users with unverified emails will receive an error when attempting to login:
```
POST /auth/login

Response (unverified):
{
  "error": "Email не подтвержден. Проверьте вашу почту.",
  "needsVerification": true
}
```

## 2. Password Recovery

### How it works:
1. User requests password reset
2. System generates a reset token (valid for 1 hour)
3. Reset link is sent to user's email
4. User clicks link and enters new password
5. Password is updated and user can login with new credentials

### API Endpoints:

#### Request Password Reset
```
POST /auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "message": "Если пользователь с таким email существует, письмо для восстановления пароля было отправлено."
}
```

#### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}

Response:
{
  "message": "Пароль успешно изменен. Теперь вы можете войти с новым паролем."
}
```

## 3. Server-Side PDF Generation

### How it works:
PDF generation has been moved from client-side to server-side for better performance and security. The server generates professional-looking PDFs with quote details.

### API Endpoints:

#### Generate PDF for Quote
```
GET /quotes/:id/pdf
Authorization: Bearer <jwt-token>

Optional query parameter:
?detailed=true  (for detailed PDF with category grouping)

Response:
PDF file download with Content-Type: application/pdf
```

### PDF Formats:

#### Simple PDF
- Header with quote name and date
- Table with all items (category, room, job, quantity, price, total)
- Total sum
- Generation timestamp

#### Detailed PDF (detailed=true)
- Header with quote name and date
- Items grouped by category
- Material and labor price breakdown (if available)
- Category subtotals
- Total sum
- Generation timestamp

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vargos_db
JWT_SECRET=your-secret-key-change-in-production
PORT=4000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@vargos.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

### Email Configuration Notes:

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASSWORD`

**For other providers:**
- Use appropriate SMTP settings for your email provider
- Ensure SMTP is enabled and accessible

## Database Changes

New fields added to the `User` model:
- `isVerified` (Boolean): Indicates if email is verified
- `verificationToken` (String, unique): Token for email verification
- `resetToken` (String, unique): Token for password reset
- `resetTokenExpiry` (DateTime): Expiration time for reset token

Run migrations to apply database changes:
```bash
npx prisma migrate deploy
```

## Rate Limiting

To prevent abuse and brute force attacks, the API implements rate limiting on all endpoints:

### Rate Limits:
- **General API**: 100 requests per 15 minutes per IP
- **Authentication (login/register)**: 5 requests per 15 minutes per IP
- **Password Reset Request**: 3 requests per hour per IP
- **PDF Generation**: 20 requests per 15 minutes per IP

### Error Responses:
When rate limit is exceeded, the API returns HTTP 429 (Too Many Requests):
```json
{
  "message": "Слишком много запросов с этого IP, попробуйте позже"
}
```

The response includes standard rate limiting headers:
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining
- `RateLimit-Reset`: Time when the rate limit window resets (Unix timestamp)

## Security Considerations

1. **Email Verification**: Users must verify their email before they can login
2. **Password Reset Tokens**: Valid for 1 hour only
3. **Token Security**: All tokens are UUIDs and stored securely
4. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)
5. **JWT Authentication**: All protected endpoints require valid JWT token
6. **Non-disclosure**: Password reset endpoint doesn't reveal if email exists
7. **Rate Limiting**: Protection against brute force and abuse attacks
8. **Secure Dependencies**: All packages updated to latest secure versions (nodemailer@7.0.7)

## Testing

### Test Email Verification:
1. Register a new user
2. Check console logs for verification link (if email sending fails)
3. Use the token from logs or email to verify
4. Attempt to login - should succeed

### Test Password Recovery:
1. Request password reset for existing user
2. Check console logs for reset link (if email sending fails)
3. Use the token to reset password
4. Login with new password - should succeed

### Test PDF Generation:
1. Create or load a quote with items
2. Call the PDF endpoint
3. Verify PDF downloads correctly
4. Check PDF content for accuracy

## Frontend Integration

Frontend needs to implement:

1. **Registration Page**: After successful registration, show message to check email
2. **Email Verification Page**: Route `/verify-email?token=xxx` that calls the verification endpoint
3. **Password Reset Request Page**: Form to enter email and request reset
4. **Password Reset Page**: Route `/reset-password?token=xxx` with form for new password
5. **PDF Download**: Button/link to download PDF from `/quotes/:id/pdf`

Example frontend code:
```javascript
// Download PDF
const downloadPDF = async (quoteId, detailed = false) => {
  const url = `${API_URL}/quotes/${quoteId}/pdf${detailed ? '?detailed=true' : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `quote_${quoteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
```

## Troubleshooting

### Email not sending:
- Check `EMAIL_*` environment variables
- Verify SMTP credentials
- Check firewall/network settings
- Look at server console logs for error details

### PDF not generating:
- Check if quote exists and belongs to user
- Verify JWT token is valid
- Check server console for errors

### Email verification fails:
- Token might be expired or already used
- Check database for user's `verificationToken` field
- Verify token matches exactly (no extra spaces)

### Password reset fails:
- Token might be expired (1 hour limit)
- Token might be already used
- New password might not meet minimum requirements (6 characters)
