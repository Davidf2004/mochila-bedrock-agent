# MOCHILA

**Pega el caos del grupo. Deja lista la mañana.**

Son las diez de la noche. Hay mensajes de la maestra, una corrección de horario, una foto que no encuentras y alguien preguntando algo que ya respondieron. Mañana hay excursión. Tu pregunta es sencilla: **¿qué necesita mi hijo y qué me toca hacer a mí?**

MOCHILA convierte ese hilo en un plan con fuentes. Distingue el aviso vigente del que fue corregido, muestra lo que sigue sin confirmar y prepara dos vistas: la del adulto y la de quien va a llevar la mochila.

El momento que queremos que la gente recuerde ocurre al pulsar **«Lo preparo yo»**. El niño encuentra una tarea concreta cada vez: mete tu botella, prepara tu gorra, marca lo que ya está. El permiso sigue pendiente para el adulto. La experiencia termina en una mochila preparada, con las responsabilidades claras.

## La apuesta

La utilidad inicial es organizar información escolar. La experiencia central es **pasar de «tengo que recordarlo todo» a «ya sabemos qué hacer cada uno»**. Es una hipótesis de producto, pendiente de validación con personas.

El público inicial son madres, padres y cuidadores de niños de primaria que reciben avisos en grupos de mensajería y preparan el día siguiente desde el teléfono. La demo estará en español. La entrada será texto pegado manualmente; no requiere integración con WhatsApp.

## Una demo que se entiende en menos de un minuto

1. Pegar un hilo ficticio de avisos escolares que incluya un horario inicial y una corrección posterior.
2. Ver un plan con el horario actualizado, una lista de objetos y una acción para el adulto.
3. Abrir la fuente de la corrección para comprobar qué cambió y quién lo escribió.
4. Pulsar «Lo preparo yo» y completar un objeto desde la vista infantil.
5. Volver a la vista del adulto: la firma del permiso continúa pendiente.
6. Descargar el plan como texto o el evento como archivo de calendario `.ics`.

El archivo de calendario se descarga para que la persona decida importarlo. El prototipo no enviará mensajes, firmará permisos ni escribirá directamente en calendarios externos.

## Por qué tiene fuerza para este reto

- **Un problema visible:** el público puede reconocer el desorden y comprobar la respuesta con sus propias fuentes.
- **Una decisión que demuestra criterio:** el agente debe reconciliar cambios, conservar evidencia y señalar ambigüedades.
- **Un detalle agradable que afecta el resultado:** «Lo preparo yo» convierte una lista para el adulto en acciones apropiadas para el niño.
- **Un alcance que cabe en el tiempo disponible:** texto, plan, correcciones, checklist, fuentes y exportaciones. Una buena escena completa.

## Diferenciación honesta

La organización escolar con IA ya tiene competidores. [Dobbie AI](https://dobbieai.com/) anuncia extracción de tareas y recordatorios a partir de mensajes escolares. [My School Agent](https://myschoolagent.com/features) ofrece información escolar organizada, calendarios y resúmenes diarios. No hay base para afirmar que MOCHILA sea el primer producto de esta categoría.

La apuesta específica de MOCHILA combina **correcciones explicadas con sus fuentes**, **incertidumbre visible** y **traspaso de tareas al niño** en una misma experiencia breve. Que esa combinación resulte preferible deberá demostrarse con pruebas; no se presupone exclusividad de funciones.

## Arquitectura prevista y alcance real

```text
Texto pegado + fecha de referencia + plan actual
                        ↓
Interfaz HTML / CSS / JavaScript
                        ↓
Servidor Node.js local
                        ↓
AWS SDK → Amazon Bedrock Converse
                        ↕
read_messages · read_current_plan · save_plan
                        ↓
Plan estructurado, fuentes y correcciones
                        ↓
Checklist · Lo preparo yo · Descargar .ics / .txt
```

`read_messages` devuelve los avisos identificados. `read_current_plan` permite revisar el estado que existe antes de modificarlo. `save_plan` recibe un plan que el servidor debe validar antes de devolverlo a la interfaz. Los textos de los avisos se tratan como datos; no como instrucciones para ejecutar acciones.

**Amazon Bedrock es el único servicio AWS previsto.** El servidor se ejecuta localmente. No atribuir al proyecto uso de Lambda, Polly, S3, DynamoDB ni AgentCore. La API [Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) admite conversaciones y uso de herramientas; hay que verificar el modelo, la región, los permisos y una invocación real en la cuenta disponible.

El modo demostración utilizará ejemplos y respuestas preparados, con una etiqueta visible. Servirá para recorrer la experiencia mientras se valida AWS. **Una respuesta preparada no prueba una invocación de Bedrock ni permite evaluar su precisión.**

## Criterios de calidad

- Cada hecho importante debe apuntar a los mensajes que lo sostienen.
- Una corrección explícita debe indicar el valor anterior y el vigente, cuando ambos estén disponibles.
- Dos versiones incompatibles sin resolución clara deben quedar pendientes de confirmar.
- Una sugerencia de preparación debe distinguirse de un requisito escrito por la escuela.
- Fechas relativas deben interpretarse con una fecha de referencia visible. No adivinar una hora que falte.
- Firmas, autorizaciones, pagos y comunicaciones permanecen en la vista del adulto.
- Marcar un objeto confirma una acción del usuario; no demuestra que la mochila física esté completa.
- La demo pública y las pruebas iniciales usan datos ficticios, sin nombres ni conversaciones reales de menores.

## Lo que hace falta para una candidatura defendible

1. Ejecutar y documentar una sesión real de Bedrock con un mensaje distinto de los ejemplos preparados.
2. Comprobar corrección de horario, fuentes, incertidumbre, responsabilidades y exportaciones.
3. Realizar el protocolo con tres personas y registrar resultados reales, incluidos errores.
4. Sustituir los pendientes del artículo con evidencia verificable y añadir una captura o clip.
5. Revisar el perfil de Builder Center, añadir `#agents` y publicar dentro del plazo, con autorización del usuario para publicar.

Según la convocatoria compartida por el usuario, el cierre es el **12 de octubre de 2026 a las 14:00, hora de Ciudad de México**, equivalente a las 20:00 UTC. La página de [la convocatoria](https://builder.aws.com/content/3JnXmg1PikRXrSSDFHWEOw5RAur) es la referencia a comprobar antes del envío. No se ha confirmado cuántas plazas para créditos siguen disponibles.
