const mysql=require("mysql")
const connectionMysql=require("mysql/lib/Connection")
const {MYSQL_DB,connect}=require("dbtabla")
/**
* mysqlTable
* crea una conexion a una base de datos mysql
*/
class mysqlTable extends connect
{
    /**
    * @param {object|Connection} param - configuracion para mysql o objeto de conexion mysql
    * @param {boolean} connect - indica si connectata al instante
    */
    constructor(params,connect=true)
    {
        if(params instanceof connectionMysql)
        {
            super({},MYSQL_DB)
            this.connection=params
        }else {
            super(params,MYSQL_DB)
            this.connection=mysql.createConnection(this.config)
            if(connect)
                this.connect()
        }
        this.__escapeChar="`"
        this.__information_schema = "SELECT information_schema.columns.* FROM information_schema.columns WHERE table_name="
        mysqlTable.__caheTablas={}
        this.__connectCallback=()=>{}
    }
    /**
    * envia una sentencia START TRANSACTION a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    beginTransaction(config={})
    {
        return this.query("START TRANSACTION",config)
    }
    /**
    * envia una sentencia commit a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    commit(config={})
    {
        return this.query("COMMIT",config)
    }
    /**
    * envia una sentencia rollback a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    rollback(config={})
    {
        return this.query("ROLLBACK",config)
    }

    /**
    * connecta con la base de datos
    * @param {function} callback - funcion que se  ejecutara al connectar
    */
    connect(callback=()=>{})
    {
        this.__connectCallback=callback

        this.connection.connect(ok=>
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

    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
	* @param {boolean} verify -
    * @return {dbTabla}
    */
    tabla(tabla,callback,verify=true)
    {
        if(typeof callback ==="boolean")
            verify=callback
        if(typeof mysqlTable.__caheTablas[tabla]!=="undefined")
        {

            typeof callback==="function"?callback(mysqlTable.__caheTablas[tabla]):null
            return mysqlTable.__caheTablas[tabla]
        }
        return  mysqlTable.__caheTablas[tabla] = super.tabla(tabla,t=>{
            //console.log('tabla',tabla)
            typeof callback==="function"?callback(t):null
        }, typeof callback==="function" && verify)
    }

    /**
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    query(query,config={})
    {
        return new Promise((resolver,reject)=>
        {
            this.connection.query(query,config,(error,result)=>
            {
                //console.log(fiels)
                if(error)
                {
                    if(error.errno==1049 )
                    {
                        this.__createDatabase(()=>
                        {
                            this.query(query).then(resolver).catch(reject)
                        })
                    }else {
                        reject(error)
                    }

                }else
                {
                    resolver(result)
                }

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
        let result=this.connection.escape(str)
        if(/^'.*'$/.test(result))
        {
            return result.slice(1,-1)
        }
        return result

    }
    /**
    * termina la conexion
    */
    end()
    {
        this.connection.end()
    }
    /**
    * verificara la existencia de la tabla
    * en la base de datos y pasa lo metadatos  al valor de la promesa
    * @param {string} table - nombre de la tabla
    * @return {Promise}
    */
    __keysInTable(table)
    {
        return new Promise((res,rej)=>
        {
            this.query(`${this.__information_schema}'${table}' and TABLE_SCHEMA='${this.connection.config.database}'`)
                .then(result=>{
                    this.inModel(table,result.length==0)
                        .then(res).catch(e=>
                        {
                            if(e===undefined)
                            {
                                if(result.length==0)
                                    rej("la tabla no existe")
                                else
                                    this.__procesingKeys(table,result,res)
                            }else
                            {
                                rej(e)
                            }
                        })
                }).catch(rej)
        })

    }
    /**
    * intenta crear la base de datos
    *
    */
    __createDatabase(callback)
    {
        let database =this.connection.config.database
        this.config=this.connection.config
        this.config.database=undefined
        this.connection=mysql.createConnection(this.config)

        this.connection.connect(ok=>
        {
            //console.log(ok)
            this.query(`CREATE DATABASE ${database};`).then(()=>
            {
                this.query(`use ${database}`)
                    .then(()=>
                    {

                        this.__connectCallback(ok)
                        callback()
                    }).catch(e=>this.__connectCallback(e))
            }).catch(e=>this.__connectCallback(e))
        })
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
        let colums=new Array(data.length)
        for(let item of data)
        {
            colums[item.ORDINAL_POSITION-1]={
                name:item.COLUMN_NAME,
                type:item.COLUMN_TYPE,
                defaultNull:item.IS_NULLABLE == "YE" ? true : false,
                primary:item.COLUMN_KEY == "PRI",
                unique:item.COLUMN_KEY == "UNI",
                defaul:item.COLUMN_DEFAULT,
                autoincrement:item.EXTRA == "auto_increment"
            }

        }
        callback({
            tabla:table,
            colums:colums

        })
    }
}

module.exports=mysqlTable
