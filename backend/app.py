from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from sqlalchemy import create_engine

app = Flask(__name__)
# Ceci autorise React (port 3000) à envoyer des fichiers à Flask (port 5000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 1. CONFIGURATION DE LA CONNEXION (Modifie tes identifiants ici si besoin)
DB_CONFIG = {
    "host": "localhost",
    "database": "VacinationDB",
    "user": "postgres",
    "password": "1234",
    "port": "5432"
}

# 2. CRÉATION DE L'ENGINE (Nécessaire pour pandas.to_sql)
# Format : postgresql://user:password@host:port/database
db_url = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
engine = create_engine(db_url)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.route('/api/vaccination', methods=['GET'])
def get_vaccination_data():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # On récupère TOUTES les colonnes nécessaires
        cur.execute("""
            SELECT country, location_name, age_group, 
                   coverage_rate, report_date, gender, vaccine_type 
            FROM raw_data;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    try:
        df = pd.read_csv(file)
        # 1. Insert data into raw_data
        df.to_sql('raw_data', engine, if_exists='append', index=False)
        
        # 2. Log the history into upload_logs
        log_query = "INSERT INTO upload_logs (filename, rows_imported, status) VALUES (%s, %s, %s)"
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(log_query, (file.filename, len(df), 'Success'))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Upload successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # On lie la table logs avec raw_data pour extraire les pays et vaccins uniques par import
        cur.execute("""
            SELECT 
                l.id, l.filename, l.rows_imported, l.upload_date, l.status,
                (SELECT STRING_AGG(DISTINCT country, ', ') FROM raw_data WHERE country IS NOT NULL) as countries,
                (SELECT STRING_AGG(DISTINCT vaccine_type, ', ') FROM raw_data WHERE vaccine_type IS NOT NULL) as vaccines
            FROM upload_logs l
            ORDER BY l.upload_date DESC;
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)