const model=require("tabla-model")
const test2=new model("test4",[
    {
        name:"id_key2",
        type:"int",
        primary:true,
        autoincrement:true
    },
    {
        name:"una",
        type:"text",
        defaultNull:false,
    },
    {
        name:"row2",
        type:"int",
    },
    {
        name:"dos",
        type:"date",
    }
])
test2.insert(1,"hola",14,new Date())
module.exports=test2
