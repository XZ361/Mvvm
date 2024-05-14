const compileUtil={
  getVal(expr,vm){
    return expr.split('.').reduce((data,currentValue)=>{
      // console.log(currentValue);
      return data[currentValue];
    },vm.$data)
  },
  text(node,expr,vm){
    const value = this.getVal(expr,vm);
    this.updater.textUpdater(node,value);
  },
  html(node,expr,vm){
    const value = this.getVal(expr,vm);
    this.updater.htmlUpdater(node,value);
  },
  model(node,expr,vm){
    const value = this.getVal(expr,vm);
    this.updater.modelUpdater(node,value);
  },
  on(node,expr,vm,eventName){

  },
  updater:{
    textUpdater(node,value){
      node.textContent = value;
    },
    htmlUpdater(node,value){
      node.innerHTML = value;
    },
    modelUpdater(node,value){
      // console.log(value);
      node.value = value;
    }
  }
}
class Compile {
  constructor(el,vm) {
    // 判断当前el是否是一个元素节点对象,满足则赋值，否则获取节点对象
    this.el = this.isElementNode(el) ?  el : document.querySelector(el)
    this.vm =vm; 
    // 1.获取文档碎片对象，放入内存中，减少页面的回流和重绘
    const fragment = this.node2Fragment(this.el)
    // console.log(fragment);

    //2.编译模版
     this.compile(fragment); 

    // 3.追加子元素到根节点
    this.el.appendChild(fragment)
  }
  compile(fragment){
    // 获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(child=>{
      // 元素节点，编译元素节点
      if(this.isElementNode(child)){
        // console.log('元素节点',child);
        this.compileElement(child);
      }else{
        // 文本节点,编译文本节点 
        // console.log('文本节点',child);
        this.compileText(child);
      }

      if(child.childNodes && child.childNodes.length){
        // 递归调用，遍历嵌套子元素
        this.compile(child)
      }
    })
  }
  compileElement(node){
    // console.log(node);
    // <div v-text="text"></div>
    // <div v-html="htmlStr"></div>
    // <input type="text" v-model="msg">

    const attributes = node.attributes;
    [...attributes].forEach(attr=>{
      // console.log(attr);
      const {name,value} = attr
      // console.log(name,value);
      // 判断当前name是否是一个vue指令,v-text v-html v-model v-on:click 
      if(this.isDireative(name)){
        const [,directive] = name.split('-'); //text html model on:click 
        const [dirName,eventName] = directive.split(':'); //对on:click分割处理,text html model on
        compileUtil[dirName](node,value,this.vm,eventName);
      }
    })
  }
  compileText(node){

  }
  node2Fragment(el){
    // 创建文档碎片
    const f = document.createDocumentFragment();
    let firstChild
    while(firstChild = el.firstChild){
      f.appendChild(firstChild)
    }
    return f
  }
  isDireative(attrName){
    return attrName.startsWith('v-');
  }
  isElementNode(node){
    // nodeType === 1 则当前节点是元素节点对象
    return node.nodeType===1;
  }
}
class Tvue {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    this.$options = options; 
    if(this.$el){
      // 1实现一个数据观察者Observer

      // 2:实现一个模版解析器Compile
      new Compile(this.$el,this)
    }
  }
}
