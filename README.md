# mysql-tab

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

## Tabla de contenidos

- [Install](#install)
- [Introduccion](#introduccion)
- [Uso](#uso)

## install

mysql-tab es un  modulo de [Node.js](https://nodejs.org/es/) valido registrado en [npm registry](https://www.npmjs.com/).

Para instalar use [`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install mysql-tab
```
## introduccion

mysql-tab es una interface de alto nivel para generar consultas en mysql
Escrito en JavaScript


## uso 

Para usar este modulo solo es nesesario conocer un poco el api de mysql
los parametros del constructor de mysqlTable son los mismos que se usarian 
en la funcion createConnection de mysql, usando el metodo *`tabla(tabla)`* se obtiene
un objeto dbTabla que representa a la tabla con el nombre del parametro en la base de datos.

[Mas documentacion sobre dbTabla..](https://github.com/ever23/dbtabla#dbtabla)

```js
// file ./index.js
const mysql=require("mysql-tab")
let connect= new mysql({/* params mysql */})
let test1=connect.tabla("test1")
// insert([1,"un texto","otro texto"]) tabien se acepta un objeto  
test1.insert(1,"un texto","otro texto") 
    .then(ok=>
    {
        console.log(ok)
    }).catch(e=>
    {
        console.log(e)
    })
```
En este caso si la tabla test1 no existe lanzara un error en catch
para resolver esto podemos crear un modelo para 
la tabla test1 y cargarlo esto ara que se verifique la existencia y 
si no existe la tabla sea creada e inicializada automaticamente para esto 
podemos crear un diretorio que contendra los modelos por ejemplo ./model/
y crear los modelos nesesarios para el proyecto 
```js
// file ./model/test1.js 
const model=require("sql-model")
const test2=new model("test2",[
    {
        name:"id",
        type:"int",
        primary:true,
        autoincrement:true
    },
    {
        name:"row1",
        type:"text"
    },
    {
        name:"row2",
        type:"int",
    },
    {
        name:"row3",
        type:"date",
    }
])
test2.foreingKey({ // se agrega las claves foraneas 
    key:"row2",
    reference:"test4",
    keyReference:"id_key2",
    onUpdate:'CASCADE',
    onDelete:'NO ACTION',
    // match: ' '
})
test2.insert(1,"hola",14,"2018/10/23")// datos de inicializacion 
// el parametro tabla recibira el objeto de la tabla 
// y el segundo el objeto de coneccion
// y el resto los parametros pasados en la llamada
test2.method("miMetodo",(tabla,connect,...params)=>
{
    //tu codigo para el metodo del modelo 
    //tabla.select()
    //tabla.insert()
    //tabla.update()
    //tabla.delete()
})
module.exports=test2
```
Luego en para usarlo 
```js
// file ./index.js
const mysql=require("mysql-tab")
const path=require("path")

let connect= new mysql({/* params mysql */})

connect.pathModels(path.dirname(__filename)+"/model")

let test2=connect.tabla("test2")
// insert([1,"un texto","otro texto"]) tabien se acepta un objeto  
test2.insert(1,"un texto","otro texto") 
    .then(ok=>
    {
        console.log(ok)
    }).catch(e=>
    {
        console.log(e)
    })
test2.miMetodo("hola")
```
[Mas documentacion sobre sql-model..](https://github.com/ever23/sql-model#uso)


## mysqlTable#constructor(config)

Constructor de mysqlTable

* `config {object}`: configuracion para mysql, tambien se puede pasar un objeto obtenido de la funcion createConnection de mysql
```js
const mysql=require("mysql-tab")
let connect= new mysql({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
```
```js
const mysqlTable=require("mysql-tab")
const mysql=require("mysql")
let db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
let connect= new mysqlTable(db)
```

## mysqlTable#tabla(tabla,[callback,[verify]])
Factoriza y retorna un objeto dbTabla que representara a la tabla con el nombre del primer parametro

* `tabla {string}`: Nombre de la tabla en la base de metadatos
* `callback {function} (opcional)`: Funcion que sera ejecutada cuando se verifique la existencia de la tabla, esta funcion recibira un parametro que sera el objeto dbTabla creado y si la tabla no es encontrada el parametro sera *null*
* `verify {boolean} (opcional)`: indica  si la verificacion se realizara al instante o se esperara a la primera consulta

## mysqlTable#model(tabla)
Verifica si un modelo existe y lo retorna si no existe retorna *`false`*

* `tabla {string}`: Nombre del modelo

## mysqlTable#addModel(model)
Agrega un modelo
* `model {sqlModel|object|string}`: Si es un objeto instanceado de sql-model se agregara a la lista de modelos, si es un objeto pero no de sql-model se tomara como los datos para factorizar un modelo deberia tener el formato *`{tabla:String, campos:Array, foreingKey:Array}`* y su es un string deberia ser una clausula sql CREATE TABLE de la cual se factorizara el modelo
```js
//ejemplo 1
const mysql=require("mysql-tab")
const model=require("sql-model")
let connect= new mysql({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
const test2=new model("test2",{
    campos:[
        {
            name:"id",
            type:"int",
            primary:true,
			autoincrement:true

        },
        {
            name:"row1",
            type:"text"
        },
        {
            name:"row2",
            type:"int",
        },
        {
            name:"row3",
            type:"date",
        }
    ]
})
 connect.addModel(test2)
```
```js
//ejemplo 2
const mysql=require("mysql-tab")
let connect= new mysql({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
connect.addModel({
    tabla:"test2",
    campos:[
        {
            name:"id",
            type:"int",
            primary:true,
			autoincrement:true
        },
        {
            name:"row1",
            type:"text"
        },
        {
            name:"row2",
            type:"int",
        },
        {
            name:"row3",
            type:"date",
        }
    ]
})
```
```js
//ejemplo 3
const mysql=require("mysql-tab")
let connect= new mysql({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
connect.addModel(`CREATE TABLE test2 (
    id int AUTO_INCREMENT,
    row1 text,
    row2 int,
    row3 date,
    primary key (id)
)`)
```

## mysqlTable#pathModels(path)
Cargar todos los modelos existentes en el directorio path  
* `path {string}`: directorio de modelos


## mysqlTable#query(sql,[config])

Ejecuta una consulta sql en la base de datos y retorna una promesa

* `sql {string}`: consulta sql
* `config {object}`: configuracion para la consulta mysql

## mysqlTable#beginTransaction(config={})

Inicia una transaccion mysql y retorna una promesa 

* `config {object}`: Configuracion para la query mysql 

Ejemplo de uso:
```js
const mysql=require("mysql-tab")
let connect= new mysql({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
})
mysql.pathModels(path.dirname(__filename)+"/modelo")
let test3=mysql.tabla("test3"),
test4=mysql.tabla("test4")
mysql.beginTransaction().then(async()=>
{
    let ok4=await test4.insert(null,"commit",12,"text2")
    if(ok4.error)
        throw ok4
    let ok3=await test3.insert(null,"commit",ok4.insertId,"text2")
    if(ok3.error)
        throw ok3
    await mysql.commit()
}).catch(e=>
{
    mysql.rollback()
})
```
## mysqlTable#commit(config={})

guarda los cambios realizados en la trasaccion y retorna una promesa 

* `config {object}`: Configuracion para la query mysql 

## mysqlTable#rollback(config={})

revierte los cambios realizados en la trasaccion y retorna una promesa 

* `config {object}`: Configuracion para la query mysql 

## mysqlTable#end()

Termina la coneccion con la base de datos 


[npm-image]: https://img.shields.io/npm/v/mysql-tab.svg
[npm-url]: https://npmjs.org/package/mysql-tab
[node-version-image]: https://img.shields.io/node/v/mysql-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[coveralls-url]: https://coveralls.io/r/mysqljs/mysql-tab?branch=master
[downloads-image]: https://img.shields.io/npm/dm/mysql-tab.svg
[downloads-url]: https://npmjs.org/package/mysql-tab
