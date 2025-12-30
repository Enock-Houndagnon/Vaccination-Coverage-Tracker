import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

def import_massive_data(file_path):
    try:
        df = pd.read_csv(file_path)
        
        conn = psycopg2.connect(
            host="localhost",
            database="VacinationDB",
            user="postgres",
            password="1234" 
        )
        cur = conn.cursor()

        # Préparation des données pour correspondre à : region, age_group, coverage_rate, report_date, gender
        data_values = [
            (row['region'], row['age_group'], float(row['coverage_rate']), row['report_date'], row['gender'])
            for _, row in df.iterrows()
        ]

        # La requête SQL avec tes vrais noms de colonnes
        query = """
            INSERT INTO raw_data (region, age_group, coverage_rate, report_date, gender)
            VALUES %s
        """
        
        print("Insertion des 100 000 lignes en cours...")
        execute_values(cur, query, data_values)
        
        conn.commit()
        print(f"✅ Succès ! Ta table raw_data est maintenant remplie.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    import_massive_data('Vaccine_New.csv')