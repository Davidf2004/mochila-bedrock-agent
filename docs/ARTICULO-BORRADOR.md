# MOCHILA: del caos del grupo escolar a una mañana lista

> **BORRADOR DE TRABAJO — NO PUBLICAR TODAVÍA.** Pendiente verificar la implementación final, ejecutar una invocación real de Amazon Bedrock, adjuntar evidencia y realizar pruebas con tres personas. Los ejemplos son ficticios. Este texto describe el diseño previsto; no afirma que AWS ya se haya utilizado con éxito ni que existan mejoras medidas. Actualizar los tiempos verbales y los apartados de evidencia después de comprobarlos.

**Etiqueta para Builder Center:** `#agents`

## El problema empieza la noche anterior

Imagina esta escena: mañana hay una excursión. El grupo escolar tiene el aviso inicial, varias preguntas, una corrección de horario y una lista de cosas que hay que llevar. Todo parece estar ahí, pero todavía tienes que reconstruir la respuesta: a qué hora llegar, qué preparar y qué depende de ti.

MOCHILA nace de esa escena. Su propuesta se resume en una frase: **Pega el caos del grupo. Deja lista la mañana.** Es un agente pensado para madres, padres y cuidadores de niños de primaria. Recibe texto que la persona copia de sus avisos escolares y propone un plan que se puede revisar, preparar y compartir mediante una descarga.

La primera versión está enfocada en un momento concreto: organizar el día siguiente. Quiero que alguien pueda abrirla desde el teléfono, entender el plan y empezar a preparar lo necesario sin aprender un sistema de organización nuevo.

## La información importante necesita una fuente

Resumir un hilo no basta cuando contiene cambios. Si el primer aviso dice que la salida es a las ocho y una corrección posterior establece otra hora, una lista que conserve las ocho puede parecer impecable y seguir siendo inútil.

Por eso, el plan de MOCHILA incluye fuentes. Cada acción importante debe permitir volver al mensaje que la respalda. Las correcciones se presentan de forma explícita: qué decía el aviso anterior, qué establece la actualización y de dónde sale el cambio. El ejemplo de la demo es ficticio y contendrá esta situación para que cualquier persona pueda comprobarla.

También hay una diferencia entre una corrección clara y una contradicción sin resolver. Cuando los mensajes no permiten decidir, el diseño prevé mostrar una duda pendiente. Una hora ausente debe seguir ausente. Una recomendación práctica debe distinguirse de algo que la escuela exigió. La confianza que buscamos depende de que el usuario pueda revisar esas diferencias.

## Cómo está planteada la construcción

La interfaz utiliza HTML, CSS y JavaScript. El servidor se ejecuta localmente con Node.js y la integración prevista utiliza el AWS SDK para llamar a Amazon Bedrock mediante Converse. Amazon Bedrock es el único servicio de AWS incluido en esta arquitectura.

Converse proporciona una interfaz de mensajes para modelos compatibles y permite incorporar herramientas. Esto encaja con un agente que necesita consultar información y actualizar un estado estructurado. La región, el modelo compatible y los permisos se verificarán en la cuenta disponible antes de describir una ejecución como completada. La documentación de [Amazon Bedrock Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) es la referencia técnica para esa integración.

El agente dispone de tres herramientas definidas para el producto. `read_messages` entrega los avisos con sus identificadores. `read_current_plan` devuelve el plan existente para que una actualización tenga contexto. `save_plan` recibe la propuesta que deberá validar el servidor antes de presentarla.

El propósito de esas herramientas es hacer que el agente trabaje sobre información concreta. El flujo debe conservar las fuentes, separar las responsabilidades y permitir reconstruir por qué cambió un elemento. El texto pegado por el usuario se trata como información de entrada, aunque contenga frases que parezcan instrucciones dirigidas al modelo.

La interfaz incluye un modo de demostración con ejemplos preparados y una etiqueta visible. Ese modo permite revisar las pantallas y las interacciones mientras se habilita la conexión real. Sus resultados no son evidencia de razonamiento en Amazon Bedrock. Para verificar el agente hará falta procesar entradas nuevas y documentar la ejecución real.

## El detalle agradable: «Lo preparo yo»

Mi apuesta para que MOCHILA resulte agradable es un botón: **Lo preparo yo**. Al activarlo, la lista cambia a una experiencia que el niño puede recorrer con apoyo de su familia. En lugar de leer todo el hilo escolar, encuentra acciones pequeñas y concretas relacionadas con sus cosas.

La persona puede marcar un objeto conforme lo prepara. Ese gesto tiene una finalidad clara: convertir información en una acción que termina. La interfaz infantil debe tener poco texto, controles fáciles de tocar y una respuesta visible cuando se completa cada paso.

Al mismo tiempo, las responsabilidades del adulto permanecen separadas. Firmar una autorización, comprobar un pago o resolver una duda con la escuela no se convierte en una tarea infantil. Completar los objetos del niño tampoco significa que el permiso ya esté firmado. Esta separación forma parte del detalle que queremos evaluar.

La hipótesis es que el cambio de vista ayuda a repartir la preparación y hace el proceso más comprensible. Todavía no hay resultados que permitan afirmar que reduce estrés, ahorra tiempo o aumenta autonomía. Esas son preguntas para la evaluación, no conclusiones del prototipo.

## Cómo voy a comprobar si funcionó

La prueba prevista incluye tres personas adultas que participen habitualmente en la preparación escolar. Cada una realizará un caso manual y un caso equivalente con MOCHILA, alternando el orden para reducir el efecto de aprendizaje. Utilizaremos avisos ficticios y registraremos tanto los aciertos como los errores.

Las tareas son identificar el horario vigente, encontrar la fuente que lo confirma, distinguir lo que corresponde al adulto y preparar un elemento desde la vista «Lo preparo yo». Mediremos el tiempo hasta llegar a un plan correcto, las ayudas necesarias y una valoración de claridad y agrado. Preguntaremos también qué les hizo dudar.

Tres participantes ofrecen señales cualitativas y permiten detectar problemas evidentes; no representan a todas las familias. Un buen resultado sería que comprendieran la corrección y la separación de responsabilidades sin explicación del facilitador. Si alguien interpreta que el permiso está resuelto al completar la mochila, habrá que corregir la interfaz y repetir esa parte de la prueba.

**Resultados pendientes:** número de participantes que completaron cada tarea, tiempos observados, comentarios con consentimiento y cambios realizados a partir de sus dificultades. Antes de publicar sustituiré este apartado por lo que realmente ocurrió, sin rellenarlo con resultados supuestos.

## Una salida útil y un alcance deliberado

El plan se podrá descargar como texto y sus eventos como archivo `.ics`. Así, la persona decide qué compartir o importar en su calendario. La entrada inicial es texto pegado manualmente; la propuesta no presupone una conexión automática con grupos de WhatsApp.

Ya existen productos en este espacio. [Dobbie AI](https://dobbieai.com/) presenta organización de avisos escolares, y [My School Agent](https://myschoolagent.com/features) ofrece calendarios y resúmenes para familias. MOCHILA explora una combinación concreta: cambios explicados con evidencia y una transición de la revisión del adulto a la preparación del niño. La prueba con personas deberá decirnos si esa combinación merece seguir desarrollándose.

## Prueba de funcionamiento que falta adjuntar

**Pendiente:** añadir aquí una captura, un clip corto o un enlace accesible al agente. La evidencia debe enseñar una ejecución real con Amazon Bedrock, la corrección del aviso, su fuente y la transición a «Lo preparo yo». Si además se muestra el modo preparado, se identificará como demo.

También registraré el modelo y la región efectivamente utilizados, la fecha de la prueba y las limitaciones observadas. Esos datos permitirán distinguir una arquitectura propuesta de una integración comprobada.

El criterio para dar esta primera versión por terminada es sencillo: una persona debe poder pasar de avisos dispersos a un plan revisable, entender qué cambió y saber quién prepara cada cosa. Si conseguimos que ese momento sea claro y agradable, tendremos una buena razón para construir la siguiente versión.

---

## Control editorial antes de publicar

- [ ] Revisar el texto contra la versión final de la aplicación; quitar funciones que no existan.
- [ ] Verificar Bedrock con una entrada nueva y documentar modelo, región y fecha.
- [ ] Reemplazar la sección de evaluación por observaciones reales de tres personas.
- [ ] Adjuntar una prueba de funcionamiento que el lector pueda abrir.
- [ ] Quitar el aviso de borrador solo cuando los pendientes estén resueltos.
- [ ] Completar perfil de Builder Center: imagen, país y sección About.
- [ ] Añadir la etiqueta `#agents` en el artículo publicado.
- [ ] Revisar [la convocatoria](https://builder.aws.com/content/3JnXmg1PikRXrSSDFHWEOw5RAur) y su plazo antes del envío. La copia compartida por el usuario pide al menos 500 palabras.
- [ ] Obtener la autorización del usuario para la publicación externa.

**Extensión comprobada:** 1,195 palabras en el cuerpo principal, contando las unidades separadas por espacios entre «El problema empieza la noche anterior» y este control editorial. Contar de nuevo después de sustituir los pendientes. No usar este borrador como afirmación de candidatura enviada o calificada.
