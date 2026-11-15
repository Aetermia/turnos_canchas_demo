# Dirección visual

> Reading this as: booking board for a neighbourhood sports club, in a printed fixture-board language, dial ENERGY 2 / RHYTHM 1 / MOTION 1.

El principio que ordena todo: **la información es el diseño**. La portada no vende el club, muestra qué se puede jugar hoy y a qué hora. El tablero ocupa el lugar del hero porque el visitante vino a ver turnos, no a leer un eslogan.

## Por qué se abandonó la dirección anterior

La primera versión usaba papel crema `#f7f4ee`, verde bosque `#12503c`, terracota `#a9491f`, Bricolage Grotesque sobre Instrument Sans y un hero de kicker + título + dos botones + dos métricas. Esa combinación es la firma visual que la IA repite en 2025: se reconoce como "cálido y premium" sin decir nada del producto. Aplicado el test de identidad (cambiar logo y nombre, ver si el sitio sigue siendo de alguien), fallaba. Se reemplaza en lugar de retocarse.

## Dials

| Dial | Valor | Consecuencia verificable |
|---|---|---|
| ENERGY | 2 | Saluda con una banda de fecha y un título corto, no con una portada. |
| RHYTHM | 1 | Uniformidad deliberada: el tablero es una grilla y se respeta de punta a punta. Las secciones de abajo son tablas, no tarjetas. |
| MOTION | 1 | Solo estados de hover y foco. Sin reveal, sin parallax, sin transiciones de más de 120 ms. |

RHYTHM 1 es una decisión, no un descuido: un tablero de turnos se lee como una planilla impresa, y variar la composición por sección rompería la lectura en columnas.

## Paleta

| Token | Valor | Función | Razón |
|---|---|---|---|
| `--color-paper` | `#eeeee9` | Fondo | Neutro frío de papel de plano, no crema. Deja el amarillo y el azul limpios. |
| `--color-paper-sunk` | `#e2e2db` | Bandas y pie | Un paso de gris para separar sin bordes extra. |
| `--color-ink` | `#14161a` | Texto y estructura | Casi negro frío. Sostiene la retícula: las líneas del tablero son tinta, no gris. |
| `--color-ink-soft` | `#4d5057` | Texto secundario | 6.94:1 sobre papel. |
| `--color-line` | `#b8b9b2` | Líneas internas | Delimita celdas sin competir con la tinta. |
| `--color-brand` | `#0f3350` | Azul cancha: cabecera del tablero, enlaces, foco | Es el color de la cancha de pádel y el de la señalética deportiva impresa. 11.21:1 sobre papel y sobre él. |
| `--color-accent` | `#f0b429` | Amarillo señal: turno libre, acción de reservar | Único acento, y sólo donde hay una acción o un turno disponible. Sobre él va tinta, nunca papel: 9.72:1. |

Tres colores con función más dos neutros. Ninguno cumple un rol decorativo.

El acento es configurable por instalación, así que el texto que va encima se calcula en el servidor (`EstablishmentSetting::accentInk()`): si el acento elegido es claro, el texto pasa a tinta. Un cliente puede poner el amarillo que quiera sin romper el contraste.

## Tipografía

Una sola familia: **Archivo**, en 400, 600 y 700, con cifras tabulares.

- Razón: es un grotesco industrial derivado de la señalética y el marcador deportivo. Tiene cifras de ancho fijo, que es exactamente lo que un tablero necesita para alinear horas y precios en columna.
- Una sola familia, no una dupla display + body: el apareo de dos fuentes "con personalidad" es parte del repertorio que hace que un sitio se lea como generado. La jerarquía se hace con tamaño, peso y mayúsculas, no con una segunda fuente.
- Mayúsculas con tracking normal (`0`), nunca abierto: los títulos de sección son etiquetas de cartel, no "eyebrows" decorativos.

## Forma y motivo

- Radio de 2 px (`--radius-control`, `--radius-card`). Nada de píldoras ni tarjetas infladas: los bordes son rectos como en una planilla.
- Sin sombras. La jerarquía la hace la retícula: línea de tinta para el marco, línea gris para las divisiones internas.
- **Motivo de identidad**: la celda del tablero. Un rectángulo con borde de 1 px, relleno amarillo cuando el turno está libre, rayado cuando está tomado. Se repite en la portada, en el calendario del panel y en los estados del turno, que es donde el producto realmente vive.

## Aplicación

- Portada: banda de fecha + título + tablero + leyenda, después tarifas, horarios y contacto como tablas de dos columnas.
- Reserva: el mismo tablero en formato de lista de turnos, con la cancha y el día elegidos visibles arriba.
- Panel: hereda tokens, tipografía y radio. Sigue siendo un panel de gestión, pero deja de ser un dashboard de tarjetas: los números son filas de una tabla, no tarjetas flotantes.

## Lo que no se hace

- Sin degradados, sin glassmorphism, sin glow, sin iconos decorativos. No hay ningún icono en la interfaz: las etiquetas alcanzan y no suman ruido.
- Sin testimonios, sin "confían en nosotros", sin números que no vengan de la base.
- Sin animaciones de entrada.
