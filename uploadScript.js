const admin = require('firebase-admin');
const fs = require('fs');

// Reemplaza con la ruta a tu archivo de clave de cuenta de servicio de Firebase
const serviceAccount = require('./serviceAccountKey.json'); // Asegúrate de que esta ruta sea correcta

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Rutas a los archivos JSON
const routinesFilePath = './routines.json'; // Tu archivo existente
const calisthenicsProgressionsFilePath = './calisthenics_progressions.json'; // Nuevo archivo

// --- Función para subir Rutinas (Tu función existente, con ligeros ajustes para ser más genérica) ---
async function uploadDataWithSubcollection(
  filePath,
  mainCollectionName,
  subCollectionName,
  dataNameSingular, // ej: "Rutina", "Progresión"
  subDataNameSingular // ej: "Ejercicio", "Nivel"
) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const dataArray = JSON.parse(rawData);
    console.log(`\n--- Leyendo ${dataArray.length} ${dataNameSingular.toLowerCase()}s del archivo "${filePath}" ---`);

    const batch = db.batch();
    let itemsAddedCount = 0;

    for (const item of dataArray) {
      if (!item.id) {
        console.warn(`  Saltando ${dataNameSingular.toLowerCase()} sin ID: ${item.name || `${dataNameSingular} sin nombre`}`);
        continue;
      }

      const itemRef = db.collection(mainCollectionName).doc(item.id);
      const docSnapshot = await itemRef.get();

      if (docSnapshot.exists) {
        console.log(`  ${dataNameSingular} "${item.name}" (ID: ${item.id}) ya existe en Firestore. Saltando.`);
      } else {
        console.log(`  Añadiendo nueva ${dataNameSingular.toLowerCase()} al batch: "${item.name}" (ID: ${item.id})`);
        // Separar la subcolección (ej: 'ejercicios' o 'levels') del resto de los datos del documento principal
        const subCollectionData = item[subCollectionName] || []; // Obtener el array de la subcolección
        const { [subCollectionName]: _, ...itemDocData } = item; // 'itemDocData' no contendrá el array de la subcolección

        batch.set(itemRef, itemDocData);

        if (subCollectionData && Array.isArray(subCollectionData) && subCollectionData.length > 0) {
          const subCollectionRef = itemRef.collection(subCollectionName);
          for (const subItem of subCollectionData) {
            if (!subItem.id) {
              console.warn(`    Saltando ${subDataNameSingular.toLowerCase()} sin ID en ${dataNameSingular.toLowerCase()} "${item.id}": ${subItem.name || `${subDataNameSingular} sin nombre`}`);
              continue;
            }
            const subItemRef = subCollectionRef.doc(subItem.id);
            batch.set(subItemRef, subItem);
          }
        } else {
          console.log(`  No hay ${subDataNameSingular.toLowerCase()}s para la nueva ${dataNameSingular.toLowerCase()}: "${item.name}" (ID: ${item.id})`);
        }
        itemsAddedCount++;
      }
    }

    if (itemsAddedCount > 0) {
      console.log(`Ejecutando batch para añadir ${itemsAddedCount} nuevas ${dataNameSingular.toLowerCase()}s...`);
      await batch.commit();
      console.log(`Carga de nuevas ${dataNameSingular.toLowerCase()}s y sus ${subDataNameSingular.toLowerCase()}s completada exitosamente.`);
    } else {
      console.log(`No se encontraron nuevas ${dataNameSingular.toLowerCase()}s para añadir desde "${filePath}".`);
    }

  } catch (error) {
    console.error(`Error durante la carga desde "${filePath}":`, error);
  }
}

// --------------- LÓGICA PRINCIPAL DE SUBIDA ---------------
async function main() {
  // 1. Subir Rutinas
  await uploadDataWithSubcollection(
    routinesFilePath,
    'rutinas',           // Nombre de la colección principal en Firestore
    'ejercicios',        // Nombre del campo en JSON y de la subcolección
    'Rutina',            // Nombre para los logs
    'Ejercicio'          // Nombre para los logs de la subcolección
  );

  // 2. Subir Progresiones de Calistenia
  await uploadDataWithSubcollection(
    calisthenicsProgressionsFilePath,
    'calisthenicsProgressions', // Nombre de la colección principal
    'levels',                   // Nombre del campo en JSON y de la subcolección
    'Progresión de Calistenia', // Nombre para los logs
    'Nivel'                     // Nombre para los logs de la subcolección
  );

  console.log("\nTodas las operaciones de subida intentadas.");
}

// Ejecutar la función principal
main();