import requests
import time

def test_bmw_simple():
    print("🚀 Probando conexión a BMW Motorflash...")
    
    try:
        # Hacer una petición GET a la página de login
        url = "https://gestionbmw.motorflash.com/login.php"
        response = requests.get(url)
        
        print(f"✅ Conexión exitosa!")
        print(f"📄 Status code: {response.status_code}")
        print(f"📄 Tamaño de respuesta: {len(response.text)} caracteres")
        
        # Buscar campos de formulario en el HTML
        html = response.text.lower()
        
        if "usuario" in html:
            print("✅ Campo 'usuario' encontrado en la página")
        else:
            print("❌ Campo 'usuario' NO encontrado")
            
        if "password" in html:
            print("✅ Campo 'password' encontrado en la página")
        else:
            print("❌ Campo 'password' NO encontrado")
            
        if "acceder" in html:
            print("✅ Botón 'Acceder' encontrado en la página")
        else:
            print("❌ Botón 'Acceder' NO encontrado")
        
        print("\n📋 Información de la página:")
        print(f"URL: {url}")
        print(f"Título: {response.text.split('<title>')[1].split('</title>')[0] if '<title>' in response.text else 'No encontrado'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_bmw_simple() 