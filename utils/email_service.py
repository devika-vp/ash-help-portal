import os
import smtplib
import urllib.parse
import urllib.request
from email.message import EmailMessage


def send_help_notification(record: dict) -> None:
    recipient = os.getenv('NOTIFICATION_EMAIL', 'devarshpreman@gmail.com')
    smtp_host = (os.getenv('SMTP_HOST') or '').strip()
    smtp_user = (os.getenv('SMTP_USERNAME') or '').strip()
    smtp_pass = (os.getenv('SMTP_PASSWORD') or '').strip()
    
    if smtp_host and smtp_user and smtp_pass:
        try:
            _send_smtp(record, recipient, smtp_host, smtp_user, smtp_pass)
            print(f"[Email Service] Direct SMTP email sent successfully to {recipient}")
            return
        except Exception as e:
            print(f"[Email Service] Direct SMTP delivery failed: {e}. Falling back to FormSubmit gateway...")
            
    _send_formsubmit(record, recipient)
    print(f"[Email Service] FormSubmit notification dispatched to {recipient}")


def _message(record: dict, recipient: str) -> EmailMessage:
    message = EmailMessage()
    message['Subject'] = "🦸 Someone Needs Your Help!"
    message['From'] = os.getenv('SMTP_FROM') or recipient
    message['To'] = recipient

    plain_content = (
        "Dear Superhero,\n\n"
        "A visitor has requested your help through your superhero website. Here are the details:\n\n"
        "📋 Visitor Details\n"
        f"Name: {record['name']}\n"
        f"Age: {record['age']}\n"
        f"Location: {record['location']}\n"
        f"Email address: {record['email']}\n"
        f"Submitted At: {record['submitted_at']}\n\n"
        "💬 Grievance / Request\n"
        f"{record['request']}\n"
    )
    message.set_content(plain_content)

    html_content = f"""
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #6b21a8; margin-top: 0; font-size: 22px;">🦸 Someone Needs Your Help!</h2>
      <p style="color: #666666; font-size: 13px; margin-top: -8px; margin-bottom: 24px;">Automatic notification from your superhero website</p>

      <p style="font-size: 16px; color: #333333; margin-bottom: 8px;">Dear Superhero,</p>
      <p style="font-size: 15px; color: #444444; line-height: 1.5; margin-bottom: 20px;">A visitor has requested your help through your superhero website. Here are the details:</p>

      <div style="background-color: #f8f5ff; padding: 18px; border-left: 4px solid #8b5cf6; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #581c87; font-size: 16px; margin-bottom: 12px;">📋 Visitor Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #666666; width: 120px;"><strong>Name</strong></td><td style="padding: 6px 0; color: #111111; font-weight: 600;">{record['name']}</td></tr>
          <tr><td style="padding: 6px 0; color: #666666;"><strong>Age</strong></td><td style="padding: 6px 0; color: #111111;">{record['age']}</td></tr>
          <tr><td style="padding: 6px 0; color: #666666;"><strong>Location</strong></td><td style="padding: 6px 0; color: #111111;">{record['location']}</td></tr>
          <tr><td style="padding: 6px 0; color: #666666;"><strong>Email address</strong></td><td style="padding: 6px 0; color: #111111;"><a href="mailto:{record['email']}" style="color: #7c3aed; text-decoration: none;">{record['email']}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #666666;"><strong>Submitted At</strong></td><td style="padding: 6px 0; color: #111111;">{record['submitted_at']}</td></tr>
        </table>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e9d5ff; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin-top: 0; color: #581c87; font-size: 16px; margin-bottom: 10px;">💬 Grievance / Request</h3>
        <p style="font-size: 15px; color: #222222; line-height: 1.6; margin: 0; white-space: pre-line;">{record['request']}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0 16px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center; margin: 0;">ASH Superhero Portal — Automated Response System</p>
    </div>
    """
    message.add_alternative(html_content, subtype='html')
    return message


def _send_smtp(record: dict, recipient: str, host: str, user: str, password: str) -> None:
    message = _message(record, recipient)
    port = int(os.getenv('SMTP_PORT', '587'))
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(message)


def _send_formsubmit(record: dict, recipient: str) -> None:
    payload = {
        '_subject': f"🦸 Someone Needs Your Help! — {record['name']}",
        '_replyto': record['email'],
        '_captcha': 'false',
        '_template': 'table',
        'Visitor Name': record['name'],
        'Age Group': record['age'],
        'Location': record['location'],
        'Visitor Email': record['email'],
        'Submission Time': record['submitted_at'],
        'Grievance Request': record['request'],
    }
    data = urllib.parse.urlencode(payload).encode()
    request = urllib.request.Request(f'https://formsubmit.co/{recipient}', data=data, method='POST')
    request.add_header('Content-Type', 'application/x-www-form-urlencoded')
    request.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    try:
        with urllib.request.urlopen(request, timeout=15):
            pass
    except Exception as e:
        # Fallback to secondary gateway if primary fails
        fallback_req = urllib.request.Request(f'https://formsubmit.co/ajax/{recipient}', data=data, method='POST')
        fallback_req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        fallback_req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        with urllib.request.urlopen(fallback_req, timeout=15):
            pass

