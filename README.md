# mysql-db

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

mysql-db es una interface de alto nivel para generar consultas en mysql
Escrito en JavaScript


## uso 

Para usar este modulo solo es nesesario conocer un poco el api de mysql
los parametros del constructor de mysqlTable son los mismos que se usarian 
en la funcion createConnection de mysql
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
en este caso si la tabla test no existe lanzara un error en catch
para resolver esto podemos crear un modelo para 
la tabla test1 y cargarlo esto ara que se verifique la existencia y 
si no existe la tabla sea creada e inicializada automaticamente para esto 
podemos crear un diretorio que contendra los modelos por ejemplo ./model/
y crear los modelos nesesarios para el proyecto 
```js
// file ./model/test1.js 
const model=require("sql-model")
const test1=new model("test3",[
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
test1.foreingKey({ // se agrega las claves foraneas 
    key:"row2",
    reference:"test4",
    keyReference:"id_key2",
    onUpdate:'CASCADE',
    onDelete:'NO ACTION',
    // match: ' '
})
test2.insert(1,"hola",14,"2018/10/23")// datos de inicializacion 
test2.method("miMetodo",(tabla,...params)=>// el parametro tabla recibira el objeto de la tabla 
{
    //tu codigo para el metodo del modelo 
    //tabla.select()
    //tabla.insert()
    //tabla.update()
    //tabla.delete()
})
module.exports=test1
```
Luego en para usarlo 
```js
// file ./index.js
const mysql=require("mysql-tab")
const path=require("path")

let connect= new mysql({/* params mysql */})

connect.pathModels(path.dirname(__filename)+"/model")

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
test1.miMetodo("hola")
```


[npm-image]: https://img.shields.io/npm/v/mysql-tab.svg
[npm-url]: https://npmjs.org/package/mysql-tab
[node-version-image]: https://img.shields.io/node/v/mysql-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[coveralls-url]: https://coveralls.io/r/mysqljs/mysql-tab?branch=master
[downloads-image]: https://img.shields.io/npm/dm/mysql-tab.svg
[downloads-url]: https://npmjs.org/package/mysql-tab
