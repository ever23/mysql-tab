const connect = require('../../mysql-tab.js')
const mysql= new connect({
    host     : 'localhost',
    user     : 'root',
    database :'test_mysql_tab'
},false)
mysql.connect((...data)=>
{
    //console.log('connected',data)
})

let test1=mysql.tabla('test1')
    //console.log(dbtabla)
//console.log('obtencion de la tabla ?',test1 instanceof dbtabla)
test1.insert(null,"un texto cualquiera",2332,"2018-11-11").then(i=>
{
    console.log("insert ok",i.$sql,i)
    let id=i.insertId
    test1.select('id='+id).then(s=>
    {
        let row=s[0]

        console.log("dbRow.select ok",s.$sql,s)
        row.row1="otro texto"
        row.update().then((u)=>{
            console.log("dbRow.update ok",u.$sql,u)
            row.delete().then(d=>
            {
                console.log("dbRow.delete ok",d.$sql,d)
                //console.log(d)
            })
            mysql.end()
        }).catch(e=>
        {
            console.log(e)
            mysql.end()
        })
    })
}).catch(e=>
{
    console.log(e)
    mysql.end()
})
console.log('waint...')
