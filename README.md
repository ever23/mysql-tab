# mysql-tab

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

**mysql-tab** es una potente interfaz de alto nivel para interactuar con bases de datos MySQL y MariaDB en Node.js. Diseñada bajo el patrón **Active Record**, permite gestionar la persistencia de datos de forma fluida, segura y orientada a objetos, eliminando la necesidad de escribir SQL manual para las tareas comunes.

## 🚀 Características Principales

*   **Abstracción Total**: Realiza operaciones CRUD complejas usando objetos de JavaScript.
*   **Patrón Active Record**: Los resultados de las consultas son objetos inteligentes con métodos `.update()` y `.delete()`.
*   **Gestión de Esquemas**: Sincronización automática de tablas basada en modelos definidos.
*   **Fluent Query Builder**: Motor de selección polimórfico con soporte para Joins dinámicos.
*   **Transacciones Atómicas**: Soporte nativo para transacciones (Commit/Rollback).
*   **Ingeniería Inversa**: CLI integrado para generar modelos a partir de bases de datos existentes.

## 📚 Ecosistema dbtabla

Este paquete forma parte de un ecosistema modular. También puedes utilizar:

*   **[tabla-model](https://github.com/ever23/tabla-model)**: El motor de definición de esquemas (requerido para definir modelos).
*   **[sqlite3-tab](https://github.com/ever23/sqlite3-tab)**: Si necesitas soporte para SQLite3.
*   **[pg-table](https://github.com/ever23/pg-table)**: Si necesitas soporte para PostgreSQL.

---

## 📦 Instalación

```sh
$ npm install mysql-tab
```

---

## 🛠️ Inicio Rápido

### 1. Conexión y Configuración
Instancia la conexión pasando un objeto de configuración estándar de MySQL.

```javascript
const MySQL = require('mysql-tab');

const db = new MySQL({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mi_proyecto'
});
```

### 2. Definición de Modelos (Opcional pero recomendado)
Utiliza `tabla-model` para definir la estructura de tus datos.

```javascript
// model/Usuario.js
const Model = require('tabla-model');

module.exports = new Model('usuarios', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'nombre', type: 'varchar(100)' },
        { name: 'email', type: 'varchar(100)', unique: true }
    ]
});
```

Registra tus modelos para que `mysql-tab` gestione las tablas por ti:
```javascript
const path = require('path');
db.pathModels(path.join(__dirname, 'model'));
```

---

## 📖 Guía de Uso: Operaciones de Tabla

Obtén una instancia de la tabla para empezar a operar:
```javascript
const usuarios = db.tabla('usuarios');
```

### Inserción de Datos
```javascript
// Inserción por objeto
await usuarios.insert({ nombre: 'Antigravity', email: 'ai@dev.com' });

// Inserción posicional (según el orden de las columnas)
await usuarios.insert(null, 'Nuevo Usuario', 'user@example.com');
```

### Consultas (Select)
El método `.select()` es extremadamente versátil.

```javascript
// 1. Selección simple con filtros (WHERE)
const todos = await usuarios.select("id > 10");

// 2. Selección de campos específicos
const nombres = await usuarios.select(["nombre", "email"], "id < 50");

// 3. Selección con Joins Dinámicos
// Prefijos: '>' Right Join, '<' Left Join, '=' Inner Join
const conPerfiles = await usuarios.select(
    ["u.nombre", "p.bio"], 
    { "<perfiles": "u.id = p.id_usuario" }, // Left Join
    "u.estado = 'activo'"
);

// 4. Búsqueda por ID
const user = await usuarios.selectById(1);

// 5. Búsqueda Inteligente (LIKE)
const resultados = await usuarios.busqueda("Antigravity", ["nombre", "email"]);
```

### Actualización y Borrado
```javascript
// Actualización masiva o filtrada con cláusula string
await usuarios.update({ estado: 'bloqueado' }, "id = 1");

// Actualización por ID (más directo)
await usuarios.updateById({ estado: 'activo' }, 1);

// Borrado
await usuarios.delete("id = 5");

// Borrado por ID
await usuarios.deleteById(5);
```

---

## 💎 El Poder de Active Record (dbRow)

Cuando realizas un `select`, obtienes instancias de `dbRow`. Estos objetos "conocen" su origen y pueden gestionarse a sí mismos.

```javascript
const user = await usuarios.selectOne("id = 1");

if (user) {
    user.nombre = "Nombre Editado";
    await user.update(); // Genera y ejecuta el SQL UPDATE automáticamente
    
    // O si deseas eliminarlo
    // await user.delete();
}
```

---

## 🔐 Transacciones
Asegura la integridad de tus datos envolviendo operaciones críticas.

```javascript
try {
    await db.beginTransaction();

    await pedidos.insert({ ... });
    await stock.update({ cantidad: -1 }, "id_producto = 10");

    await db.commit();
} catch (error) {
    await db.rollback();
    console.error("Transacción fallida, cambios revertidos:", error);
}
```

---

## 🏗️ Ingeniería Inversa (CLI)

Si ya tienes una base de datos, puedes generar los modelos automáticamente ejecutando:

```sh
$ npx mysql-tab --user root --password secret --database mi_db --path ./models
```

---

## 🧪 Pruebas
Para ejecutar los tests del proyecto:
```sh
$ npm test
```

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.

[npm-image]: https://img.shields.io/npm/v/mysql-tab.svg
[npm-url]: https://npmjs.org/package/mysql-tab
[node-version-image]: https://img.shields.io/node/v/mysql-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[downloads-image]: https://img.shields.io/npm/dm/mysql-tab.svg
[downloads-url]: https://npmjs.org/package/mysql-tab
