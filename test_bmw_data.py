import requests
import json

# Datos que simulan el formato real del CSV de BMW
test_data = [
    {
        "ID Anuncio": "BMW-20240719-001",
        "Matrícula": "1234ABC",
        "Modelo": "Serie 1",
        "Marca": "BMW",
        "Precio": "25000",
        "Fecha compra DMS": "01/01/2024",
        "Concesionario": "BMW España",
        "Días stock": "30",
        "Combustible": "Gasolina",
        "Cambio": "Automático",
        "Color Carrocería": "Blanco",
        "KM": "0",
        "Estado": "Disponible",
        "Disponibilidad": "Disponible"
    }
]

# Configuración
api_url = "http://localhost:3000/api/import-csv"
api_key = "cvo-scraper-2024"

# Payload
payload = {
    "csv_data": test_data,
    "file_name": "test_bmw_scraping.csv",
    "api_key": api_key
}

print("🧪 Probando API con datos BMW...")
print(f"URL: {api_url}")
print(f"Datos: {len(test_data)} registros")
print(f"Columnas: {list(test_data[0].keys())}")

try:
    response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"})
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ API funcionando correctamente")
            summary = data.get('summary', {})
            print(f"Insertados: {summary.get('inserted', 0)}")
            print(f"Actualizados: {summary.get('updated', 0)}")
            print(f"Errores: {summary.get('errors', 0)}")
        else:
            print(f"❌ Error: {data.get('error')}")
    else:
        print(f"❌ Error HTTP: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error de conexión: {e}") 