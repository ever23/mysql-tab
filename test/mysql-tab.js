const { describe, it } = require('node:test');
const assert= require("assert")
const dbtabla = require('dbtabla')
const connect = require('../mysql-tab.js')
describe("Test de la clase mysql-tab",()=>
{
    it('verificacion de metodos',()=>
    {
        const mysql= new connect({
            host     : 'localhost',
            user     : 'root',
            password : 'secret'
        })
        assert.equal(typeof mysql.tabla,"function")
        assert.equal(typeof mysql.query,"function")
        assert.equal(typeof mysql.connect,"function")
        assert.equal(typeof mysql._escapeString,"function")
        assert.equal(typeof mysql._keysInTable,"function")
        assert.equal(typeof mysql.end,"function")
        mysql.end()
    })

    it('concurrencia con Pool (consultas en paralelo)', async () => {
        const mysql = new connect({
            host: 'localhost',
            user: 'root',
            password: 'secret',
            database: 'test_db',
            connectionLimit: 5
        })
        
        // Lanzamos 10 consultas que tardan un poco (usando SLEEP) en paralelo
        const start = Date.now()
        const queries = Array.from({ length: 10 }, () => 
            mysql.query("SELECT SLEEP(0.1) as val")
        )
        
        const results = await Promise.all(queries)
        const duration = Date.now() - start
        
        assert.equal(results.length, 10)
        // Si el pool funciona, 10 consultas de 0.1s con límite de 5 conexiones
        // deberían tardar aprox 0.2s, no 1.0s.
        assert.ok(duration < 800, `Debería ser rápido gracias al Pool, tardó ${duration}ms`)
        
        mysql.end()
    })

    it('metodo query',()=>
    {

        return (new Promise((resolve,reject)=>
            {
                const mysql= new connect({
                    host     : 'localhost',
                    user     : 'root',
                    password : 'secret'
                })
                mysql.query("DROP database if EXISTS test_db").then(ok=>
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
                    password : 'secret',
                    database :'test_db'
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
