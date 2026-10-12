## El problema empieza la noche anterior

Imagina esta escena: mañana hay una excursión. El grupo escolar tiene el aviso inicial, varias preguntas, una corrección de horario y una lista de cosas que hay que llevar. Todo parece estar ahí, pero todavía tienes que reconstruir la respuesta: a qué hora llegar, qué preparar y qué depende de ti.

MOCHILA nace de esa escena. Su propuesta se resume en una frase: **Pega el caos del grupo. Deja lista la mañana.** Es un agente pensado para madres, padres y cuidadores de niños de primaria. Recibe texto que la persona copia de sus avisos escolares y propone un plan que se puede revisar, preparar y compartir mediante una descarga.

La primera versión está enfocada en un momento concreto: organizar el día siguiente. Quiero que alguien pueda abrirla desde el teléfono, entender el plan y empezar a preparar lo necesario sin aprender un sistema de organización nuevo.

## La información importante necesita una fuente

Resumir un hilo no basta cuando contiene cambios. Si el primer aviso dice que la salida es a las ocho y una corrección posterior establece otra hora, una lista que conserve las ocho puede parecer impecable y seguir siendo inútil.

Por eso, el plan de MOCHILA incluye fuentes. Cada acción importante debe permitir volver al mensaje que la respalda. Las correcciones se presentan de forma explícita: qué decía el aviso anterior, qué establece la actualización y de dónde sale el cambio. El ejemplo de la demo es ficticio y contiene esta situación para que cualquier persona pueda comprobarla.

También hay una diferencia entre una corrección clara y una contradicción sin resolver. Cuando los mensajes no permiten decidir, el diseño prevé mostrar una duda pendiente. Una hora ausente debe seguir ausente. Una recomendación práctica debe distinguirse de algo que la escuela exigió. La confianza que buscamos depende de que el usuario pueda revisar esas diferencias.

## Cómo está planteada la construcción

La interfaz utiliza HTML, CSS y JavaScript. El servidor se ejecuta localmente con Node.js y utiliza el AWS SDK para llamar a Amazon Bedrock mediante Converse. Amazon Bedrock es el único servicio de AWS incluido en esta arquitectura. La demo estática está desplegada con Sites para poder compartir y revisar la experiencia; ese alojamiento no sustituye la inferencia de Bedrock.

Converse proporciona una interfaz de mensajes para modelos compatibles y permite incorporar herramientas. Esto encaja con un agente que necesita consultar información y actualizar un estado estructurado. El 11 de octubre de 2026 comprobé el recorrido completo en `us-east-1` con `amazon.nova-lite-v1:0` y una clave de Bedrock de corta duración. La documentación de [Amazon Bedrock Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) es la referencia técnica para esa integración.

El agente dispone de tres herramientas definidas para el producto. `read_messages` entrega los avisos con sus identificadores. `read_current_plan` devuelve el plan existente para que una actualización tenga contexto. `save_plan` recibe la propuesta que deberá validar el servidor antes de presentarla.

El propósito de esas herramientas es hacer que el agente trabaje sobre información concreta. El flujo conserva las fuentes, separa las responsabilidades y permite reconstruir por qué cambió un elemento. El texto pegado por el usuario se trata como información de entrada, aunque contenga frases que parezcan instrucciones dirigidas al modelo. El servidor acepta únicamente planes que pasan una validación estructural y limita el recorrido a siete llamadas al modelo y siete herramientas. Eso permite comprobar que las referencias existen; la interpretación semántica sigue necesitando revisión humana.

La interfaz incluye un modo de demostración con ejemplos preparados y una etiqueta visible. Ese modo permite revisar las pantallas y las interacciones sin consumir inferencia y no se presenta como razonamiento de Amazon Bedrock. Las pruebas automatizadas cubren el recorrido de herramientas, la reparación de una cita inválida, los límites, los errores del proveedor y las protecciones del servidor: las 14 pruebas actuales pasan. Además, procesé una entrada nueva en Bedrock para comprobar el recorrido real desde el formulario hasta la tarjeta validada.

## El detalle agradable: «Lo preparo yo»

Mi apuesta para que MOCHILA resulte agradable es un botón: **Lo preparo yo**. Al activarlo, la lista cambia a una experiencia que el niño puede recorrer con apoyo de su familia. En lugar de leer todo el hilo escolar, encuentra acciones pequeñas y concretas relacionadas con sus cosas.

La persona puede marcar un objeto conforme lo prepara. Ese gesto tiene una finalidad clara: convertir información en una acción que termina. La interfaz infantil debe tener poco texto, controles fáciles de tocar y una respuesta visible cuando se completa cada paso.

Al mismo tiempo, las responsabilidades del adulto permanecen separadas. Firmar una autorización, comprobar un pago o resolver una duda con la escuela no se convierte en una tarea infantil. Completar los objetos del niño tampoco significa que el permiso ya esté firmado. Esta separación forma parte del detalle que queremos evaluar.

La hipótesis es que el cambio de vista ayuda a repartir la preparación y hace el proceso más comprensible. Todavía no hay resultados que permitan afirmar que reduce estrés, ahorra tiempo o aumenta autonomía. Esas son preguntas para la evaluación, no conclusiones del prototipo.

## Cómo comprobé el detalle

Preparé un caso reproducible con avisos ficticios: un horario inicial, una corrección posterior, varios objetos para el niño y una autorización que corresponde a una persona adulta. Marqué un objeto, abrí sus fuentes, activé «Lo preparo yo» y volví a la vista familiar.

La interacción conservó el objeto marcado al cambiar de vista, mostró el horario corregido junto al anterior y mantuvo la autorización fuera de la lista infantil. Es la evidencia funcional de que el detalle hace lo que diseñé: entrega al niño una parte concreta de la preparación sin esconderle a la familia lo que sigue pendiente.

Eso demuestra el comportamiento, no que todas las familias lo consideren agradable. Una siguiente evaluación deberá observar a familias usando sus propios avisos, con consentimiento, y medir comprensión, errores y tiempo. Para esta participación prefiero mostrar una prueba pequeña y honesta antes que inventar validación de usuarios.

## Una salida útil y un alcance deliberado

El plan se puede copiar o descargar como texto, y la hora de llegada se exporta como archivo `.ics`. Así, la persona decide qué compartir o importar en su calendario. La entrada inicial es texto pegado manualmente; el prototipo no se conecta automáticamente con grupos de WhatsApp.

Ya existen productos en este espacio. [Dobbie AI](https://dobbieai.com/) presenta organización de avisos escolares, y [My School Agent](https://myschoolagent.com/features) ofrece calendarios y resúmenes para familias. MOCHILA explora una combinación concreta: cambios explicados con evidencia y una transición de la revisión del adulto a la preparación del niño. La prueba con personas deberá decirnos si esa combinación merece seguir desarrollándose.

## Prueba de funcionamiento

La captura de MOCHILA incluida en este artículo muestra una ejecución reproducible con mensajes ficticios. El recorrido presenta el cambio de llegada de 8:15 a 7:45, abre ambos avisos como evidencia, conserva los objetos ya marcados y permite pasar a «Lo preparo yo» sin ocultar las responsabilidades pendientes del adulto.

En la prueba real del 11 de octubre utilicé tres mensajes distintos de los de la demo: un aviso de entrada a las 8:10, una especulación de un familiar sobre las 8:30 y una corrección oficial a las 7:50. El agente mostró el cambio de 8:10 a 7:50, mantuvo la gorra como opcional y creó acciones para la botella, la playera y el permiso firmado. La interfaz identificó el resultado como «Generado con Amazon Bedrock».

La ejecución también dejó dos límites visibles: el modelo citó más mensajes de los necesarios en algunos objetos y formuló una pregunta cautelosa sobre una hora que ya tenía corrección oficial. Afiné la instrucción para desalentar ambas conductas, pero mantengo la revisión humana y las fuentes visibles porque una validación estructural no prueba por sí sola que cada conclusión sea correcta. El enlace público permite que los evaluadores repitan el recorrido completo de la demo.

El criterio para dar esta primera versión por terminada es sencillo: una persona debe poder pasar de avisos dispersos a un plan revisable, entender qué cambió y saber quién prepara cada cosa. Si conseguimos que ese momento sea claro y agradable, tendremos una buena razón para construir la siguiente versión.


#agents
