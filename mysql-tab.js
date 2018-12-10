const mysql=require("mysql")
const {MYSQL_DB,connect}=require("dbtabla")
/**
* mysqlTable
* crea una coneccion a una base de datos mysql
*/
class mysqlTable extends connect
{
    /**
    * @param {object} param - configuracion para mysql
    * @param {boolean} connect - indica si conectata al instante
    */
    constructor(params,connect=true)
    {
        super(params,MYSQL_DB)
        this.conection=mysql.createConnection(this.config)
        if(connect)
            this.conection.connect()
        this.__escapeChar="`"
        this.__information_schema = "SELECT information_schema.columns.* FROM information_schema.columns WHERE table_name="
        mysqlTable.__caheTablas={}
        this.__connectCallback=false
    }
    /**
    * conecta con la base de datos
    * @param {function} callback - funcion que se  ejecutara al conectar
    */
    connect(callback=e=>e)
    {
        this.__connectCallback=callback
        this.conection.connect(ok=>
        {
            if(ok)
            {

                if(ok.errno!=1049)
                    callback(ok)
            }else {
                callback(ok)
            }

        })
    }
    pathModels(pathModels)
    {
        super.pathModels(pathModels)

    }
    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
    * @return {dbTabla}
    */
    tabla(tabla,callback,create=true)
    {
        if(typeof mysqlTable.__caheTablas[tabla]!=="undefined")
        {
            callback(mysqlTable.__caheTablas[tabla])
            return mysqlTable.__caheTablas[tabla]
        }
        return  mysqlTable.__caheTablas[tabla] = super.tabla(tabla,t=>{
            console.log('tabla',tabla)
            typeof callback==="function"?callback(t):null
        }, typeof callback==="function" && create)
    }

    /**
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    query(query)
    {
        return new Promise((resolver,reject)=>
        {
            this.conection.query(query,(error,result)=>
            {
                //console.log(fiels)
                if(error)
                {
                    return reject(error)
                }
                resolver(result)
            })
        })
    }
    /**
    * escapa el texto sql
    * @param {string} str - texto
    * @return {string}
    */
    __escapeString(str)
    {
        return this.conection.escape(str)
    }
    /**
    * termina la coneccion
    */
    end()
    {
        this.conection.end()
    }
    /**
    * verificara la existencia de la tabla
    * en la base de datos y pasa lo metadatos de la misma calback en
    * el segundo parametro
    * @param {string} table - nombre de la tabla
    * @param {function} callback - funcion a ejecutar cuando se obtengan los metadatos
    */
    __keysInTable(table,callback)
    {

        this.query(`${this.__information_schema}'${table}' and TABLE_SCHEMA='${this.conection.config.database}'`)
            .then(result=>{
                if(result.length==0)
                {
                    let model=this.model(table)
                    if(model)
                    {
                        this.__createTable(table,model,callback)
                    }else {
                        throw "La tabla no existe"
                    }
                }else {
                    this.__procesingKeys(table,result,callback)
                }
            }).catch(e=>{
                if(e.errno==1049)
                {
                    this.__createDatabase(table,(...params)=>
                    {

                        callback(...params)
                    })
                }else {
                    throw e
                }
            })
    }
    __createDatabase(table,callback)
    {
        let database =this.config.database
        this.config.database=''
        this.conection=mysql.createConnection(this.config)
        this.conection.connect(ok=>
        {
            this.query(`CREATE DATABASE ${database};`).then(d=>
            {
                this.query(`use ${database}`)
                    .then(ok2=>
                    {
                        this.__connectCallback(ok)
                         this.__keysInTable(table,callback)
                    }).catch(e=>this.__connectCallback(e))
            }).catch(e=>this.__connectCallback(e))
        })
    }
    __createTable(table,model,callback)
    {
        let rescursive=(foreingKey,i)=>
        {

            if(foreingKey[i]!==undefined)
            {
                this.tabla(foreingKey[i].reference,()=>
                {
                    i++
                    rescursive(foreingKey,i)
                },true)
            }else {
                this.query(model.sql(this)).then(ok=>{
                    callback(model.keys())
                }).catch(e=>{throw e})
            }

        }
        rescursive(model.foreingKey(),0)
    }
    /**
    * procesa los metadatos y los pasa a la funcion
    * @param {string} table - nombre de la tabla
    * @param {array} data - metadatos crudos
    * @param {function} callback - funcion a ejecutar cuando se obtengan los metadatos
    *
    */
    __procesingKeys(table,data,callback)
    {
        let orderColum={}
        let colums={}
        let primarykey=[]
        let autoincrement
        for(let item of data)
        {
            orderColum[Number(item.ORDINAL_POSITION)-1]=item.COLUMN_NAME

            colums[item.COLUMN_NAME]={
                Type: item.COLUMN_TYPE,
                TypeName : "",
                KEY : item.COLUMN_KEY,
                Extra : item.EXTRA,
                Default :  item.COLUMN_DEFAULT,
                Nullable :  item.IS_NULLABLE == "YE" ? true : false,
                Position : item.ORDINAL_POSITION
            }
            if (item.COLUMN_KEY == "PRI" && primarykey.find(p=>{return p===item.COLUMN_NAME})===undefined)
            {
                primarykey.push(item.COLUMN_NAME)
            }
            if (item.EXTRA == "auto_increment")
            {
                autoincrement = item.COLUMN_NAME
            }
        }
        callback({
            colum:colums,
            primary:primarykey,
            autoincrement:autoincrement,
            OrderColum:orderColum
        })
    }
}

module.exports=mysqlTable
