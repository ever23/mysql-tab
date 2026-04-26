# mysql-tab

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

**mysql-tab** es la solución definitiva y lista para producción para interactuar con bases de datos MySQL en Node.js. Al integrar de manera nativa la potencia de **dbtabla** (la capa de abstracción de base de datos) y **tabla-model** (la definición de esquemas), ofrece al desarrollador una interfaz unificada y fluida para la gestión de datos a gran escala.

## Tabla de contenidos

- [Instalación](#instalación)
- [Introducción](#introducción)
- [Uso](#uso)
- [Ingeniería Inversa](#ingeniería-inversa-a-una-base-de-datos)
- [Documentación del API](#documentación-del-api)
- [Asistencia para IA](#asistencia-para-ia)

## Instalación

`mysql-tab` es el paquete principal que necesitas para gestionar tu base de datos MySQL de forma profesional:

```sh
$ npm install mysql-tab
```

---

## Introducción

`mysql-tab` actúa como la interfaz final que simplifica la interacción con MySQL, ocultando la complejidad del driver nativo y las abstracciones subyacentes. Internamente, utiliza un ecosistema diseñado para maximizar la productividad:

1.  **Capa de Datos de Alto Nivel**: Utiliza las abstracciones de `dbtabla` para realizar operaciones CRUD complejas mediante objetos de JavaScript, evitando el SQL manual.
2.  **Sincronización de Esquemas**: Gracias a `tabla-model`, tus tablas pueden crearse e inicializarse automáticamente al arrancar la aplicación basándose en tus definiciones de modelos.
3.  **Gestión Inteligente**: Incluye capacidades avanzadas como la creación automática de la base de datos si esta no existe y herramientas de ingeniería inversa para esquemas preexistentes.

---

## Uso

Para empezar, solo necesitas configurar la conexión y definir tus requerimientos. `mysql-tab` se encargará de gestionar el pool de conexiones y la integridad de tus tablas.

[Más documentación sobre dbTabla..](https://github.com/ever23/dbtabla#dbtabla-1)

### Ejemplo de uso rápido:
```js
const MySQL = require("mysql-tab");

// Conexión estándar
let db = new MySQL({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mi_empresa'
});

let tabla = db.tabla("ventas");

// Inserción directa sin preocuparte por la sintaxis SQL manual
tabla.insert({ producto: "Laptop", cantidad: 5, precio: 1200.50 })
    .then(res => console.log("Venta registrada:", res))
    .catch(err => console.error("Error:", err));
```

### El flujo recomendado (Model-Driven)
Define la estructura de tus datos en archivos separados y permite que `mysql-tab` orqueste la base de datos por ti.

```js
// ./model/usuario.js
const Model = require("tabla-model");

module.exports = new Model("usuarios", {
    colums: [ 
        { name: "id", type: "int", primary: true, autoincrement: true },
        { name: "username", type: "varchar(50)", unique: true },
        { name: "email", type: "varchar(100)" }
    ]
});
```

#### Integración en el Servidor:
```js
const MySQL = require("mysql-tab");
const path = require("path");

const db = new MySQL({ /* config */ });

// Carga global: mysql-tab leerá tus modelos y creará las tablas automáticamente
db.pathModels(path.join(__dirname, "model"));

// Consultar y manipular filas como objetos interactivos
db.tabla("usuarios").selectById(1).then(async (user) => {
    if (user) {
        user.username = "nuevo_alias";
        await user.update(); // mysql-tab genera el SQL de actualización automáticamente
    }
});
```

---

## Ingeniería Inversa a una base de datos

Si ya dispones de una base de datos MySQL en producción, `mysql-tab` puede generar automáticamente los archivos de modelo por ti mediante su herramienta de línea de comandos.

### Ejemplo:
```sh
$ ./node_modules/.bin/mysql-tab --user root --password secret --database mi_db_existente --path ./modelos
```

---

## Documentación del API

### `mysqlTable#constructor(config)`
*   `config {object}`: Configuración estándar de MySQL o instancia de conexión nativa.

### `mysqlTable#tabla(tabla, [callback], [verify])`
Estructura y retorna un objeto `dbTabla` (abstracción de alto nivel).

### `mysqlTable#beginTransaction()` / `commit()` / `rollback()`
Gestión simplificada de transacciones atómicas de forma asíncrona.

### `mysqlTable#end()`
Libera el pool de conexiones y cierra la sesión con el servidor MySQL.

---

## Asistencia para IA

Este proyecto incluye una **Skill de IA** diseñada para ayudar a agentes y asistentes inteligentes a entender y utilizar la librería de forma óptima, siguiendo los patrones de Active Record y gestión de modelos en MySQL.

Puedes encontrar las directrices detalladas en: [.agents/skills/mysql-tab/SKILL.md](.agents/skills/mysql-tab/SKILL.md)

[npm-image]: https://img.shields.io/npm/v/mysql-tab.svg
[npm-url]: https://npmjs.org/package/mysql-tab
[node-version-image]: https://img.shields.io/node/v/mysql-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[downloads-image]: https://img.shields.io/npm/dm/mysql-tab.svg
[downloads-url]: https://npmjs.org/package/mysql-tab
