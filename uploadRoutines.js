const admin = require('firebase-admin');
const fs = require('fs');

// Reemplaza con la ruta a tu archivo de clave de cuenta de servicio de Firebase
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Reemplaza con la ruta a tu archivo JSON de rutinas
const routinesFilePath = './routines.json';

async function uploadRoutines() {
  try {
    // 1. Leer el archivo JSON
    const routinesData = JSON.parse(fs.readFileSync(routinesFilePath, 'utf8'));
    console.log(`Leyendo ${routinesData.length} rutinas del archivo JSON...`);

    // Usar un batch para escribir todas las rutinas y ejercicios de forma eficiente
    const batch = db.batch();
    let routinesAddedCount = 0;

    for (const routine of routinesData) {
      if (!routine.id) {
        console.warn(`Saltando rutina sin ID: ${routine.nombre || 'Rutina sin nombre'}`);
        continue;
      }

      const routineRef = db.collection('rutinas').doc(routine.id);

      // *** INICIO DE LA MODIFICACIÓN PRINCIPAL ***
      // 2. Verificar si la rutina ya existe en Firestore
      const docSnapshot = await routineRef.get();

      if (docSnapshot.exists) {
        console.log(`  Rutina "${routine.nombre}" (ID: ${routine.id}) ya existe en Firestore. Saltando.`);
        // Opcional: Podrías decidir actualizarla aquí si quisieras, pero la solicitud es no copiarla.
        // Por ejemplo, podrías comparar un campo 'version' o 'lastUpdated'
        // y solo actualizar si la versión del JSON es más nueva.
        // Pero para "no copiar las que están", simplemente la saltamos.
      } else {
        // La rutina no existe, así que la añadimos al batch
        console.log(`  Añadiendo nueva rutina al batch: "${routine.nombre}" (ID: ${routine.id})`);
        const { ejercicios, ...routineDocData } = routine;
        batch.set(routineRef, routineDocData); // No necesitamos merge:true aquí porque estamos creando un nuevo documento

        // 3. Preparar los ejercicios para la subcolección (solo si la rutina es nueva)
        if (ejercicios && Array.isArray(ejercicios) && ejercicios.length > 0) {
          const exercisesCollectionRef = routineRef.collection('ejercicios');
          for (const exercise of ejercicios) {
            if (!exercise.id) {
              console.warn(`    Saltando ejercicio sin ID en rutina "${routine.id}": ${exercise.nombre || 'Ejercicio sin nombre'}`);
              continue;
            }
            const exerciseRef = exercisesCollectionRef.doc(exercise.id);
            batch.set(exerciseRef, exercise); // Igualmente, no se necesita merge:true para nuevos ejercicios
            // console.log(`    Añadiendo ejercicio: "${exercise.nombre}" (ID: ${exercise.id})`);
          }
        } else {
          console.log(`  No hay ejercicios para la nueva rutina: "${routine.nombre}" (ID: ${routine.id})`);
        }
        routinesAddedCount++;
      }
      // *** FIN DE LA MODIFICACIÓN PRINCIPAL ***
    }

    // 4. Ejecutar el batch de escrituras si hay algo que añadir
    if (routinesAddedCount > 0) {
      console.log(`Ejecutando batch para añadir ${routinesAddedCount} nuevas rutinas...`);
      await batch.commit();
      console.log('Carga de nuevas rutinas y ejercicios completada exitosamente.');
    } else {
      console.log('No se encontraron nuevas rutinas para añadir.');
    }

  } catch (error) {
    console.error('Error durante la carga de rutinas:', error);
  }
}

// Ejecutar la función de carga
uploadRoutines();