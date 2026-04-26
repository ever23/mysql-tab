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

### Consultas Select (Lógica de Parámetros)
El método `select` es polimórfico. Sigue esta lógica de decisión:

| Si el 1er parámetro es... | Se interpreta como... | Ejemplo |
| :--- | :--- | :--- |
| **String** | Cláusula `WHERE` | `tabla.select("id > 10")` |
| **Array** | Lista de `CAMPOS` | `tabla.select(["nombre", "email"])` |
| **Object** | Definición de `JOINS` | `tabla.select({ "=perfil": "u.id = p.id_user" })` |

**Firma completa**: `select(campos, joins, where, group, having, order, limit)`

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
