const mysql=require("mysql2")
const { Connection: connectionMysql } = mysql
const { MYSQL_DB, connect, dbResult } = require("dbtabla")
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
        this._escapeChar="`"
        this._information_schema = "SELECT information_schema.columns.* FROM information_schema.columns WHERE table_name="
        this._connectCallback=()=>{}
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
        this._connectCallback=callback

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
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    query(query, config = {}) {
        this.lastSql = query;
        return new Promise((resolver, reject) => {
            const options = (typeof config === 'object' && Object.keys(config).length > 0)
                ? { sql: query, ...config }
                : query;

            this.connection.query(options, (error, result) => {
                if (error) {
                    if (error.errno == 1049) {
                        this._createDatabase(() => {
                            this.query(query, config).then(resolver).catch(reject);
                        });
                    } else {
                        reject(error);
                    }
                } else {
                    if (Array.isArray(result)) {
                        resolver(new dbResult(this, result));
                    } else {
                        resolver(result);
                    }
                }
            });
        });
    }
    /**
    * escapa el texto sql
    * @param {string} str - texto
    * @return {string}
    */
    _escapeString(str)
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
    * @param {boolean} createOfModel - indica si se obtendran los datos a partir del modelo existente
    * @return {Promise}
    */
    _keysInTable(table,createOfModel=true)
    {
        return new Promise(async (res,rej)=>
        {
            let result =  await this.query(`${this._information_schema}'${table}' and TABLE_SCHEMA='${this.connection.config.database}'`)
            if(result.error)
            {
                rej(result.error)
            }  
            if(createOfModel)
            {
                this.inModel(table,result.length==0)
                    .then(res).catch(e=>
                    {
                        if(e===undefined)
                        {
                            if(result.length==0)
                                rej(`la tabla ${table} no existe`)
                            else
                                this._procesingKeys(table,result,res)
                        }else
                        {
                            rej(e)
                        }
                    })
            }else
            {        
                if(result.length==0)
                {
                    rej( `la tabla ${table} no existe`)
                }else
                {
                    this._procesingKeys(table,result,res)
                }
            }  
                
        })

    }
    
    /**
    * intenta crear la base de datos
    *
    */
    _createDatabase(callback)
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
                        this.connection.config.database=this.config.database=database
                        this._connectCallback(ok)
                        callback()
                    }).catch(e=>this._connectCallback(e))
            }).catch(e=>this._connectCallback(e))
        })
    }

    /**
    * procesa los metadatos y los pasa a la funcion
    * @param {string} table - nombre de la tabla
    * @param {array} data - metadatos crudos
    * @param {function} callback - funcion a ejecutar cuando se obtengan los metadatos
    *
    */
    _procesingKeys(table, data, callback) {
        let colums = new Array(data.length)
        for (let item of data) {
            colums[item.ORDINAL_POSITION - 1] = {
                name: item.COLUMN_NAME,
                type: item.COLUMN_TYPE,
                defaultNull: item.IS_NULLABLE == "YES" ? true : false,
                primary: item.COLUMN_KEY == "PRI",
                unique: item.COLUMN_KEY == "UNI",
                default: item.COLUMN_DEFAULT,
                autoincrement: item.EXTRA == "auto_increment"
            }

        }
        callback({
            tabla: table,
            colums: colums,
            colum: colums

        })
    }
}

module.exports=mysqlTable
