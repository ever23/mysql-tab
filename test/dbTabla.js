const assert= require("assert")
const dbtabla = require("dbtabla")
const connect = require('../mysql-tab.js')

/*const sqlite3Ok = require("../lib/sqlite3Ok.js")*/
const dbResult = require("dbtabla/lib/dbResult")
const dbRow = require("dbtabla/lib/dbRow")
const path = require('path')
function createAndInsert(callback)
{
   
    return (new Promise((resolve,reject)=>
    {
        const mysql= new connect({
            host     : 'localhost',
            user     : 'root',
            database :'test_mysql_tab'
        })
        let test1=mysql.tabla('test1')
        test1.insert(null,"text",12,"text2").then(ok=>
        {
            callback(resolve,reject,mysql,ok)
        }).catch(e=>
        {
            
            mysql.end()
            reject(e)
        })
            
    }))
}
describe("Test de la clase mysql-tab :tabla",()=>
{
    it('obtencion del objeto dbtabla',()=>
    {
        return (new Promise((resolve,rejec)=>
        {
            const mysql= new connect({
                host     : 'localhost',
                user     : 'root',
                database :'test_mysql_tab'
            })
            mysql.end()
            resolve(mysql.tabla('test1'))
            
        
        })).then(test1=>
        {
            assert.ok(test1 instanceof dbtabla,"debe retornar un objeto dbtabla")
        })
    })
    it('obtencion del objeto dbtabla async',()=>
    {
        
        return (new Promise((resolve,reject)=>
        {
            const mysql= new connect({
                host     : 'localhost',
                user     : 'root',
                database :'test_mysql_tab'
            })
            mysql.query("create table IF NOT EXISTS `test1` (`id` int auto_increment ,`row1` varchar(100) default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
                .then(ok=>
                {
                    mysql.tabla('test1',(test1)=>
                    {
                        mysql.end()
                        resolve(test1)
                    },true)
                }).catch(e=>{
                    mysql.end()
                    reject(e)
                })
            
        })).then(test1=>
        {
            assert.ok((test1 instanceof dbtabla),"debe retornar un objeto dbtabla")
        })
    })
    it('dbTabla:insert',()=>
    {
        return (new Promise((resolve,reject)=>
        {
            const mysql= new connect({
                host     : 'localhost',
                user     : 'root',
                database :'test_mysql_tab'
            })
            let test1=mysql.tabla('test1')
            test1.insert(null,"text",12,"text2").then(ok=>
            {
                mysql.end()
                resolve(ok)
            }).catch(e=>
            {
                console.log(test1.__lastSql)
                mysql.end()
                reject(e)
            })
            
        })).then(ok=>
        {

            assert.ok(typeof ok==="object","debe retornar un objeto")
            assert.equal(ok.$sql,"INSERT INTO `test1` (`row1`,`row2`,`row3`) VALUES ('text',12,'text2');")
            
        })
        
       
    })
    it('dbTabla:select',()=>
    {
        return createAndInsert((resolve,reject,mysql,ok)=>
            {
               
                let test1=mysql.tabla('test1')
                test1.select().then(d=>
                    {
                        mysql.end()
                        resolve(d)
                    }).catch(e=>
                    {
                        mysql.end()
                        reject(e)
                    })
            }).then(data=>
            {
                assert.ok(data instanceof dbResult,"debe retornar un objeto dbResult")
                assert.equal(data.$sql,"SELECT `test1`.* FROM `test1`;")
                assert.ok(data.length>0)
                assert.ok(data[0] instanceof dbRow,"debe retornar un objeto dbRow")
                assert.equal(data[0].row1,"text")
                assert.equal(data[0].row2,12)
                assert.equal(data[0].row3,"text2")
                
            })  
         
    })
    it('dbTabla:update',()=>
    {
        let id
        return createAndInsert((resolve,reject,mysql,ok)=>
            {
                let test1=mysql.tabla('test1')
                id=ok.insertId
                test1.update({row1:"hola"},{id:ok.insertId}).then(d=>
                    {
                        mysql.end()
                        resolve(d)
                    }).catch(e=>
                    {
                        mysql.end()
                        reject(e)
                    })
            }).then(data=>
            {
                assert.ok(typeof data==="object","debe retornar un objeto")
                assert.equal(data.$sql,"UPDATE `test1` SET `row1`='hola' WHERE `id`="+id+";")
                
            })  
    })
    it('dbTabla:delete',()=>
    {
        let id
        return createAndInsert((resolve,reject,mysql,ok)=>
            {
                let test1=mysql.tabla('test1')
                id=ok.insertId
                test1.delete({id:ok.insertId}).then(d=>
                    {
                        mysql.end()
                        resolve(d)
                    }).catch(e=>
                    {
                        mysql.end()
                        reject(e)
                    })
            }).then(data=>
            {

                assert.ok(typeof data==="object","debe retornar un objeto")
                assert.equal(data.$sql,"DELETE FROM `test1` WHERE `id`="+id+";")
                
            }) 
        
    })
    it('load model test3',()=>
    {
        return (new Promise((resolve,reject)=>
        {
            const mysql= new connect({
                host     : 'localhost',
                user     : 'root',
                database :'test_mysql_tab'
            })
            mysql.pathModels(path.dirname(__filename)+"/modelo")
            try{
                 mysql.tabla('test3',e=>
                    {
                       
                        resolve(e)
                    },true)
            }catch(e)
            {
                mysql.end()
                reject(e)
            }
           
        })).then(test3=>
        {
            return test3.select().then(d=>
            {
                test3.__conection.end()
                assert.ok(test3 instanceof dbtabla,"debe retornar un objeto dbtabla")
            })
            
        }) 
    })
    it('load model test4',()=>
    {
        return (new Promise((resolve,rejec)=>
        {
            const mysql= new connect({
                host     : 'localhost',
                user     : 'root',
                database :'test_mysql_tab'
            })
            mysql.pathModels(path.dirname(__filename)+"/modelo")
            try{
                mysql.tabla('test4',e=>
                    {
                       
                        resolve(e)
                    },true)
            }catch(e)
            {
                mysql.end()
                reject(e)
            }
           
        })).then(test4=>
        {
            return test4.select().then(d=>
            {
                test4.__conection.end()
                assert.ok(test4 instanceof dbtabla,"debe retornar un objeto dbtabla")
            })
            
        }) 
    })
})
