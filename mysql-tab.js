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
    constructor(params, connect = true) {
        // Detectamos si params es una instancia de Pool o Connection
        const isPool = params && (params.constructor.name === 'Pool' || typeof params.query === 'function' && params.getConnection);
        const isConn = params && (params.constructor.name === 'Connection' || params instanceof connectionMysql);

        if (isPool || isConn) {
            super({}, MYSQL_DB)
            this.connection = params
        } else {
            super(params, MYSQL_DB)
            // Usamos Pool por defecto para mejor gestión de conexiones
            this.connection = mysql.createPool(this.config)
            // En Pool no hace falta llamar a .connect() manualmente, 
            // pero mantenemos la compatibilidad si se desea testear la conexión
            if (connect)
                this.connect()
        }
        this._escapeChar = "`"
        this._information_schema = "SELECT information_schema.columns.* FROM information_schema.columns WHERE table_name="
        this._connectCallback = () => { }
        this._transactionConn = null

        // Definimos _escapeString en la instancia para que no sea sobreescrita por Connect
        this._escapeString = (str) => {
            // El Pool también tiene el método escape
            let result = this.connection.escape(str)
            if (/^'.*'$/.test(result)) {
                return result.slice(1, -1)
            }
            return result
        }
    }

    /**
    * Obtiene una conexión dedicada para transacciones si no existe una.
    * @returns {Promise<Connection>}
    */
    _getTransactionConn() {
        return new Promise((resolve, reject) => {
            if (this._transactionConn) return resolve(this._transactionConn);
            
            // Si this.connection es una Connection simple (no Pool), la usamos directamente
            if (!this.connection.getConnection) {
                this._transactionConn = this.connection;
                return resolve(this._transactionConn);
            }

            this.connection.getConnection((err, conn) => {
                if (err) return reject(err);
                this._transactionConn = conn;
                resolve(conn);
            });
        });
    }

    /**
    * envia una sentencia START TRANSACTION a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    async beginTransaction(config = {}) {
        await this._getTransactionConn();
        return this.query("START TRANSACTION", config);
    }

    /**
    * envia una sentencia commit a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    async commit(config = {}) {
        try {
            return await this.query("COMMIT", config);
        } finally {
            this._releaseTransactionConn();
        }
    }

    /**
    * envia una sentencia rollback a la base de datos
    *
    * @param {object} config - configuracion de la query mysql
    * @return {Promise}
    */
    async rollback(config = {}) {
        try {
            return await this.query("ROLLBACK", config);
        } finally {
            this._releaseTransactionConn();
        }
    }

    /**
     * Libera la conexión de transacción de vuelta al pool
     */
    _releaseTransactionConn() {
        if (this._transactionConn) {
            // Solo liberamos si viene de un Pool
            if (typeof this._transactionConn.release === 'function') {
                this._transactionConn.release();
            }
            this._transactionConn = null;
        }
    }

    /**
    * connecta con la base de datos
    * @param {function} callback - funcion que se  ejecutara al connectar
    */
    connect(callback = () => { }) {
        this._connectCallback = callback
        
        // En un Pool, podemos usar getConnection para verificar la salud de la conexión
        if (this.connection.getConnection) {
            this.connection.getConnection((err, conn) => {
                if (err) {
                    if (err.errno != 1049) callback(err);
                } else {
                    conn.release();
                    callback();
                }
            });
        } else {
            this.connection.connect(ok => {
                if (ok) {
                    if (ok.errno != 1049) callback(ok)
                } else {
                    callback(ok)
                }
            })
        }
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

            // Si hay una transacción activa, usamos esa conexión. Si no, usamos el pool.
            const runner = this._transactionConn || this.connection;

            runner.query(options, (error, result) => {
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
            let result =  await this.query(`${this._information_schema}'${table}' and TABLE_SCHEMA='${this.config.database}'`)
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
    _createDatabase(callback) {
        // En Pool, el config está en connection.pool.config o lo tomamos de this.config
        let database = this.config.database;
        let tempConfig = { ...this.config, database: undefined };

        // Si es un Pool, lo cerramos para crear una conexión temporal
        if (this.connection.getConnection) {
            this.connection.end(() => {
                const tempConn = mysql.createConnection(tempConfig);
                tempConn.connect(err => {
                    if (err) return this._connectCallback(err);
                    tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`, (err) => {
                        if (err) {
                            tempConn.end();
                            return this._connectCallback(err);
                        }
                        tempConn.end();
                        // Re-creamos el Pool ahora con la base de datos
                        this.config.database = database;
                        this.connection = mysql.createPool(this.config);
                        callback();
                    });
                });
            });
        } else {
            // Caso de conexión simple (Legacy)
            this.connection.end(() => {
                this.connection = mysql.createConnection(tempConfig);
                this.connection.connect(ok => {
                    this.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`).then(() => {
                        this.query(`use \`${database}\``)
                            .then(() => {
                                this.config.database = database;
                                callback();
                            }).catch(e => this._connectCallback(e))
                    }).catch(e => this._connectCallback(e))
                })
            });
        }
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
