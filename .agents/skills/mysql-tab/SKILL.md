# mysql-tab AI Skill (Gestor de Base de Datos)

Esta skill define las instrucciones y patrones de uso recomendados para la librería **mysql-tab**. Utiliza estos principios para que cualquier agente de IA gestione la persistencia de datos de manera eficiente, segura y consistente en MySQL.

## 1. Inicialización y Registro de Modelos

Para comenzar, instancia la conexión y registra los modelos definidos con `tabla-model`.

```javascript
const MySQL = require('mysql-tab');
const path = require('path');

// 1. Conexión (Pool de conexiones gestionado automáticamente)
const db = new MySQL({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mi_empresa'
});

// 2. Carga Masiva de Modelos (Recomendado)
db.pathModels(path.join(process.cwd(), 'model'));

// 3. Obtención de una instancia de tabla
const usuarios = db.tabla('usuarios');
```

## 2. Operaciones CRUD Básicas

### Inserción
```javascript
await usuarios.insert({ 
    user: 'admin', 
    nombre: 'Administrador', 
    tipo: 'root' 
});
```

### Consultas Select: Sintaxis de Objeto ?nico (REGLA MANDATORIA PARA EL AGENTE)

**Prioridad Absoluta:** Usa **siempre** la sintaxis de objeto ?nico `{ where, campos, joins, order, limit }` al llamar a `.select()`, `.selectOne()` o `.busqueda()`. Esto garantiza cero errores de ambig?edad con par?metros posicionales.

```javascript
// Consulta est?ndar recomendada para el agente:
const resultados = await usuarios.select({
    where: { 
        "estado": "activo", 
        "puntos>": 50,       // Sufijo > para mayor que
        "||nombre%": "A%"    // Prefijo || para OR, sufijo % para LIKE
    },
    campos: ["id", "nombre", "email"],
    joins: { ">perfiles": "perfiles.id_user = usuarios.id" }, // > = LEFT JOIN
    order: "id DESC",
    limit: 10
});
```

#### Operadores en `where`:
* **Sufijos de comparaci?n**: `campo%` (LIKE), `campo!` (!=), `campo>` (>), `campo<` (<), `campo>=` (>=), `campo<=` (<=).
* **Prefijos l?gicos**: `||campo` (OR), `&&campo` (AND por defecto).

<details>
<summary>Sintaxis Posicional Alternativa (Legacy)</summary>

Si usas la firma posicional `select(campos, joins, where)` y deseas filtrar con objeto sin definir campos ni joins, debes pasar `null`:
```javascript
// Posicional: (campos, joins, where)
await usuarios.select(null, null, { "activo": 1 });
```
*(Evita este modo si puedes; prefiere la sintaxis de objeto ?nico)*.
</details>

### Búsqueda Inteligente
```javascript
// Busca "Juan" en los campos indicados usando 'LIKE' nativo de MySQL
const resultados = await usuarios.busqueda("Juan", ["nombre", "user"]);
```

## 3. Patrón Active Record (Instancias Inteligentes)

Todos los resultados son instancias de **Active Record**.

```javascript
const user = await usuarios.selectOne("user = 'pedro'");
if (user) {
    user.puntos += 10;
    await user.update(); // Genera el UPDATE SQL automáticamente
}
```

## 4. Transacciones Atómicas

MySQL soporta transacciones nativas. Úsalas para asegurar la integridad de datos críticos.

```javascript
try {
    await db.beginTransaction();
    
    await tabla1.insert({ ... });
    await tabla2.update({ ... });
    
    await db.commit();
} catch (e) {
    await db.rollback();
    throw e;
}
```

## 5. Directrices Críticas para la IA (AI-Guidelines)

> [!IMPORTANT]
> Sigue estas reglas para maximizar la eficiencia:

1.  **Conoce tu esquema primero**: Lee siempre los archivos en el directorio `model/` para asegurar nombres de columnas correctos.
2.  **Prefiere `selectOne` para registros únicos**: Si buscas por ID o Username, usa `selectOne()`. Devuelve `null` si no hay resultados.
3.  **Ingeniería Inversa**: Si el usuario pide generar modelos de una DB existente, usa el binario `./node_modules/.bin/mysql-tab` con los flags correspondientes.
4.  **Pool de Conexiones**: No es necesario cerrar la conexión después de cada consulta; el driver gestiona un pool eficiente. Solo usa `db.end()` al apagar el servicio.

## 6. Firma de Métodos Principales

- `selectOne(where, select, join, order)`: Retorna un objeto o `null`.
- `select(...)`: Retorna un array de objetos Active Record.
- `beginTransaction()` / `commit()` / `rollback()`: Control de transacciones.
- `end()`: Cierra todas las conexiones del pool.

## 7. Sintaxis Avanzada de Filtrado (Where Object)

Al utilizar objetos para el parámetro `where`, puedes usar operadores especiales:
- **Sufijos:** `campo%` (LIKE), `campo!` (!=), `campo>` (>), `campo<` (<), `campo>=` (>=), `campo<=` (<=).
- **Prefijos:** `||campo` (OR), `&&campo` (AND).

### Nota sobre Cadenas Numéricas
Los strings con ceros a la izquierda (ej: `"01"`) se tratan siempre como **strings** (con comillas) para preservar el formato.

> **Peligro de Polimorfismo:**
> Si pasas un objeto como primer argumento en `select()`, se interpretará como **Joins**. Para filtrar por objeto de forma segura:
> `await tabla.select(null, null, { "campo": "valor" });`
>
> **Sintaxis Recomendada (Objeto Único):**
> Usa siempre que sea posible un objeto con llaves explícitas:
> `await tabla.select({ where: { activo: 1 }, limit: 10 });`
