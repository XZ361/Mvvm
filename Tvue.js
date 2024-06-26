const compileUtil={
  getVal(expr,vm){
    return expr.split('.').reduce((data,currentValue)=>{
      // console.log(currentValue);
      return data[currentValue];
    },vm.$data)
  },
  setVal(expr,vm,inputVal){
    return expr.split('.').reduce((data,currentValue)=>{
      // console.log(currentValue);
      data[currentValue] = inputVal;
    },vm.$data)
  },
  getContentVal(expr,vm){
    return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
      // console.log(args);
      return this.getVal(args[1],vm)
    })
  },
  text(node,expr,vm){
    let value;
    // {{person.name}}
    if(expr.indexOf('{{')!==-1){
      value = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
        // console.log(args);
        new Watcher(args[1],vm,()=>{
          this.updater.textUpdater(node,this.getContentVal(expr,vm));
        })
        return this.getVal(args[1],vm)
      })
    }else{
    // v-text 
      value = this.getVal(expr,vm);
      new Watcher(expr,vm,(newVal)=>{
        this.updater.textUpdater(node,newVal);
      })
    }
    this.updater.textUpdater(node,value);
  },
  html(node,expr,vm){
    const value = this.getVal(expr,vm);
    // 绑定观察者，将来数据发生变化，触发这里的回调，进行更新
    new Watcher(expr,vm,(newVal)=>{
      this.updater.htmlUpdater(node,newVal);
    })
    this.updater.htmlUpdater(node,value);
  },
  model(node,expr,vm){
    const value = this.getVal(expr,vm);
    // 绑定更新函数-》数据驱动视图
    new Watcher(expr,vm,(newVal)=>{
      this.updater.modelUpdater(node,newVal);
    })
    // 视图变化，导致数据更新
    node.addEventListener('input',(e)=>{
      this.setVal(expr,vm,e.target.value);
    })
    this.updater.modelUpdater(node,value);
  },
  on(node,expr,vm,eventName){
    // console.log(vm);
    const fn = vm.$options.methods && vm.$options.methods[expr];
    // console.log(fn);
    node.addEventListener(eventName,fn.bind(vm),false)
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
        // 更新数据 数据驱动视图
        compileUtil[dirName](node,value,this.vm,eventName);
        // 删除标签上的指令
        node.removeAttribute('v-'+directive);
      }else if(this.isEventName(name)){
        const [,eventName] = name.split('@'); //对@click分割处理,
        // 更新数据 数据驱动视图
        compileUtil['on'](node,value,this.vm,eventName);
        // 删除标签上的指令
        node.removeAttribute('@'+eventName);
      }
    })
  }
  compileText(node){
    // {{}}
    // console.log(node.textContent);
    const content = node.textContent;
    // 正则匹配双大括号
    if(/\{\{(.+?)\}\}/g.test(content)){
      // console.log(content);
      compileUtil['text'](node,content,this.vm);
    }
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
  isEventName(attrName){
    return attrName.startsWith('@')
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
      new Observer(this.$data)
      // 2:实现一个模版解析器Compile
      new Compile(this.$el,this)
      // 3.实现属性代理proxy
      this.proxyData(this.$data)
    }
  }
  proxyData(data){
    for(const key in data){
      Object.defineProperty(this,key,{
        get(){
          return data[key]
        },
        set(newVal){
          data[key]=newVal;
        }
      })
    }
  }
}
