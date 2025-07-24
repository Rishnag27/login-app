from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import datetime
import os
from models import Appointment
from dotenv import load_dotenv
import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from models import db, User, Message
import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

try:
    from config import Config
    print("Config modülü başarıyla import edildi.")
except ModuleNotFoundError as e:
    print("Config modülü bulunamadı:", e)

load_dotenv()

app = Flask(__name__)
CORS(app)
from config import Config
app.config.from_object(Config)
db.init_app(app)

from flask_socketio import SocketIO, emit
socketio = SocketIO(app, cors_allowed_origins="*")

# Token kontrolü
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            bearer = request.headers['Authorization']
            token = bearer.split()[1] if len(bearer.split()) > 1 else None
        if not token:
            return jsonify({'error': 'Token gerekli!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Kullanıcı bulunamadı!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token süresi doldu!'}), 401
        except Exception:
            return jsonify({'error': 'Geçersiz token!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route("/appointments", methods=["GET"])
@token_required
def get_appointments(current_user):
    if current_user.role == "admin":
        appointments = Appointment.query.all()
    else:
        appointments = Appointment.query.filter_by(user_id=current_user.id).all()
    return jsonify([
        {
            "id": a.id,
            "user_id": a.user_id,
            "date": a.date,
            "time": a.time,
            "description": a.description,
            "username": a.user.username
        } for a in appointments
    ])

@app.route("/appointments", methods=["POST"])
@token_required
def create_appointment(current_user):
    data = request.get_json()
    appointment = Appointment(
        user_id=current_user.id,
        date=data["date"],
        time=data["time"],
        description=data.get("description", "")
    )
    db.session.add(appointment)
    db.session.commit()
    return jsonify({"message": "Randevu oluşturuldu!"})

@app.route("/appointments/<int:appointment_id>", methods=["DELETE"])
@token_required
def delete_appointment(current_user, appointment_id):
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Randevu bulunamadı!"}), 404
    if current_user.role != "admin" and appointment.user_id != current_user.id:
        return jsonify({"error": "Yetkisiz!"}), 403
    db.session.delete(appointment)
    db.session.commit()
    return jsonify({"message": "Randevu silindi!"})

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Kullanıcı zaten var'}), 400
    hashed_pw = generate_password_hash(data['password'])
    user = User(username=data['username'], password=hashed_pw)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Kayıt başarılı'})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Geçersiz bilgiler'}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return jsonify({'token': token})

@app.route("/dashboard", methods=["GET"])
@token_required
def dashboard(current_user):
    return jsonify({'message': f'Hoş geldin, {current_user.username}!'})

@app.route("/profile", methods=["GET"])
@token_required
def profile(current_user):
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'role': current_user.role
    })

@app.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if "username" in data:
        current_user.username = data["username"]
    if "password" in data and data["password"]:
        from werkzeug.security import generate_password_hash
        current_user.password = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify({"message": "Profil güncellendi!"})

@app.route('/')
def home():
    return "Merhaba, Flask uygulaman çalışıyor!"

@app.route("/users", methods=["GET"])
@token_required
def list_users(current_user):
    if current_user.role != "admin":
        return jsonify({"error": "Yetkisiz!"}), 403
    users = User.query.all()
    return jsonify([
        {"id": u.id, "username": u.username, "role": u.role} for u in users
    ])

@app.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
def delete_user(current_user, user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Yetkisiz!"}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı!"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Kullanıcı silindi!"})

@app.route("/users/<int:user_id>/role", methods=["PATCH"])
@token_required
def change_user_role(current_user, user_id):
    if current_user.role != "admin":
        return jsonify({"error": "Yetkisiz!"}), 403
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı!"}), 404
    if "role" not in data or data["role"] not in ["admin", "user"]:
        return jsonify({"error": "Geçersiz rol!"}), 400
    user.role = data["role"]
    db.session.commit()
    return jsonify({"message": f"Kullanıcının rolü {user.role} olarak güncellendi!"})

@socketio.on('chat_message')
def handle_chat_message(data):
    # data: {"username": ..., "message": ...}
    msg = Message(username=data["username"], message=data["message"], timestamp=datetime.datetime.utcnow())
    db.session.add(msg)
    db.session.commit()
    emit('chat_message', data, broadcast=True)

@app.route('/messages', methods=['GET'])
def get_messages():
    messages = Message.query.order_by(Message.timestamp.asc()).limit(100).all()
    return jsonify([
        {"username": m.username, "message": m.message, "timestamp": m.timestamp.isoformat()} for m in messages
    ])

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    import os
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
