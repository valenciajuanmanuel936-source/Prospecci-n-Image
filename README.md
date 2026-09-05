# Copiloto de Setting y Prospección — IMAGE

Aplicación web **independiente** para que Mireya y Juan Manuel gestionen el setting y la
prospección B2C del programa **IMAGE** desde Instagram. El copiloto guía cada conversación fase por
fase, sugiere el mensaje exacto según el nivel de cercanía y recomienda la siguiente acción —
**entender antes de vender, sin fabricar necesidad**.

> El "análisis" es **determinista**: las recomendaciones salen de las señales que marca la usuaria y
> de un motor de reglas y plantillas. **No hay IA** conectada en el MVP.

> **Independiente por diseño.** Esta app no comparte datos, almacenamiento ni configuración con
> ninguna otra marca. Usa su propio namespace de `localStorage` (`copiloto_image_v1`), su propio
> esquema y su propio despliegue. La importación de respaldos rechaza archivos de otra marca.

---

## 1. Propósito

IMAGE es un programa integral de transformación personal (físico, hábitos y psicología/rendimiento).
La app ayuda a: encontrar y registrar prospectos, abrir conversaciones naturalmente, entender el
motivo real, descubrir la situación y el problema, medir impacto, resultado deseado, brecha,
intención y momento, evaluar el fit, y **llevar a llamada solo a los prospectos adecuados**, con
seguimiento y registro de resultados comerciales.

Principios que el motor respeta: no asumir que alguien necesita IMAGE, no fabricar urgencia ni dolor,
no confundir interacción con intención de compra, máximo una pregunta principal por mensaje, y
preferir perder una venta antes que fabricar necesidad. Ante una condición médica o psicológica
delicada, la app **no diagnostica ni sigue vendiendo**: recomienda cuidar a la persona y escalar.

## 2. Stack

- **Next.js 14** (App Router) + **React 18**
- **TypeScript** (estricto) · **Tailwind CSS** · **lucide-react**
- **Vitest** (pruebas del motor y del almacenamiento)
- Persistencia en **localStorage** (namespace `copiloto_image_v1`), sin base de datos ni
  autenticación en el MVP.
- Interfaz 100% en español, responsive (sidebar en escritorio, navegación inferior en móvil).

## 3. Requisitos

- **Node.js 18.18+** (recomendado 20 o 22 LTS) y **npm**.

## 4. Instalación

```bash
npm install
```

## 5. Variables de entorno

El MVP **no requiere variables de entorno**. (La sección 12 explica cómo añadirlas al migrar a
Supabase.)

## 6. Ejecución local

```bash
npm run dev
```

Abre http://localhost:3000.

## 7. Pruebas

```bash
npm run test
```

Cubren, entre otros: no avanzar sin respuesta, no inventar problemas, no confundir interacción con
intención, no proponer llamada demasiado pronto, profundización, variable faltante, mensajes por
cercanía, protocolo de identidad, alertas de salud, no recomendar seguimientos indefinidos,
persistencia (export/import), cálculo de métricas, diferenciación de facturación vs dinero cobrado y
el aislamiento del almacenamiento de IMAGE.

## 8. Calidad

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # build de producción
npm start           # sirve el build
```

## 9. Despliegue en Vercel (proyecto SEPARADO)

Esta app se despliega como un proyecto de Vercel **distinto** al de cualquier otra marca.

Desde la interfaz web (recomendado):

1. Sube **solo esta carpeta** (`Copiloto IMAGE`) a su propio repositorio de Git.
2. En https://vercel.com → **Add New → Project**, importa ese repositorio.
3. Vercel detecta Next.js. Deja los valores por defecto (Build: `next build`). Sin variables de
   entorno.
4. **Deploy**. Obtendrás una URL propia (p. ej. `https://copiloto-image.vercel.app`).

> Si prefieres un solo repositorio con varias apps, usa **Root Directory** en Vercel apuntando a la
> carpeta de IMAGE y crea un proyecto independiente por cada marca. Nunca compartas el mismo proyecto
> de Vercel entre marcas.

CLI:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # producción
```

## 10. Dónde se guardan los datos

En el **localStorage del navegador**, bajo la clave exclusiva `copiloto_image_v1`, con
**autoguardado**. Los datos son locales a ese navegador; no se envían a ningún servidor y no se
comparten con ninguna otra aplicación.

## 11. Respaldo (exportar / importar)

En **Configuración → Respaldo de datos**: Exportar JSON (respaldo completo), Exportar CSV
(prospectos, con columnas separadas de facturación contratada y dinero cobrado) e Importar JSON. La
importación **valida el formato, rechaza archivos de otra marca** y pide confirmación antes de
reemplazar.

## 12. Limitaciones reales del MVP

- Datos solo en el navegador donde se usan: **no se sincronizan** entre dispositivos ni usuarios (el
  respaldo JSON permite moverlos).
- **Sin autenticación**.
- El temporizador avanza mientras la app está abierta; si se cierra "en curso", al reabrir recalcula
  desde la marca de inicio guardada.
- Sin integración con la API de Instagram: los mensajes se copian y pegan a mano.
- El análisis es por señales/reglas; no interpreta texto libre.

## 13. Migración futura a Supabase

La capa de datos está aislada en `src/lib/storage.ts` y expuesta por `src/lib/store.tsx`. Reescribe
`cargarDatos`, `guardarDatos` y las mutaciones del store para usar Supabase (manteniendo las mismas
firmas). Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` y en
Vercel. Los tipos de `src/lib/types.ts` sirven como contrato del esquema. **Usa un proyecto de
Supabase propio de IMAGE**, separado de cualquier otra marca.

## 14. Conectar IA en el futuro (sin alterar el motor base)

El motor determinista (`src/lib/rules-engine.ts`) produce un objeto `Recomendacion`. Para sumar IA,
crea una capa opcional que reciba el texto de la respuesta y devuelva **señales sugeridas**
(`Senal[]`); esas señales alimentan el mismo motor. Así la lógica de setting sigue siendo
predecible y auditable. La API key va como variable de entorno del lado servidor (nunca
`NEXT_PUBLIC_`), llamada desde un Route Handler.

---

## Estructura del código

```
src/
  app/
    page.tsx                "Hoy" (sesión, temporizador, checklist de 5 bloques)
    prospectos/             Lista y detalle ([id])
    nueva-conversacion/     Asistente por pasos + Modo rápido
    pipeline/               Tablero por etapa comercial
    seguimientos/           Vencidos / hoy / próximos / sin fecha / último intento
    metricas/               Métricas, embudo, fuentes, motivos de pérdida, aprendizajes
    biblioteca/             Plantillas (filtros, favoritos, CRUD)
    configuracion/          Datos comerciales editables, protocolo, respaldo, demo
  components/               UI, AppShell, formularios, panel de recomendación
  lib/
    types.ts                Tipos y catálogos (26 fases, 18 estados, 14 tipos)
    seed.ts                 Datos iniciales y prospectos demo (ficticios)
    rules-engine.ts         Motor de reglas (funciones puras y testeables)
    messages.ts             Aperturas, preguntas por fase, seguimientos
    metrics.ts              Métricas, embudo, fuentes, motivos de pérdida
    storage.ts              Persistencia (localStorage) + export/import
    store.tsx               Contexto global + autoguardado
    utils.ts                Utilidades
    __tests__/              Pruebas del motor y del almacenamiento
```

Funciones clave del motor: `getRecommendedPhase`, `getMissingVariable`, `getEvidence`,
`hasFullEvidence`, `getRecommendedDecision`, `getMessageSuggestions`, `calculateTemperature`,
`getIdentityWarning`, `getHealthAlert`, `getFollowUpStatus`, y el orquestador `buildRecommendation`.

## Metodología de setting (flujo)

Apertura contextual → rapport → motivo/interés → situación actual → problema → profundización →
impacto/costo → resultado deseado → brecha → intentos anteriores → intención → momento → fit →
transición a llamada → llamada → seguimiento → resultado comercial.

## Nota sobre identidad y datos comerciales

Toda la información comercial (duración, precio, cuotas, entregables, equipo, enlace de agenda,
criterios de fit y de exclusión, metas) es **editable en Configuración** y no está codificada. Cuando
alguien pregunta con quién habla, pide audio/llamada o quiere negociar, la app recomienda que Mireya
se identifique como socia de Juan Manuel y parte del equipo de IMAGE, o que escale la conversación —
nunca hacerse pasar por él ni inventar condiciones.
