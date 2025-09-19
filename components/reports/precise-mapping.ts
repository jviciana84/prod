// Mapeo manual de provincias realizado con el botón de debug
// Actualizado para ser consistente con la normalización de provincias
export const preciseProvinceMapping = {
  "0": "Baleares",
  "1": "Asturias",
  "2": "A Coruña",
  "3": "Girona",
  "4": "Pontevedra",
  "5": "Cantabria",
  "6": "Málaga",
  "7": "Almería",
  "8": "Murcia",
  "9": "Albacete",
  "10": "Ávila",
  "11": "Araba/Álava",
  "12": "Badajoz",
  "13": "Alicante",
  "14": "Ourense",
  "15": "Barcelona",
  "16": "Burgos",
  "17": "Cáceres",
  "18": "Cádiz",
  "19": "Castellón",
  "20": "Ciudad Real",
  "21": "Jaén",
  "22": "Córdoba",
  "23": "Cuenca",
  "24": "Granada",
  "25": "Guadalajara",
  "26": "Gipuzkoa",
  "27": "Huelva",
  "28": "Huesca",
  "29": "León",
  "30": "Lleida",
  "31": "La Rioja",
  "32": "Soria",
  "33": "Navarra",
  "34": "Ceuta",
  "35": "Lugo",
  "36": "Madrid",
  "37": "Palencia",
  "38": "Salamanca",
  "39": "Segovia",
  "40": "Sevilla",
  "41": "Toledo",
  "42": "Tarragona",
  "43": "Teruel",
  "44": "Valencia",
  "45": "Valladolid",
  "46": "Bizkaia",
  "47": "Zamora",
  "48": "Zaragoza",
  "49": "Melilla"
};

const inverseMapping = {};
Object.entries(preciseProvinceMapping).forEach(([id, provincia]) => {
  inverseMapping[provincia] = parseInt(id);
});

export const inverseProvinceMapping = inverseMapping;

// Datos de los paths del SVG (mantener compatibilidad)
export const pathData = [
  { id: 0, centerX: 701, centerY: 257, width: 110, height: 110, area: 12085 },
  { id: 1, centerX: 281, centerY: 28, width: 0, height: 0, area: 0 },
  { id: 2, centerX: 95, centerY: 9, width: 0, height: 0, area: 0 },
  { id: 3, centerX: 678, centerY: 101, width: 47, height: 47, area: 2238 },
  { id: 4, centerX: 49, centerY: 64, width: 27, height: 27, area: 765 },
  { id: 5, centerX: 358, centerY: 29, width: 5, height: 5, area: 31 },
  { id: 6, centerX: 295, centerY: 392, width: 0, height: 0, area: 0 },
  { id: 7, centerX: 418, centerY: 347, width: 0, height: 0, area: 0 },
  { id: 8, centerX: 480, centerY: 297, width: 0, height: 0, area: 0 },
  { id: 9, centerX: 460, centerY: 259, width: 0, height: 0, area: 0 },
  { id: 10, centerX: 261, centerY: 159, width: 0, height: 0, area: 0 },
  { id: 11, centerX: 375, centerY: 48, width: 15, height: 15, area: 235 },
  { id: 12, centerX: 270, centerY: 260, width: 0, height: 0, area: 0 },
  { id: 13, centerX: 537, centerY: 290, width: 0, height: 0, area: 0 },
  { id: 14, centerX: 82, centerY: 75, width: 0, height: 0, area: 0 },
  { id: 15, centerX: 665, centerY: 94, width: 6, height: 6, area: 38 },
  { id: 16, centerX: 349, centerY: 64, width: 69, height: 69, area: 4786 },
  { id: 17, centerX: 186, centerY: 197, width: 0, height: 0, area: 0 },
  { id: 18, centerX: 228, centerY: 398, width: 0, height: 0, area: 0 },
  { id: 19, centerX: 552, centerY: 180, width: 0, height: 0, area: 0 },
  { id: 20, centerX: 288, centerY: 251, width: 17, height: 17, area: 286 },
  { id: 21, centerX: 395, centerY: 316, width: 0, height: 0, area: 0 },
  { id: 22, centerX: 251, centerY: 331, width: 12, height: 12, area: 154 },
  { id: 23, centerX: 429, centerY: 189, width: 0, height: 0, area: 0 },
  { id: 24, centerX: 409, centerY: 339, width: 0, height: 0, area: 0 },
  { id: 25, centerX: 378, centerY: 148, width: 0, height: 0, area: 0 },
  { id: 26, centerX: 441, centerY: 31, width: 0, height: 0, area: 0 },
  { id: 27, centerX: 148, centerY: 330, width: 0, height: 0, area: 0 },
  { id: 28, centerX: 586, centerY: 67, width: 0, height: 0, area: 0 },
  { id: 29, centerX: 249, centerY: 65, width: 38, height: 38, area: 1455 },
  { id: 30, centerX: 647, centerY: 80, width: 0, height: 0, area: 0 },
  { id: 31, centerX: 373, centerY: 68, width: 0, height: 0, area: 0 },
  { id: 32, centerX: 412, centerY: 98, width: 0, height: 0, area: 0 },
  { id: 33, centerX: 485, centerY: 71, width: 25, height: 25, area: 629 },
  { id: 34, centerX: 233, centerY: 465, width: 0, height: 0, area: 0 },
  { id: 35, centerX: 133, centerY: 19, width: 0, height: 0, area: 0 },
  { id: 36, centerX: 319, centerY: 172, width: 34, height: 34, area: 1160 },
  { id: 37, centerX: 302, centerY: 67, width: 35, height: 35, area: 1230 },
  { id: 38, centerX: 176, centerY: 149, width: 0, height: 0, area: 0 },
  { id: 39, centerX: 322, centerY: 136, width: 0, height: 0, area: 0 },
  { id: 40, centerX: 232, centerY: 345, width: 35, height: 35, area: 1218 },
  { id: 41, centerX: 291, centerY: 205, width: 0, height: 0, area: 0 },
  { id: 42, centerX: 631, centerY: 131, width: 0, height: 0, area: 0 },
  { id: 43, centerX: 559, centerY: 160, width: 0, height: 0, area: 0 },
  { id: 44, centerX: 481, centerY: 219, width: 19, height: 19, area: 368 },
  { id: 45, centerX: 236, centerY: 94, width: 18, height: 18, area: 341 },
  { id: 46, centerX: 375, centerY: 37, width: 27, height: 27, area: 729 },
  { id: 47, centerX: 164, centerY: 94, width: 0, height: 0, area: 0 },
  { id: 48, centerX: 483, centerY: 75, width: 16, height: 16, area: 246 },
  { id: 49, centerX: 373, centerY: 500, width: 0, height: 0, area: 0 }
];

// Función para obtener provincia por coordenadas
export function getProvinceByCoordinates(x: number, y: number): string | null {
  const tolerance = 50; // Radio de tolerancia
  
  for (const path of pathData) {
    const distance = Math.sqrt(Math.pow(x - path.centerX, 2) + Math.pow(y - path.centerY, 2));
    if (distance <= tolerance) {
      return preciseProvinceMapping[path.id] || null;
    }
  }
  return null;
}
