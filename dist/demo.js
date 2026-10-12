export const demoText = `[18:05] Mamá de Leo: ¿Mañana necesitan cuaderno o sólo mochila?
[18:07] Profe Ana: Familias de 2.º B: mañana martes 13 de octubre tenemos excursión. Lleguen a la escuela a las 8:15. Cada niña y niño debe llevar botella de agua, lunch y cuaderno.
[18:09] Profe Ana: Recuerden traer el permiso firmado. La gorra todavía no está confirmada, se los aviso.
[18:12] Papá de Nico: Yo creo que nos dijeron 8:30, ¿no?
[18:15] Mamá de Leo: ¡Gracias, profe!`;

export const correctionText = `[19:02] Profe Ana: Actualización oficial para la excursión de mañana: lleguen a la escuela a las 7:45 (reemplaza las 8:15). La gorra es opcional. Lo demás sigue igual.`;

const messages = demoText.split('\n').map((text, index) => ({ id: index + 1, text }));
const items = [
  { id: 'agua', label: 'Botella de agua', kind: 'pack', required: 'required', evidence: [2] },
  { id: 'lunch', label: 'Lunch', kind: 'pack', required: 'required', evidence: [2] },
  { id: 'cuaderno', label: 'Cuaderno', kind: 'pack', required: 'required', evidence: [2] },
  { id: 'permiso', label: 'Permiso firmado', kind: 'prepare', required: 'required', evidence: [3] },
  { id: 'gorra', label: 'Gorra', kind: 'wear', required: 'unclear', evidence: [3] },
];

export const initialDemo = {
  plan: {
    title: 'Excursión de 2.º B', child: 'Leo', date: '2026-10-13', arrivalTime: '08:15',
    summary: 'Una excursión, cuatro cosas confirmadas y una duda por resolver. La hora de llegada la indicó la docente.',
    items,
    changes: [],
    questions: [{ question: '¿La gorra será necesaria? La docente todavía no lo confirma.', evidence: [3] }],
  },
  messages,
  trace: [
    { tool: 'read_messages', status: 'success', detail: 'En este ejemplo, el aviso de la docente del mensaje 2 indica 8:15. La suposición de 8:30 del mensaje 4 no lo sustituye.' },
    { tool: 'read_current_plan', status: 'success', detail: 'Es la primera lista del recorrido; todavía no hay una versión anterior.' },
    { tool: 'save_plan', status: 'success', detail: 'La respuesta preparada conserva las fuentes y deja la gorra pendiente de confirmación.' },
  ],
};

export const correctedDemo = {
  plan: {
    ...initialDemo.plan,
    arrivalTime: '07:45',
    summary: 'La docente actualizó la llegada a las 7:45 y confirmó que la gorra es opcional. Lo que ya preparaste sigue marcado.',
    items: items.map(item => item.id === 'gorra' ? { ...item, required: 'optional', evidence: [6] } : { ...item }),
    changes: [
      { before: 'Llegar a las 8:15', after: 'Llegar a las 7:45', evidence: [2, 6] },
      { before: 'Gorra por confirmar', after: 'Gorra opcional', evidence: [3, 6] },
    ],
    questions: [],
  },
  messages: [...messages, { id: 6, text: correctionText }],
  trace: [
    { tool: 'read_messages', status: 'success', detail: 'En este ejemplo, el mensaje 6 es una actualización explícita de la docente.' },
    { tool: 'read_current_plan', status: 'success', detail: 'La versión anterior tenía llegada a las 8:15 y gorra pendiente de confirmar.' },
    { tool: 'save_plan', status: 'success', detail: 'La respuesta preparada cambia la llegada a 7:45 y la gorra a opcional; conserva los demás elementos y sus fuentes.' },
  ],
};
