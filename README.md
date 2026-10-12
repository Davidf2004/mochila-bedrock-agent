# MOCHILA

**Pega el caos del grupo. Deja lista la mañana.**

Un agente para familias que transforma mensajes escolares en una tarjeta con lo que hay que llevar, preparar y confirmar. Cada requisito enlaza a su fuente. El modo «Lo preparo yo» permite al niño preparar sus cosas y conserva las firmas y decisiones en la vista del adulto.

## Dos modos, explícitos

- **Demo guiada:** un ejemplo ficticio reproducible, sin llamadas a modelos. Permite explorar una corrección de horario, referencias, checklist, modo niño y exportaciones. La demo publicada utiliza este modo.
- **Agente con Bedrock:** el servidor local invoca Amazon Bedrock mediante Converse y permite al modelo consultar mensajes, comparar el plan anterior y guardar una tarjeta validada. El recorrido real se comprobó el 11 de octubre de 2026 con Amazon Nova Lite en `us-east-1`.

La [demo pública en Netlify](https://mochila-bedrock-agent.netlify.app) muestra el recorrido guiado. No aloja el servidor Node ni recibe credenciales AWS. El servidor local sirve la misma interfaz junto con `/api/status` y `/api/plan`.

## Ejecutar localmente

Requiere Node 22 o posterior.

```sh
npm install
npm start
```

Abrir `http://127.0.0.1:8787`. El ejemplo guiado funciona sin configurar AWS.

## Activar Amazon Bedrock

Usar un perfil AWS existente autorizado, o una clave de Bedrock de corta duración. Copiar `.env.example` a `.env` y completar únicamente la opción elegida. `.env` está excluido de Git. No colocar secretos en `dist/`.

Valores de configuración:

| Variable | Uso |
| --- | --- |
| `AWS_REGION` | Región del modelo y las credenciales; predeterminada `us-east-1` |
| `BEDROCK_MODEL_ID` | Modelo con soporte Converse y herramientas; predeterminado `amazon.nova-lite-v1:0` |
| `AWS_PROFILE` | Nombre de un perfil ya configurado, cuando corresponda |
| `AWS_BEARER_TOKEN_BEDROCK` | Alternativa: clave corta de Bedrock, solo en el servidor |
| `PORT` | Puerto local; predeterminado `8787` |

Reiniciar `npm start` después de configurar. Que se detecte configuración no demuestra que el acceso sea válido: la primera petición real confirmará permisos y disponibilidad del modelo en esa región.

Converse necesita `bedrock:InvokeModel`. El acceso por token puede requerir también `bedrock:CallWithBearerToken`. No se crean usuarios IAM, permisos o claves automáticamente. Las peticiones reales de inferencia pueden tener coste en AWS.

## Qué hace el agente

1. El servidor convierte las líneas pegadas en mensajes numerados y valida la entrada.
2. El modelo consulta las herramientas `read_messages` y `read_current_plan`.
3. Resuelve requisitos y correcciones; conserva como pregunta aquello que no puede establecer.
4. La herramienta `save_plan` valida estructura, fecha, hora, límites e identificadores de fuentes.
5. Solo un plan guardado correctamente llega al navegador. No hay respuestas prefabricadas como sustituto de una inferencia fallida.

Las correcciones requieren el historial completo: al actualizar, los mensajes originales y nuevos deben permanecer en el campo de texto. Un mensaje reciente no tiene automáticamente más autoridad. Las etiquetas de remitente son aportadas por quien pega el texto; la app no verifica identidades de WhatsApp.

La validación asegura que existen las fuentes citadas; no prueba por sí sola que cada conclusión del modelo esté respaldada semánticamente. Por eso cada referencia es revisable y la evaluación con Bedrock sigue siendo necesaria.

## Datos y límites

La demo usa mensajes ficticios. En modo real, los mensajes se envían a Amazon Bedrock al solicitar el plan. El servidor no escribe conversaciones a archivos ni imprime su contenido. El navegador conserva el progreso del checklist localmente; no existe sincronización entre personas ni conexión directa a WhatsApp.

El calendario se descarga como archivo para que el usuario lo importe; no modifica su calendario automáticamente. No se envían mensajes a docentes o familias.

## Validación y reto

```sh
npm test
```

Las pruebas automáticas usan una respuesta de modelo simulada para comprobar herramientas y validación. La integración también se probó con Amazon Bedrock; ninguna de las dos sustituye una evaluación con familias.

- [Concepto](docs/CONCEPTO.md)
- [Guion de demo y evaluación](docs/GUION-DEMO.md)
- [Artículo final](docs/ARTICULO-FINAL.md)

La participación está publicada en [AWS Builder Center](https://builder.aws.com/content/3KZe3qPzf2DX81Kfs5KaQ6DYp45/mochila-del-caos-del-grupo-escolar-a-una-manana-lista). Incluye la prueba pública, 1,373 palabras y la etiqueta `#agents`; el perfil requerido también está completo.

## Referencias

- [Convocatoria AWS](https://builder.aws.com/content/3JnXmg1PikRXrSSDFHWEOw5RAur)
- [Converse y herramientas](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html)
- [Claves de Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html)
