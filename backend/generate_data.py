import pandas as pd
import random
from datetime import datetime, timedelta

regions = ['North', 'South', 'East', 'West', 'Centre']
age_groups = ['0-5 years', '6-12 years', '13-17 years', '18+ years']
genders = ['Male', 'Female']

data = []
for i in range(1, 100001):
    start_date = datetime(2023, 1, 1)
    random_date = start_date + timedelta(days=random.randint(0, 364))
    
    data.append({
        'region': random.choice(regions),
        'age_group': random.choice(age_groups),
        'coverage_rate': round(random.uniform(50.0, 100.0), 2), # Taux entre 50% et 100%
        'report_date': random_date.strftime('%Y-%m-%d'),
        'gender': random.choice(genders)
    })

df = pd.DataFrame(data)
df.to_csv('Vaccine_New.csv', index=False)
print("Nouveau fichier Vaccine_New.csv généré avec les bonnes colonnes !")