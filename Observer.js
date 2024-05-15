class Watcher{
  constructor(expr,vm,cb){
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 先将旧值保存起来
    this.oldVal = this.getOldVal();
  }
  getOldVal(){
    Dep.target = this;//将watcher和Dep做关联
    const oldVal = compileUtil.getVal(this.expr,this.vm);
    Dep.target = null;

    return oldVal;
  }
  update(){
    const newVal = compileUtil.getVal(this.expr,this.vm);
    if(newVal!==this.oldVal){
      this.cb(newVal);
    }
  }
}
class Dep{
  // 依赖收集器
  constructor(){
    this.subs=[];
  }
  // 收集观察者
  addSub(watcher){
    // 添加订阅者
    this.subs.push(watcher)
  }
  notify(){
    // console.log('观察者',this.subs);
    // 遍历通知每个Watcher,执行更新回调
    this.subs.forEach(sub=>sub.update())
  }
}
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
      const dep = new Dep();
      Object.defineProperty(obj,key,{
        enumerable:true,
        configurable:false,
        get(){
          // 订阅数据时，向Dep中添加Watcher
          Dep.target && dep.addSub(Dep.target)
          return value
        },
        set:(newValue)=>{
          // console.log(this);
          this.observe(newValue);
          if(newValue!==value){
            value=newValue
          }
          // 告诉Dep,通知Watcher
          dep.notify();
        }
      })
    }
}