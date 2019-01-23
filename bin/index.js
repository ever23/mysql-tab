const inverseEngine = require('../inverseEngine.js')
const path = require('path')
const chalk = require('chalk')
let config={}
let indexhelp=process.argv.findIndex(a=>a=='--help' || a=='--h')
if(indexhelp>=0)
{
    console.log('   --host host mysql ')
    console.log('   --port puerto usado por mysql ')
    console.log('   --user usuario de mysql ')
    console.log('   --password contraseña')
    console.log('   --database base de datos ')
    console.log('   --path directorio de modelos  ')
    console.log('   --inicializar indica si se inicializaran las tablas con los datos en la base de datos   ')
    process.exit()
}
let indexHost=process.argv.findIndex(a=>a=='--host')
if(indexHost>=0)
{
    config.host =process.argv[indexHost+1];
}
let indexPort=process.argv.findIndex(a=>a=='--port')
if(indexPort>=0)
{
    config.port =process.argv[indexPort+1];
}
let indexUser=process.argv.findIndex(a=>a=='--user')
if(indexUser>=0)
{
    config.user =process.argv[indexUser+1];
}
let indexPass=process.argv.findIndex(a=>a=='--password')
if(indexPass>=0)
{
    config.password =process.argv[indexPass+1];
}
let indexDatabase=process.argv.findIndex(a=>a=='--database')
if(indexDatabase>=0)
{
    config.database =process.argv[indexDatabase+1];
}
let dir='.'
let indexDir=process.argv.findIndex(a=>a=='--path')
if(indexDir>=0)
{
    dir=process.argv[indexDir+1];
}
let ini=false
let indexIni=process.argv.findIndex(a=>a=='--inicializar')
if(indexIni>=0)
{
  
    if(process.argv[indexIni+1]!==undefined && /[\w,]+/.test(process.argv[indexIni+1]))
    {
        ini=process.argv[indexIni+1].split(',')
    }else
    {
        ini=true
    }
}
let tablas=[]
let indexTablas=process.argv.findIndex(a=>a=='--tablas')
if(indexTablas>=0)
{
  
    if(process.argv[indexTablas+1]!==undefined && /[\w,]+/.test(process.argv[indexTablas+1]))
    {
        tablas=process.argv[indexTablas+1].split(',')
    }
}

let con = new inverseEngine(ini,tablas)

con.on('listTables',tablas=>
{
    console.log(chalk.green('Lista de tablas obtenidas'))
})
con.on('preModelTable',tabla=>
{
    console.log('Capturando datos de '+chalk.yellow.underline.bold(tabla))
})
con.on('postModelTable',tabla=>
{
    console.log(chalk.green('Tarea completa...'))
})
con.on('completModel',tabla=>
{
    console.log('Creando modelos en '+dir+'...')
})
con.on('completFiles',tabla=>
{
    console.log('Tarea finalizada...')
})
con.connect(config)
con.on('connect',e=>
{
    
    if(e)
    {
        console.log(chalk.red(e))
    }else
    {
        console.log(chalk.green('conectado a la base de datos'))
        con.save(path.join(process.env.PWD,dir))
    }
    
})

