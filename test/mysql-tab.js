const assert= require("assert")
const dbtabla = require('dbtabla')
const connect = require('../mysql-tab.js')
describe("Test de la clase sqlite3-tab",()=>
{
    it('verificacion de metodos',()=>
    {
        const mysql= new connect({
            host     : 'localhost',
            user     : 'root',
        })
        assert.equal(typeof mysql.tabla,"function")
        assert.equal(typeof mysql.query,"function")
        assert.equal(typeof mysql.connect,"function")
        assert.equal(typeof mysql.__escapeString,"function")
        assert.equal(typeof mysql.__keysInTable,"function")
        assert.equal(typeof mysql.end,"function")
        mysql.end()
    })

    it('metodo query',()=>
    {

        return (new Promise((resolve,reject)=>
            {
                const mysql= new connect({
                    host     : 'localhost',
                    user     : 'root',
                })
                mysql.query("DROP database if EXISTS test_mysql_tab").then(ok=>
                {
                    mysql.end()
                    resolve(ok)
                }).catch(e=>
                {
                    mysql.end()
                    reject(e)
                })
            })).then(ok=>
            {
                assert.equal(typeof ok,"object")
            })
    })
    it('crear base de datos si no existe',()=>
    {

        return (new Promise((resolve,reject)=>
            {
                const mysql= new connect({
                    host     : 'localhost',
                    user     : 'root',
                    database :'test_mysql_tab'
                })

                mysql.query("select 1").then(ok=>
                {
                    mysql.end()
                    resolve(ok)
                }).catch(e=>
                {
                    mysql.end()
                    reject(e)
                })

            })).then(ok=>
            {
                //console.log(ok)
                assert.equal(typeof ok,"object")
            })
    })
    
})
