# Security Policy

## Supported Versions

The following versions of **PteasYeung Platform** are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the **PteasYeung Room Management Platform** seriously. If you believe you have discovered a security vulnerability in this project, please report it immediately by following the procedure below:

### How to Report

1. **Do NOT disclose vulnerabilities publicly** via GitHub Issues, Discussions, or social media.
2. Email your discovery and reproduction details to the security team at **security@pteasyeung.com** (or use GitHub Private Vulnerability Reporting if enabled on this repository).
3. Include as much information as possible to help us reproduce and address the issue:
   - Type of vulnerability (e.g., SQL Injection, XSS, Broken Authentication, Sensitive Data Exposure, CSRF)
   - Step-by-step instructions or Proof of Concept (PoC) scripts
   - Affected URLs, endpoints, or parameters
   - Suggested mitigations (if known)

### What to Expect

- **Acknowledgment:** We will acknowledge receipt of your vulnerability report within 24–48 hours.
- **Assessment:** We will verify and assess the severity of the issue within 5 business days.
- **Resolution:** A fix will be developed, tested, and released as quickly as possible.
- **Credit:** If you wish, we will credit your responsible disclosure in our release notes.

## Security Best Practices for Deployment

- Always keep `.env` files outside public web root and never commit them to version control.
- Ensure `APP_DEBUG=false` in production environments.
- Regularly run `composer audit` and `npm audit` to identify and patch vulnerable dependencies.
- Use strong HTTPS encryption with TLS 1.2 or higher.
- Review Audit Logs frequently in the Admin Dashboard for unauthorized access attempts or suspicious activity.
