from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
import os

app = Flask(__name__)
# CORS est configuré pour accepter les requêtes de votre frontend React (Local et Render)
CORS(app)

# --- 1. CONFIGURATION ---

# Paramètres locaux (utilisés si DATABASE_URL n'est pas définie)
DB_CONFIG = {
    "host": "localhost",
    "database": "VacinationDB",
    "user": "postgres",
    "password": "1234",
    "port": "5432"
}

# Script SQL complet pour l'initialisation automatique des tables
INIT_DB_SQL = """
-- Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'provisional',
    gender VARCHAR(20),
    country VARCHAR(100),
    company VARCHAR(100),
    job_title VARCHAR(100),
    scope VARCHAR(100)
);

-- Table des Données de Vaccination
CREATE TABLE IF NOT EXISTS raw_data (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100),
    location_name VARCHAR(100),
    vaccine_type VARCHAR(100),
    age_group VARCHAR(50),
    coverage_rate NUMERIC,
    vaccination_date DATE,
    filename VARCHAR(255)
);

-- Table des Logs d'Upload
CREATE TABLE IF NOT EXISTS upload_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Baselines (Objectifs)
CREATE TABLE IF NOT EXISTS baselines (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100),
    vaccine_type VARCHAR(100),
    target_rate NUMERIC,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Alertes
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    country VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def get_db_connection():
    """Établit la connexion et force l'utilisation du schéma public."""
    try:
        url = os.getenv("DATABASE_URL")
        if url:
            conn = psycopg2.connect(url)
        else:
            conn = psycopg2.connect(**DB_CONFIG)
        
        # On force le search_path à chaque nouvelle connexion
        cur = conn.cursor()
        cur.execute("SET search_path TO public")
        cur.close()
        return conn
    except Exception as e:
        print(f"ERREUR DE CONNEXION DB : {e}")
        return None

def init_db():
    """Initialise la structure de la base et crée l'admin par défaut."""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            # 1. Création des tables si elles n'existent pas
            cur.execute(INIT_DB_SQL)
            
            # 2. Vérification/Création de l'admin par défaut
            cur.execute("SELECT COUNT(*) FROM users")
            if cur.fetchone()[0] == 0:
                print("⚠️ Aucune donnée utilisateur. Création de l'admin : Enock HOUNDAGNON")
                hashed_pw = generate_password_hash("Admin123")
                cur.execute("""
                    INSERT INTO users (full_name, email, password_hash, role, status, scope)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, ("Enock HOUNDAGNON", "admin@gmail.com", hashed_pw, 'admin', 'active', 'All'))
            
            conn.commit()
            print("✅ Base de données initialisée avec succès.")
            cur.close()
        except Exception as e:
            print(f"❌ Erreur lors de l'init DB : {e}")
        finally:
            conn.close()

# Configuration Email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'votre-email@gmail.com' 
app.config['MAIL_PASSWORD'] = 'votre-code-application' 

mail = Mail(app)

# --- 2. AUTHENTIFICATION ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    full_name = data.get('full_name')
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password or not full_name:
        return jsonify({"error": "Données incomplètes"}), 400

    hashed_pw = generate_password_hash(password)
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "Erreur de connexion base de données"}), 500
    
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Cet email est déjà utilisé"}), 409

        cur.execute("""
            INSERT INTO users (full_name, email, password_hash, role, status, gender, country, company, job_title, scope)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (full_name, email, hashed_pw, 'user', 'provisional', 
              data.get('gender'), data.get('country'), data.get('company'), 
              data.get('job'), data.get('country')))
        conn.commit()
        return jsonify({"message": "Inscription réussie."}), 201
    except Exception as e:
        print(f"Erreur Register : {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "Erreur de connexion base de données"}), 500

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            return jsonify({
                "user": {
                    "id": user['id'], 
                    "full_name": user['full_name'],
                    "email": user['email'], 
                    "role": user['role'],
                    "status": user['status'],
                    "scope": user['scope']
                }
            }), 200
        return jsonify({"error": "Identifiants incorrects"}), 401
    except Exception as e:
        print(f"Erreur Login : {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# --- 3. ROUTES DU DASHBOARD ---

@app.route('/api/vaccination', methods=['GET'])
def get_vaccination_data():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM raw_data ORDER BY id DESC")
        data = cur.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/history', methods=['GET'])
def get_history():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT ul.id, ul.filename, ul.upload_date, 
            (SELECT string_agg(DISTINCT country, ', ') FROM raw_data WHERE filename = ul.filename) as countries,
            (SELECT string_agg(DISTINCT vaccine_type, ', ') FROM raw_data WHERE filename = ul.filename) as vaccines
            FROM upload_logs ul ORDER BY ul.upload_date DESC
        """
        cur.execute(query)
        data = cur.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()

# --- 4. ROUTES ADMIN ---

@app.route('/api/admin/pending-users', methods=['GET'])
def get_pending_users():
    conn = get_db_connection()
    if not conn: return jsonify([]), 500
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, full_name, email, country, company, job_title, status FROM users WHERE status = 'provisional'")
        users = cur.fetchall()
        return jsonify(users), 200
    except Exception as e:
        return jsonify([]), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/approve-user', methods=['POST'])
def approve_user():
    data = request.json
    user_id = data.get('user_id')
    scope = data.get('scope')
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET status = 'active', role = 'admin', scope = %s WHERE id = %s", (scope, user_id))
        conn.commit()
        return jsonify({"message": "Utilisateur approuvé avec succès"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/admin/reject-user', methods=['POST'])
def reject_user():
    data = request.json
    user_id = data.get('user_id')
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return jsonify({"message": "Utilisateur rejeté"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# --- 5. DÉMARRAGE ---

if __name__ == '__main__':
    # Initialisation automatique des tables et de l'admin au démarrage
    init_db()
    
    # Affichage des routes disponibles pour debug
    print("\n--- ROUTES DISPONIBLES ---")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.rule}")
    print("--------------------------\n")

    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)