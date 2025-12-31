
# Barista Mode 2.0 - Implementation Plan

## 1. UI/UX Fixes (Contrast)

- **Target**: Method Selection Buttons.
- **Rules**:
  - **Active**: Background Black (#000) -> Text White (#FFF).
  - **Inactive**: Background White (#FFF) -> Text Black (#000).
  - **Hover**: Inactive buttons should turn Black with White text.

## 2. CEO Strategy: Content & Conversion

- **New Section: "La Enciclopedia del Grano"**:
  - Cards explaining major varieties: Geisha, Bourbon, Caturra, Pacamara.
  - Each card includes: Origin, Flavor Notes, and a "Recommended Roast" chip.
- **Conversion Optimization**:
  - Add a "Shop the Gear" link inside the selected method card. (e.g., "Comprar Filtros V60").

## 3. Data Structures

```javascript
const COFFEE_VARIETIES = [
  { name: 'Geisha', notes: 'Floral, Jazmín, Cítrico', origin: 'Etiopía/Panamá', color: 'bg-warning-subtle' },
  { name: 'Bourbon', notes: 'Dulce, Frutal, Caramelo', origin: 'Isla Reunión', color: 'bg-danger-subtle' },
  // ...
];
```

## 4. Layout Update

- Move "Calculator" to a collapsible accordion or side panel to focus focus on the "Experience" (Timer & Recipes).
- Add the Varieties section at the bottom as "Learn More".
