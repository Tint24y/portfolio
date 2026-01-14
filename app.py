from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///portfolio.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com')

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)

# Database Models
class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }

# Validation functions
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_form_data(data):
    """Validate all form fields"""
    errors = {}
    
    # Name validation
    if not data.get('name') or len(data['name'].strip()) < 2:
        errors['name'] = 'Name must be at least 2 characters long'
    
    # Email validation
    email = data.get('email', '')
    if not email:
        errors['email'] = 'Email is required'
    elif not validate_email(email):
        errors['email'] = 'Please enter a valid email address'
    
    # Subject validation
    if not data.get('subject') or len(data['subject'].strip()) < 3:
        errors['subject'] = 'Subject must be at least 3 characters long'
    
    # Message validation
    if not data.get('message') or len(data['message'].strip()) < 10:
        errors['message'] = 'Message must be at least 10 characters long'
    
    return errors

# Routes
@app.route('/')
def index():
    return jsonify({
        'message': 'Portfolio Backend API',
        'version': '1.0.0',
        'endpoints': {
            '/api/contact': 'POST - Submit contact form',
            '/api/messages': 'GET - Get all messages (admin)',
            '/api/messages/<id>': 'GET, PUT, DELETE - Manage specific message',
            '/health': 'GET - Health check'
        }
    })

@app.route('/api/contact', methods=['POST'])
def contact():
    """Handle contact form submissions"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate form data
        errors = validate_form_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Create new message
        new_message = ContactMessage(
            name=data['name'].strip(),
            email=data['email'].strip(),
            subject=data['subject'].strip(),
            message=data['message'].strip()
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        # Send email notification
        send_email_notification(new_message)
        
        return jsonify({
            'success': True,
            'message': 'Your message has been sent successfully!',
            'id': new_message.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error processing contact form: {str(e)}")
        return jsonify({'error': 'An internal error occurred. Please try again later.'}), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get all messages (admin endpoint - add authentication in production)"""
    try:
        # For production, add proper authentication here
        # Example: check for admin token or session
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        messages = ContactMessage.query.order_by(ContactMessage.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'messages': [msg.to_dict() for msg in messages.items],
            'total': messages.total,
            'pages': messages.pages,
            'current_page': messages.page
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching messages: {str(e)}")
        return jsonify({'error': 'Failed to fetch messages'}), 500

@app.route('/api/messages/<int:message_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_message(message_id):
    """Manage individual messages"""
    message = ContactMessage.query.get_or_404(message_id)
    
    if request.method == 'GET':
        return jsonify(message.to_dict())
    
    elif request.method == 'PUT':
        # Mark as read/unread
        data = request.get_json()
        if 'is_read' in data:
            message.is_read = data['is_read']
            db.session.commit()
        return jsonify(message.to_dict())
    
    elif request.method == 'DELETE':
        db.session.delete(message)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Message deleted'})

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

def send_email_notification(message):
    """Send email notification about new contact message"""
    try:
        # Check if email is configured
        if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
            app.logger.warning("Email not configured. Skipping email notification.")
            return
        
        # Send to admin
        msg = Message(
            subject=f"New Portfolio Contact: {message.subject}",
            recipients=[os.getenv('ADMIN_EMAIL', app.config['MAIL_USERNAME'])],
            html=render_template('email_template.html', message=message)
        )
        mail.send(msg)
        
        # Send confirmation to user
        user_msg = Message(
            subject=f"Thank you for contacting me!",
            recipients=[message.email],
            html=f"""
            <h2>Thank you for reaching out!</h2>
            <p>Hi {message.name},</p>
            <p>I've received your message and will get back to you as soon as possible.</p>
            <p><strong>Your Message:</strong></p>
            <p>{message.message}</p>
            <br>
            <p>Best regards,</p>
            <p>John Doe</p>
            """
        )
        mail.send(user_msg)
        
        app.logger.info(f"Email notifications sent for message {message.id}")
        
    except Exception as e:
        app.logger.error(f"Failed to send email: {str(e)}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Server Error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # For development
    app.run(debug=True, host='0.0.0.0', port=5000)