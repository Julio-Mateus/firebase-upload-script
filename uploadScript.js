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
const routinesFilePath = './routines.json';
const calisthenicsProgressionsFilePath = './calisthenics_progressions.json';
const stoicModulesFilePath = './stoic_modules.json'; // <--- AÑADE ESTA LÍNEA

// --- Función para subir datos CON SUBCOLECCIÓN ---
async function uploadDataWithSubcollection(
  filePath,
  mainCollectionName,
  subCollectionName, // Nombre del campo en JSON que se convertirá en subcolección
  dataNameSingular,
  subDataNameSingular
) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const dataArray = JSON.parse(rawData);
    console.log(`\n--- Leyendo ${dataArray.length} ${dataNameSingular.toLowerCase()}s (con subcolección) del archivo "${filePath}" ---`);

    const batch = db.batch();
    let itemsAddedCount = 0;

    for (const item of dataArray) {
      // Usa item.name para los logs si existe, sino item.title (para módulos de estoicismo u otros)
      const itemNameForLog = item.name || item.title || `${dataNameSingular} sin nombre/título`;
      if (!item.id) {
        console.warn(`  Saltando ${dataNameSingular.toLowerCase()} sin ID: ${itemNameForLog}`);
        continue;
      }

      const itemRef = db.collection(mainCollectionName).doc(item.id);
      const docSnapshot = await itemRef.get();

      if (docSnapshot.exists) {
        console.log(`  ${dataNameSingular} "${itemNameForLog}" (ID: ${item.id}) ya existe en Firestore. Saltando.`);
      } else {
        console.log(`  Añadiendo nueva ${dataNameSingular.toLowerCase()} al batch: "${itemNameForLog}" (ID: ${item.id})`);
        
        const subCollectionData = item[subCollectionName] || [];
        // 'itemDocData' no contendrá el array que se convierte en subcolección
        const { [subCollectionName]: _, ...itemDocData } = item; 

        batch.set(itemRef, itemDocData); // Sube el documento principal sin el campo de la subcolección

        if (subCollectionData && Array.isArray(subCollectionData) && subCollectionData.length > 0) {
          const subCollectionRef = itemRef.collection(subCollectionName);
          for (const subItem of subCollectionData) {
            const subItemNameForLog = subItem.name || subItem.title || `${subDataNameSingular} sin nombre/título`;
            if (!subItem.id) {
              console.warn(`    Saltando ${subDataNameSingular.toLowerCase()} sin ID en ${dataNameSingular.toLowerCase()} "${item.id}": ${subItemNameForLog}`);
              continue;
            }
            const subItemRef = subCollectionRef.doc(subItem.id);
            batch.set(subItemRef, subItem);
          }
        } else {
          console.log(`  No hay ${subDataNameSingular.toLowerCase()}s para la nueva ${dataNameSingular.toLowerCase()}: "${itemNameForLog}" (ID: ${item.id})`);
        }
        itemsAddedCount++;
      }
    }

    if (itemsAddedCount > 0) {
      console.log(`Ejecutando batch para añadir ${itemsAddedCount} nuevas ${dataNameSingular.toLowerCase()}s y sus ${subDataNameSingular.toLowerCase()}s...`);
      await batch.commit();
      console.log(`Carga de nuevas ${dataNameSingular.toLowerCase()}s y sus ${subDataNameSingular.toLowerCase()}s completada exitosamente.`);
    } else {
      console.log(`No se encontraron nuevas ${dataNameSingular.toLowerCase()}s para añadir desde "${filePath}".`);
    }

  } catch (error) {
    console.error(`Error durante la carga (con subcolección) desde "${filePath}":`, error);
  }
}

// --- NUEVA FUNCIÓN para subir datos CON ARRAYS EMBEBIDOS (sin convertirlos a subcolección) ---
async function uploadEmbeddedData(
  filePath,
  mainCollectionName,
  dataNameSingular // ej: "Módulo de Estoicismo"
) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const dataArray = JSON.parse(rawData);
    console.log(`\n--- Leyendo ${dataArray.length} ${dataNameSingular.toLowerCase()}s (con datos embebidos) del archivo "${filePath}" ---`);

    const batch = db.batch();
    let itemsAddedCount = 0;

    for (const item of dataArray) {
      // Usa item.title para los logs si existe, sino item.name (para otros tipos de datos)
      const itemNameForLog = item.title || item.name || `${dataNameSingular} sin título/nombre`;
      if (!item.id) {
        console.warn(`  Saltando ${dataNameSingular.toLowerCase()} sin ID: ${itemNameForLog}`);
        continue;
      }

      const itemRef = db.collection(mainCollectionName).doc(item.id);
      const docSnapshot = await itemRef.get();

      if (docSnapshot.exists) {
        console.log(`  ${dataNameSingular} "${itemNameForLog}" (ID: ${item.id}) ya existe en Firestore. Saltando.`);
      } else {
        console.log(`  Añadiendo nuevo ${dataNameSingular.toLowerCase()} al batch: "${itemNameForLog}" (ID: ${item.id})`);
        // Sube el objeto 'item' completo, incluyendo sus arrays internos
        batch.set(itemRef, item); 
        itemsAddedCount++;
      }
    }

    if (itemsAddedCount > 0) {
      console.log(`Ejecutando batch para añadir ${itemsAddedCount} nuevas ${dataNameSingular.toLowerCase()}s...`);
      await batch.commit();
      console.log(`Carga de nuevas ${dataNameSingular.toLowerCase()}s (con datos embebidos) completada exitosamente.`);
    } else {
      console.log(`No se encontraron nuevas ${dataNameSingular.toLowerCase()}s para añadir desde "${filePath}".`);
    }

  } catch (error) {
    console.error(`Error durante la carga (con datos embebidos) desde "${filePath}":`, error);
  }
}


// --------------- LÓGICA PRINCIPAL DE SUBIDA ---------------
async function main() {
  // 1. Subir Rutinas (con subcolección 'ejercicios')
  await uploadDataWithSubcollection(
    routinesFilePath,
    'rutinas',
    'ejercicios',
    'Rutina',
    'Ejercicio'
  );

  // 2. Subir Progresiones de Calistenia (con subcolección 'levels')
  await uploadEmbeddedData(
    calisthenicsProgressionsFilePath,
    'calisthenicsProgressions',
    'Progresión de Calistenia'
  );

  // 3. Subir Módulos de Estoicismo (con arrays embebidos)
  await uploadEmbeddedData( // <--- USA LA NUEVA FUNCIÓN
    stoicModulesFilePath,
    'stoic_modules',          // Nombre de la colección principal en Firestore
    'Módulo de Estoicismo'    // Nombre para los logs
  );

  console.log("\nTodas las operaciones de subida intentadas.");
}

// Ejecutar la función principal
main().catch(console.error); // Añadir catch para errores no manejados en main