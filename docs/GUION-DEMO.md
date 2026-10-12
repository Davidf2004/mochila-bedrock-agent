# MOCHILA — demo de 55 segundos y prueba con tres personas

## Preparación de la grabación

- Usar un hilo ficticio que exista en la aplicación y comprobar sus valores antes de grabar.
- Verificar el nombre exacto de los controles; el guion describe acciones, no exige etiquetas distintas de las implementadas.
- Grabar con la indicación del modo visible. Si se usa una respuesta preparada, decir «demo con ejemplo preparado».
- Para la evidencia del agente AWS, ejecutar el modo real, comprobar la llamada a Bedrock y conservar una captura del resultado. No atribuir la respuesta preparada a AWS.
- Revisar que no aparezcan credenciales, identificadores de cuenta, conversaciones reales de menores ni datos personales.
- Abrir el resultado real antes de preparar la narración definitiva: las cifras y horarios deben coincidir con lo observado.

## Guion principal · 55 segundos

| Tiempo | Acción en pantalla | Narración |
|---|---|---|
| 0–6 s | Pantalla inicial con el lema. | «Son las diez de la noche. El grupo escolar tiene avisos, preguntas y un cambio de última hora. ¿Qué necesita tu hijo mañana?» |
| 6–14 s | Cargar o pegar los avisos ficticios y generar el plan. Mantener visible el modo. | «Esto es MOCHILA: pegas el caos del grupo y preparas un plan para la mañana.» |
| 14–24 s | Mostrar la corrección y abrir el mensaje que la respalda. | «Aquí cambió el horario. MOCHILA muestra el aviso vigente y su fuente, para que puedas comprobarlo.» |
| 24–31 s | Señalar los objetos y la tarea del adulto. | «Estas cosas van en la mochila. Este permiso lo revisa y firma el adulto.» |
| 31–43 s | Pulsar «Lo preparo yo» y marcar un objeto. | «El detalle está aquí: Lo preparo yo. El niño ve pasos sencillos y marca lo que ya preparó.» |
| 43–49 s | Volver a la vista del adulto y mostrar el permiso aún pendiente. | «Preparar las cosas no resuelve la autorización: cada persona conserva su responsabilidad.» |
| 49–55 s | Descargar el texto o el archivo de calendario y cerrar con el lema. | «El plan también se puede descargar. MOCHILA: pega el caos del grupo. Deja lista la mañana.» |

Si la inferencia tarda más que el espacio disponible, incluir un corte visible con la leyenda «Espera de procesamiento recortada». Conservar la medición real. No acelerar una interacción para presentar una latencia inventada.

**Frase obligatoria para una grabación solo de demo:** «Esta es una demo con un ejemplo preparado; la conexión real con Amazon Bedrock se verifica por separado». Se puede incluir al inicio o como rótulo legible durante la escena correspondiente.

## Qué prueba cada pieza de evidencia

| Evidencia | Permite afirmar | No permite afirmar |
|---|---|---|
| Recorrido con ejemplo preparado | Las pantallas e interacciones de ese recorrido funcionan. | El modelo interpretó el texto o la integración AWS funciona. |
| Entrada nueva procesada por Bedrock, con ejecución comprobada | La integración funcionó con esa entrada y configuración. | Precisión general, ausencia de errores o rendimiento en todos los casos. |
| Prueba observada con tres personas | Esas personas completaron o fallaron tareas concretas bajo esas condiciones. | Validación estadística, ahorro generalizado o preferencia de todas las familias. |

## Protocolo real · tres personas · 10–15 minutos por sesión

**Estado: no realizado. No hay participantes, resultados ni testimonios registrados todavía.**

Reclutar tres adultos que participen en la preparación escolar. Identificarlos como P1, P2 y P3 en las notas. Explicar el propósito y pedir permiso antes de grabar o atribuir cualquier comentario. Las pruebas iniciales no requieren reclutar menores ni usar datos reales de sus escuelas.

Usar dos casos ficticios equivalentes, A y B. Ambos deben contener un horario inicial, una corrección explícita, tres objetos, un permiso del adulto y una duda que los mensajes no resuelvan. Cambiar nombres de actividad, objetos y horas entre casos. Preparar la respuesta correcta antes de observar las sesiones. Si el modo preparado solo admite un caso, la evaluación de comprensión de interfaz se hará con ese caso y se declarará la limitación; la evaluación de inferencia requiere entradas nuevas en Bedrock.

### Orden de las tareas

- P1: caso A manual; caso B con MOCHILA.
- P2: caso A con MOCHILA; caso B manual.
- P3: caso B manual; caso A con MOCHILA.

La muestra es pequeña y el orden no queda perfectamente equilibrado. Informar esa limitación y presentar observaciones individuales. No convertir los tiempos de tres personas en una promesa comercial.

### Instrucción que lee el facilitador

«Imagina que estás preparando la salida escolar de mañana. Usa lo que ves para decirme la hora vigente, qué hay que llevar, qué necesita hacer un adulto y qué sigue sin estar claro. Después muéstrame cómo otra persona podría revisar de dónde salió la hora.»

En la condición con MOCHILA añadir: «Ahora prepara uno de los objetos usando la vista Lo preparo yo. Al terminar, dime qué sigue pendiente para el adulto.»

No señalar el botón correcto ni explicar las fuentes antes del primer intento. Si la persona se atasca, registrar el momento y la ayuda proporcionada. Permitir que abandone cualquier tarea.

### Registro por participante

| Dato | P1 | P2 | P3 |
|---|---|---|---|
| Fecha y condiciones de la sesión | Pendiente | Pendiente | Pendiente |
| Orden y casos usados | Pendiente | Pendiente | Pendiente |
| Modo utilizado: preparado / Bedrock | Pendiente | Pendiente | Pendiente |
| Horario vigente correcto sin ayuda | Pendiente | Pendiente | Pendiente |
| Localiza la fuente del cambio sin ayuda | Pendiente | Pendiente | Pendiente |
| Identifica tres objetos y no inventa requisitos | Pendiente | Pendiente | Pendiente |
| Reconoce la duda sin resolver | Pendiente | Pendiente | Pendiente |
| Distingue la autorización del adulto | Pendiente | Pendiente | Pendiente |
| Completa un objeto en «Lo preparo yo» | Pendiente | Pendiente | Pendiente |
| Entiende que el permiso sigue pendiente | Pendiente | Pendiente | Pendiente |
| Tiempo manual hasta plan correcto, segundos | Pendiente | Pendiente | Pendiente |
| Tiempo con MOCHILA hasta plan correcto, segundos | Pendiente | Pendiente | Pendiente |
| Espera de inferencia incluida, segundos | Pendiente | Pendiente | Pendiente |
| Número y tipo de ayudas del facilitador | Pendiente | Pendiente | Pendiente |
| Claridad: 1 muy confuso → 5 muy claro | Pendiente | Pendiente | Pendiente |
| Agrado: 1 desagradable → 5 agradable | Pendiente | Pendiente | Pendiente |
| Comentario literal autorizado, si existe | Pendiente | Pendiente | Pendiente |

Detener el cronómetro cuando el plan sea correcto, no cuando aparezca cualquier respuesta. Si una persona no termina, registrar «no completó» y el tiempo transcurrido; no convertir ese intento en un tiempo exitoso. Medir por separado la espera de inferencia permite interpretar dónde se fue el tiempo.

### Preguntas posteriores, sin inducir una respuesta

1. «¿Qué parte te hizo dudar?»
2. «¿Qué entiendes que pasó cuando marcaste el objeto?»
3. «¿Qué harías después de cerrar esta pantalla?»
4. «¿Qué cambiarías o quitarías?»
5. «¿Usarías esta vista con tu familia? ¿Por qué?»

### Criterios fijados antes de observar

- Los tres participantes deben identificar el horario vigente y la autorización pendiente. Cualquier confusión sobre esos puntos genera un ajuste y una nueva comprobación.
- Al menos dos deben encontrar la fuente sin ayuda. Si no sucede, mejorar su visibilidad y repetir esa tarea.
- Ninguno debe interpretar una sugerencia como obligación escolar ni una marca en pantalla como firma de autorización.
- Registrar las valoraciones de agrado y claridad como respuestas individuales. Dos valoraciones de agrado de 4 o 5 serán una señal inicial favorable, no una demostración de impacto general.
- Si los resultados son mixtos, publicarlos como mixtos y explicar el cambio concreto que motivaron.

## Plantilla para el artículo después de la prueba

«Probé la versión [versión y fecha] con tres personas adultas que [criterio real de selección]. Usamos [casos] en [modo]. [Número observado] identificaron la corrección sin ayuda; [número observado] encontraron su fuente. Al pasar a Lo preparo yo, [observación concreta]. Detecté [problema real] y cambié [modificación comprobable]. La muestra es pequeña y estos resultados describen estas sesiones.»

No pegar esta plantilla sin completar y revisar los datos. Una cita puede incluirse únicamente si ocurrió y la persona autorizó su uso. Si las pruebas no se realizaron a tiempo, informar que la validación con usuarios sigue pendiente.
