# Firebase Routine Uploader Script

## Descripción

Este repositorio contiene un script de Node.js diseñado para subir datos de rutinas y ejercicios desde un archivo JSON a una base de datos Cloud Firestore en Firebase.

## Propósito

El propósito principal de este script es facilitar la **carga inicial de datos** o la **actualización masiva** de información para rutinas y ejercicios en una aplicación que utiliza Firestore como backend. Permite mantener los datos de las rutinas y sus ejercicios asociados en un formato estructurado (JSON) y subir esta información a Firestore de manera programática, evitando la entrada manual de grandes volúmenes de datos a través de la consola de Firebase.

## Estructura del Proyecto

-   `uploadRoutines.js`: El script principal de Node.js que lee el archivo JSON, se conecta a Firebase y sube los datos a las colecciones y subcolecciones de Firestore.
-   `routines.json`: El archivo JSON que contiene la estructura y los datos de las rutinas y sus ejercicios. Este es el archivo que el script lee.
-   `.gitignore`: Un archivo crucial que especifica los archivos y directorios que Git debe ignorar para la seguridad (¡especialmente tu clave de cuenta de servicio!).
-   `README.md`: Este archivo, que proporciona una descripción del proyecto, sus requisitos, configuración y uso.

## Requisitos Previos

Para poder configurar y ejecutar este script exitosamente, necesitas tener instalado:

-   **Node.js**: Puedes descargarlo desde [nodejs.org](https://nodejs.org/). Se recomienda la versión LTS (Long-Term Support).
-   **npm** (Node Package Manager) o **Yarn**: Vienen incluidos con la instalación de Node.js.
-   Una **cuenta y proyecto de Firebase**. Si aún no tienes uno, puedes crearlo en la [Consola de Firebase](https://console.firebase.google.com/).
-   Una base de datos **Cloud Firestore** configurada en tu proyecto Firebase. Puedes seguir la guía de inicio rápido de Firestore si necesitas crearla ([Firebase Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)).
-   Un archivo de **clave de cuenta de servicio de Firebase** (`serviceAccountKey.json`) con permisos adecuados para escribir y gestionar datos en Cloud Firestore. **Este archivo contiene credenciales sensibles y NO debe subirse a este repositorio ni compartirse públicamente por razones de seguridad.**

## Configuración

1.  **Clona este repositorio** a tu máquina local: (Asegúrate de usar la URL correcta si tu repositorio tiene otro nombre o está en otra ubicación).
2.  **Instala las dependencias** de Node.js. Navega al directorio clonado en tu terminal y ejecuta:(Asegúrate de instalar cualquier otra dependencia que tu script `uploadRoutines.js` pueda necesitar).
3.  **Obtén tu archivo `serviceAccountKey.json`**. Genera este archivo desde la [Consola de Firebase](https://console.firebase.google.com/):
    *   Ve a "Configuración del proyecto" (Project settings).
    *   Selecciona la pestaña "Cuentas de servicio" (Service accounts).
    *   Haz clic en "Generar nueva clave privada" (Generate new private key). Esto descargará el archivo JSON.
4.  **Coloca el archivo `serviceAccountKey.json`** que descargaste en el **directorio raíz** de este proyecto local (`firebase-upload-script`).
5.  **Verifica tu archivo `.gitignore`**. Asegúrate de que el archivo `.gitignore` en la raíz del proyecto contenga la línea `serviceAccountKey.json` para que Git lo ignore y no lo incluyas accidentalmente en tus commits. También debería ignorar `node_modules/`.
6.  **Asegura tu Firestore Security Rules**. Verifica en la Consola de Firebase que tus reglas de seguridad para Cloud Firestore permiten que la cuenta de servicio autenticada escriba en las colecciones donde subirás los datos (por ejemplo, `rutinas` y `rutinas/{rutinaId}/ejercicios`).

## Uso

Una vez que la configuración esté completa, puedes ejecutar el script para subir los datos desde `routines.json` a Firestore. Navega al directorio del proyecto en tu terminal y ejecuta:El script se conectará a tu proyecto Firebase utilizando la clave de cuenta de servicio y procesará el archivo `routines.json` para crear o actualizar los documentos en tus colecciones de Firestore.

## Formato del Archivo `routines.json`

El script `uploadRoutines.js` espera que el archivo `routines.json` tenga una estructura específica para mapear los datos correctamente a tu modelo de Firestore. La estructura debe ser un arreglo de objetos, donde cada objeto representa una rutina, y cada rutina contiene un arreglo de objetos para sus ejercicios.

Aquí tienes una estructura de ejemplo que refleja lo que discutimos: **Asegúrate de que las claves en tu archivo `routines.json` (`id`, `slug`, `nombre`, etc.) coincidan exactamente con cómo tu script `uploadRoutines.js` espera leer los datos y cómo quieres que se almacenen en Firestore.**

## Alojamiento de Imágenes y Videos

Es crucial entender que este script **no sube los archivos de imagen o video** en sí. Solo sube las **URLs** que proporcionas en el archivo `routines.json`.

Por lo tanto, debes asegurarte de que tus archivos de imagen y video estén alojados en un servicio accesible a través de una URL pública. Algunas opciones comunes incluyen:

-   **Firebase Storage**: Un servicio robusto de Google Cloud para almacenar archivos.
-   **Servidores de alojamiento de imágenes dedicados**: Servicios como Cloudinary, Imgur (verificar términos de uso).
-   **Tu propio servidor web o servicio de almacenamiento en la nube**: AWS S3, Google Cloud Storage, etc.

Las URLs en tu `routines.json` (`imagenUrl`, `videoUrl`) deben apuntar directamente a la ubicación donde están alojados estos archivos.

## Contribuciones

Las contribuciones son bienvenidas y apreciadas. Si encuentras un error, tienes una sugerencia de mejora o quieres contribuir con código, por favor:

1.  Abre un "Issue" para discutir la propuesta.
2.  Envía un "Pull Request" con tus cambios.

## Licencia

[Considera añadir un archivo `LICENSE` en la raíz de tu repositorio para especificar bajo qué términos se distribuye tu código (por ejemplo, Licencia MIT, Apache 2.0, etc.). Puedes encontrar plantillas de licencia en sitios como [choosealicense.com](https://choosealicense.com/). Si no añades una licencia explícitamente, el código no tendrá una licencia de código abierto por defecto.]