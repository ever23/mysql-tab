const connect = require('../../mysql-tab.js')
const path = require('path')
const mysql= new connect({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab2'
},false)
mysql.connect((data)=>
{
   console.log('create database  ok')
})
console.log('cagando modelos')
mysql.pathModels(path.dirname(__filename)+"/model")
let test4=mysql.tabla('test4')
let test3=mysql.tabla('test3',()=>
{
    console.log('create tables ok')

},false)
    //console.log(dbtabla)
//console.log('obtencion de la tabla ?',test1 instanceof dbtabla)

test4.insert(null,"un texto cualquiera",2332,"2018-11-11").then(i=>
{

    console.log("insert ok",i.$sql,i)
    let id=i.insertId

    test3.insert(null,"un texto cualquiera",id,"2018-11-11").then(i2=>
    {
         console.log("insert ok test3",i2.$sql,i2)
          mysql.end()
    }).catch(e=>
    {
        console.log(e)
        mysql.end()
    })

}).catch(e=>
{
    console.log(e)
    mysql.end()
})
console.log('waint...')
