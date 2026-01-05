from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message

app = Flask(__name__)
CORS(app)

# --- 1. CONFIGURATION ---

DB_CONFIG = {
    "host": "localhost",
    "database": "VacinationDB",
    "user": "postgres",
    "password": "1234",
    "port": "5432"
}

# Configuration Email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'votre-email@gmail.com' 
app.config['MAIL_PASSWORD'] = 'votre-code-application' 
app.config['MAIL_DEFAULT_SENDER'] = ('Vaccination Tracker', app.config['MAIL_USERNAME'])

mail = Mail(app)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# --- 2. AUTHENTIFICATION ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    gender = data.get('gender')
    company = data.get('company')
    job = data.get('job')
    country = data.get('country')
    
    if not email or not password or not full_name:
        return jsonify({"error": "Nom, Email et mot de passe requis"}), 400

    hashed_pw = generate_password_hash(password)
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Cet email est déjà utilisé"}), 409

        # Insertion initiale : role='user' et status='provisional'
        cur.execute("""
            INSERT INTO users (full_name, email, password_hash, role, status, gender, country, company, job_title, scope)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (full_name, email, hashed_pw, 'user', 'provisional', gender, country, company, job, country))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Inscription réussie."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (data.get('email'),))
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], data.get('password')):
            return jsonify({
                "user": {
                    "id": user['id'], 
                    "full_name": user['full_name'],
                    "email": user['email'], 
                    "scope": user['scope'], 
                    "role": user['role'],
                    "status": user['status']
                }
            }), 200
        return jsonify({"error": "Identifiants incorrects"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 3. GESTION ADMINISTRATIVE (CORRIGÉ) ---

@app.route('/api/admin/pending-users', methods=['GET'])
def get_pending_users():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, full_name, email, country, company, job_title, status FROM users WHERE status = 'provisional'")
        users = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/approve-user', methods=['POST'])
def approve_user():
    data = request.json
    user_id = data.get('user_id')
    final_scope = data.get('scope') # 'All' ou le nom du pays
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # On vérifie si l'utilisateur existe
        cur.execute("SELECT email, full_name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()

        if user:
            # MISE À JOUR : On change le STATUT, le RÔLE (devient admin) et le SCOPE
            cur.execute("""
                UPDATE users 
                SET status = 'active', role = 'admin', scope = %s 
                WHERE id = %s
            """, (final_scope, user_id))
            conn.commit()

            # Optionnel : Envoi email
            try:
                msg = Message("Accès Activé", recipients=[user['email']])
                msg.body = f"Félicitations {user['full_name']}. Votre accès est validé en tant qu'administrateur ({final_scope})."
                mail.send(msg)
            except: pass

        cur.close()
        conn.close()
        return jsonify({"message": "Utilisateur approuvé et promu Admin"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/reject-user', methods=['POST'])
def reject_user():
    data = request.json
    user_id = data.get('user_id')
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # SUPPRESSION RÉELLE de la table users
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Utilisateur supprimé définitivement"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 4. DONNÉES & HISTORIQUE ---

@app.route('/api/vaccination', methods=['GET'])
def get_vaccination_data():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM raw_data ORDER BY id DESC")
        data = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Requête complète pour récupérer fichier, pays et vaccins
        query = """
            SELECT 
                ul.id, ul.filename, ul.upload_date, 
                (SELECT string_agg(DISTINCT country, ', ') FROM raw_data WHERE filename = ul.filename) as countries,
                (SELECT string_agg(DISTINCT vaccine_type, ', ') FROM raw_data WHERE filename = ul.filename) as vaccines
            FROM upload_logs ul ORDER BY ul.upload_date DESC
        """
        cur.execute(query)
        data = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(data)
    except:
        return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)