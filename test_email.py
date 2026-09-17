import os
import smtplib
import urllib.parse
import urllib.request
from email.message import EmailMessage

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

recipient = os.getenv('NOTIFICATION_EMAIL', 'devarshpreman@gmail.com')
smtp_host = (os.getenv('SMTP_HOST') or '').strip()
smtp_user = (os.getenv('SMTP_USERNAME') or '').strip()
smtp_pass = (os.getenv('SMTP_PASSWORD') or '').strip()

print("=" * 50)
print("SUPERHERO PORTAL — EMAIL DIAGNOSTIC TEST")
print("=" * 50)
print(f"Target Recipient: {recipient}")
print(f"SMTP Host:       {smtp_host or '(Not set - using FormSubmit)'}")
print(f"SMTP User:       {smtp_user or '(Not set)'}")
print(f"SMTP Password:   {'[Configured]' if smtp_pass else '(Empty - Needs 16-char App Password)'}")
print("=" * 50)

if smtp_host and smtp_user and smtp_pass:
    print("\nAttempting Direct Gmail SMTP delivery...")
    try:
        msg = EmailMessage()
        msg['Subject'] = "🦸 Test Superhero Alert — Direct SMTP Test"
        msg['From'] = smtp_user
        msg['To'] = recipient
        msg.set_content("This is a test notification from your Superhero Website using Direct Gmail SMTP!")

        port = int(os.getenv('SMTP_PORT', '587'))
        with smtplib.SMTP(smtp_host, port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        print("SUCCESS! Direct email sent via Gmail SMTP. Check your inbox right now!")
    except smtplib.SMTPAuthenticationError:
        print("AUTHENTICATION ERROR: Your Gmail App Password is incorrect or missing.")
        print("Solution: Generate a 16-character App Password at https://myaccount.google.com/apppasswords")
    except Exception as e:
        print(f"SMTP ERROR: {e}")
else:
    print("\nAttempting FormSubmit gateway delivery...")
    payload = {
        '_subject': "Test Superhero Alert — FormSubmit Gateway Test",
        '_replyto': 'test@example.com',
        '_captcha': 'false',
        'Status': 'Test notification request',
    }
    data = urllib.parse.urlencode(payload).encode()
    req = urllib.request.Request(f'https://formsubmit.co/{recipient}', data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    req.add_header('User-Agent', 'Mozilla/5.0')
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"FormSubmit Response Status: {resp.status}")
        print("FormSubmit request dispatched successfully!")
        print("IMPORTANT: FormSubmit requires 1-time activation.")
        print(f"Please check your Gmail ({recipient}) for an email titled 'FormSubmit - Activate your form'.")
        print("Until you click 'Activate Form' in that email, FormSubmit WILL NOT send emails to your inbox!")
    except Exception as e:
        print(f"FormSubmit ERROR: {e}")
