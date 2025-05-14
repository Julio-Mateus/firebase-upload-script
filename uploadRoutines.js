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

    // Usar un batch para escribir todas las rutinas y ejercicios de forma eficiente y atómica
    const batch = db.batch();

    for (const routine of routinesData) {
      // Validar que la rutina tiene un ID para evitar duplicados
      if (!routine.id) {
        console.warn(`Saltando rutina sin ID: ${routine.nombre || 'Rutina sin nombre'}`);
        continue;
      }

      // 2. Preparar los datos del documento principal de la rutina
      // Excluimos la lista de ejercicios para guardarlos en la subcolección
      const { ejercicios, ...routineDocData } = routine;

      // Referencia al documento principal de la rutina en Firestore, usando el ID del JSON
      const routineRef = db.collection('rutinas').doc(routine.id);

      // Usamos set() con { merge: true }. Esto:
      // - Si el documento con este ID no existe, lo crea.
      // - Si el documento ya existe, actualiza solo los campos proporcionados
      //   sin borrar otros campos que pudieran existir (aunque con tu estructura
      //   probablemente quieras reemplazarlo). SetOptions.merge() es seguro
      //   para no borrar subcolecciones existentes si vuelves a ejecutar el script.
      batch.set(routineRef, routineDocData, { merge: true });

      console.log(`  Añadiendo o actualizando documento principal para rutina: "${routine.nombre}" (ID: ${routine.id})`);

      // 3. Preparar los ejercicios para la subcolección
      if (ejercicios && Array.isArray(ejercicios) && ejercicios.length > 0) {
        const exercisesCollectionRef = routineRef.collection('ejercicios');

        for (const exercise of ejercicios) {
           // Validar que el ejercicio tiene un ID para evitar duplicados en la subcolección
          if (!exercise.id) {
            console.warn(`    Saltando ejercicio sin ID en rutina "${routine.id}": ${exercise.nombre || 'Ejercicio sin nombre'}`);
            continue;
          }
          // Referencia al documento del ejercicio en la subcolección, usando el ID del JSON
          const exerciseRef = exercisesCollectionRef.doc(exercise.id);

          // Usamos set() para añadir o actualizar el documento del ejercicio en la subcolección
          batch.set(exerciseRef, exercise, { merge: true });
          // console.log(`    Añadiendo o actualizando ejercicio: "${exercise.nombre}" (ID: ${exercise.id})`); // Descomentar para depurar
        }
      } else {
           console.log(`  No hay ejercicios para la rutina: "${routine.nombre}" (ID: ${routine.id})`);
      }
    }

    // 4. Ejecutar el batch de escrituras
    console.log('Ejecutando batch de escrituras...');
    await batch.commit();
    console.log('Carga de rutinas y ejercicios completada exitosamente.');

  } catch (error) {
    console.error('Error durante la carga de rutinas:', error);
  }
}

// Ejecutar la función de carga
uploadRoutines();