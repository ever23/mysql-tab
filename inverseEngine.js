const mysql = require("./mysql-tab")
const Model = require("tabla-model")
const path = require("path")
const EventEmiter = require("events")
class inverseEngine extends EventEmiter
{
    /**
    * @param {boolean|array} inicializar - inidica si se optendran los datos de inicializacion si es un array se tomara como la lista de tablas a inicializar
    * @param {array} tablas - lista de tablas a inicializar 
    *
    */
    constructor(inicializar,tablas)
    {
        super()
        this.modelos=[]
        this.ini=inicializar
        this.tablas=tablas
    }
    /*
    * conecta con la base de datos 
    * @param {object} configuracion para mysql 
    */
    connect(config)
    {
        this.__connect= new mysql(config,false)
        this.__connect.connect(e=>
        {
            this.emit("connect",e)
        })
    }
    /**
    * obtiene los metadatos de las tablas en la base de datos y los trasnforma a modelos 
    * @return {Promise} - el valor de la promesa es un array con la lista de modelos 
    */
    parse()
    {
        if(this.tablas.length>0)
        {
            return new Promise(async (res,rej)=>
            {
                this.emit("listTables",this.tablas)
                for(let tabla of this.tablas)
                {
                    let result= await this.createModel(tabla).catch(e=>e)
                    if(result)
                    {
                        return rej(result)
                    }
                }
                this.emit("completModel")
                res(this.modelos)
            })
        }else
        {
            return this.__connect.query(`SELECT * FROM information_schema.tables where TABLE_SCHEMA='${this.__connect.config.database}'`)
                .then(async d=>
                {
                    this.emit("listTables",d.map(data=>data.TABLE_NAME))
                    for(let item of d)
                    {
                        if(item.TABLE_TYPE==="BASE TABLE")
                        {
                            let result= await this.createModel(item.TABLE_NAME).catch(e=>e)
                            if(result)
                            {
                                throw result
                            }
                        }
                    }
                    this.emit("completModel")
                })
        }
    }
    /**
    * obtiene los metadatos de una tabla en la base de datos y los trasnforma a modelos 
    * @param {string} tabla - nombre de la tabla 
    */
    async createModel(tabla)
    {
        this.emit("preModelTable",tabla)
        let data =await this.__connect.__keysInTable(tabla,false).catch(e=>({error:e}))
        if(data.error)
        {
            throw data.error
        }
        let model=new Model(data.tabla,data.colums)
        await this.foreingKey(data.tabla,model)
        if((typeof this.ini ==="boolean" && this.ini) || (this.ini instanceof Array && this.ini.find(t=>t==tabla)))
            await this.inicializacion(data.tabla,model)
        this.modelos.push(model)
        this.emit("postModelTable",model) 
    }
    /**
    * Obtiene los datos de inicializacion de una tabla en la base de datos y los agrega al modelo
    * @param {string} tabla - nombre de la tabla 
    * @param {tablaModel} model -- modelo 
    * @return {Promise}
    */
    inicializacion(tabla,model)
    {
        let t=this.__connect.tabla(tabla)
        return t.select().then(d=>
        {
            for(let item of d)
            {
                model.insert(item)
            }
        })
    }
    /**
    * Obtiene las claves foraneas de una tabla y las agrega al modelo
    * @param {string} tabla - nombre de la tabla 
    * @param {tablaModel} model -- modelo 
    * @return {Promise} 
    */
    foreingKey(tabla,model)
    {
        return this.__connect.query(`SELECT * FROM information_schema.key_column_usage WHERE table_name='${tabla}' and TABLE_SCHEMA='${this.__connect.config.database}'`)
            .then(async data1=>
            {
                for(let item of data1)
                {
                    if(item.REFERENCED_TABLE_NAME==null)
                        continue
                    let keys ={
                        key:item.COLUMN_NAME,
                        reference:item.REFERENCED_TABLE_NAME,
                        keyReference:item.REFERENCED_COLUMN_NAME
                    }
                    let data2= await this.__connect.query(`SELECT * FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE table_name='${tabla}'  and CONSTRAINT_SCHEMA='${this.__connect.config.database}' and  REFERENCED_TABLE_NAME='${item.REFERENCED_TABLE_NAME}'`)
                    if(data2.error)
                    {
                        throw data2.error
                    }
                    if(data2.length==1)
                    {
                        keys.match=data2[0].MATCH_OPTION
                        keys.onUpdate=data2[0].UPDATE_RULE
                        keys.onDelete=data2[0].DELETE_RULE
                    }
                    model.foreingKey(keys)
                    
                }
            })
    }
    /**
    * Crea los archivos correspondientes a los modelos obtenidos 
    * @param {string} dir - directorio donde se guardarn los archivos 
    */
    save(dir)
    {
        return new Promise((res,rej)=>
        {
            this.parse().then(()=>
            {
                this.__connect.end()
                
                for(let i=0;i<this.modelos.length;i++)
                {
                    try
                    {
                        this.modelos[i].saveModel(path.join(dir,"/"+this.modelos[i].tabla+".js"))
                    }catch(e)
                    {
                        return rej(e)
                    }
                    
                }
                this.emit("completFiles")
                res()
            }).catch(e=>
            {
                this.__connect.end()
                rej(e)
            })
        })
    }
}
module.exports=inverseEngine