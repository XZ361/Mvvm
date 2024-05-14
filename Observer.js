class Observer{
    constructor(data){
        this.observe(data)
    }
    observe(data){
      if(data && typeof data==='object'){
        // console.log(Object.keys(data));
        Object.keys(data).forEach(key=>{
          // 劫持第一层数据
          this.defineReactive(data,key,data[key])
        })
       }
    }
    defineReactive(obj,key,value){
      // 劫持嵌套数据
      this.observe(value);
      Object.defineProperty(obj,key,{
        enumerable:true,
        configurable:false,
        get(){
          // 订阅数据时，向Dep中添加Watcher
          return value
        },
        set:(newValue)=>{
          // console.log(this);
          this.observe(newValue);
          if(newValue!==value){
            value=newValue
          }
        }
      })
    }
}