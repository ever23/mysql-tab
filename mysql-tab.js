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
            this.connect()
        this.__escapeChar="`"
        this.__information_schema = "SELECT information_schema.columns.* FROM information_schema.columns WHERE table_name="
        mysqlTable.__caheTablas={}
        this.__connectCallback=()=>{}
    }
    /**
    * conecta con la base de datos
    * @param {function} callback - funcion que se  ejecutara al conectar
    */
    connect(callback=()=>{})
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

    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
    * @return {dbTabla}
    */
    tabla(tabla,callback,create=true)
    {
        if(typeof callback ==="boolean")
            create=callback
        if(typeof mysqlTable.__caheTablas[tabla]!=="undefined")
        {

            typeof callback==="function"?callback(mysqlTable.__caheTablas[tabla]):null
            return mysqlTable.__caheTablas[tabla]
        }
        return  mysqlTable.__caheTablas[tabla] = super.tabla(tabla,t=>{
            //console.log('tabla',tabla)
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
                    if(error.errno==1049)
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
    * en la base de datos y pasa lo metadatos  al valor de la promesa
    * @param {string} table - nombre de la tabla
    * @return {Promise} 
    */
    __keysInTable(table)
    {
        return new Promise((res,rej)=>
        {
            this.query(`${this.__information_schema}'${table}' and TABLE_SCHEMA='${this.conection.config.database}'`)
                .then(result=>{
                    if(!this.inModel(table,res,result.length==0))
                    {
                        if(result.length==0)
                            rej("la tabla no existe")
                        else
                            this.__procesingKeys(table,result,res)
                    }

                }).catch(rej)
        })

    }
    /**
    * intenta crear la base de datos
    *
    */
    __createDatabase(callback)
    {
        let database =this.config.database
        this.config.database=""
        this.conection=mysql.createConnection(this.config)

        this.conection.connect(ok=>
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
