import requests
import json

# Datos muy simples
test_data = [
    {
        "ID Anuncio": "TEST-123",
        "Matrícula": "9999ZZZ",
        "Modelo": "Test Model",
        "Marca": "BMW"
    }
]

# Configuración
api_url = "http://localhost:3000/api/import-csv"
api_key = "cvo-scraper-2024"

# Payload
payload = {
    "csv_data": test_data,
    "file_name": "simple_test.csv",
    "api_key": api_key
}

print("🧪 Test simple de inserción...")
print(f"URL: {api_url}")
print(f"Datos: {test_data}")

try:
    response = requests.post(api_url, json=payload, headers={"Content-Type": "application/json"})
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ API respondió correctamente")
            summary = data.get('summary', {})
            print(f"Insertados: {summary.get('inserted', 0)}")
            print(f"Actualizados: {summary.get('updated', 0)}")
            print(f"Errores: {summary.get('errors', 0)}")
            
            if summary.get('inserted', 0) > 0:
                print("🎉 ¡Datos insertados correctamente!")
            else:
                print("⚠️ No se insertaron datos")
        else:
            print(f"❌ Error: {data.get('error')}")
    else:
        print(f"❌ Error HTTP: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error de conexión: {e}") 