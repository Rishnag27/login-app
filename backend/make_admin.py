import sys
from app import app
from models import db, User

if len(sys.argv) != 2:
    print("Kullanım: python make_admin.py <kullanici_adi>")
    sys.exit(1)

username = sys.argv[1]

with app.app_context():
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"Kullanıcı bulunamadı: {username}")
        sys.exit(1)
    user.role = "admin"
    db.session.commit()
    print(f"{username} artık admin!") 