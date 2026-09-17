import os
import re
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return False

from utils.database import init_db, save_help_request
from utils.email_service import send_help_notification

load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
BASE_DIR = Path(__file__).resolve().parent

with app.app_context():
    init_db(BASE_DIR / 'database' / 'ash.db')


@app.get('/')
def home():
    return render_template('index.html')


@app.get('/health')
def health():
    return jsonify({'ok': True, 'service': 'ash-help-portal'})


@app.post('/submit-help')
def submit_help():
    payload = request.get_json(silent=True) or {}
    required = ('name', 'age', 'location', 'email', 'request')
    missing = [field for field in required if not str(payload.get(field, '')).strip()]
    if missing:
        return jsonify({'error': f"Missing required details: {', '.join(missing)}"}), 400
    if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', str(payload['email']).strip()):
        return jsonify({'error': 'Please provide a valid email address.'}), 400

    record = {field: str(payload[field]).strip() for field in required}
    record['submitted_at'] = datetime.now(timezone.utc).strftime('%d %B %Y, %I:%M %p UTC')
    record['id'] = save_help_request(BASE_DIR / 'database' / 'ash.db', record)
    
    # Asynchronous background notification to prevent UI lag
    import threading
    def _async_notify(rec):
        try:
            send_help_notification(rec)
        except Exception as error:
            app.logger.exception('Help request saved but notification failed: %s', error)

    threading.Thread(target=_async_notify, args=(record,), daemon=True).start()
    return jsonify({'ok': True, 'request_id': record['id']})



@app.get('/success')
def success():
    return render_template('success.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=os.getenv('FLASK_DEBUG') == '1')
