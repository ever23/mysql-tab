const assert= require("assert")
const dbtabla = require('dbtabla')
const connect = require('../mysql-tab.js')
 describe("Test de la clase dbHelpers",()=>
 {
    const mysql= new connect({
        host     : 'localhost',
        user     : 'root',
        database :'test_mysql_tab'
    })
    it('verificacion de metodos',()=>
    {
        assert.equal(typeof mysql.tabla,"function")
        assert.equal(typeof mysql.query,"function")
        assert.equal(typeof mysql.connect,"function")
        assert.equal(typeof mysql.__escapeString,"function")
        assert.equal(typeof mysql.__keysInTable,"function")
        assert.equal(typeof mysql.end,"function")
    })
    it('obtencion del objeto dbtabla',()=>
    {
        assert.ok(mysql.tabla('test1') instanceof dbtabla,"debe retornar un objeto dbtabla")
    })
    mysql.end()
 })
