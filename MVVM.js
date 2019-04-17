// 2019-4-4
// lee 
// 草履虫的思考
// 简单模拟vue实现MVVM
/**
 * 实现一个Vue的类
 * 1、实现一个Observer，对数据进行劫持，通知数据的变化（将使用的要点为：Object.defineProperty()方法）
2、实现一个Compile，对指令进行解析，初始化视图，并且订阅数据的变更，绑定好更新函数
ComplieUtil解析指令的公共方法
3、实现一个Watcher，将其作为以上两者的一个中介点，在接收数据变更的同时，让Dep添加当前Watcher，并及时通知视图进行update
4、实现一些VUE的其他功能（Computed、menthods）
 */
// 观察者模式（发布订阅）
class Dep {
    constructor() {
        this.subs = []; //存放所有watcher
    }
    // 订阅　添加watcher
    addSub(watcher) {
        this.subs.push(watcher);
    }
    // 发布
    notify() {
        this.subs.forEach(watcher => watcher.update());
    }
}
// 观察者 vm.$watch(vm,'person.name',(newVal)=>{ })
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 默认存储一个老值
        this.oldValue = this.get();
    }

    get() {
        Dep.target = this;
        // 取值 把这个观察者和数据关联起来
        let val = ComplieUtil.getVal(this.vm,this.expr);
        Dep.target = null;
        return val;
    }
    // 更新操作 数据变化后 会调用观察者中的update方法
    update() {
        let newVal = ComplieUtil.getVal(this.vm,this.expr);
        if (newVal !== this.oldValue) {
            this.cb(newVal);
        }
    }
}

// 实现数据劫持作用
class Observer {
    constructor(data) {
        this.observer(data);
    }
    observer(data) {
        // 如果是对象才观察
        if (data && typeof data === 'object') {
            for (let key in data) {
                this.defineReactive(data, key, data[key])
            }
        }
    }

    defineReactive(obj, key, value) {
        this.observer(value);
        // 给每个属性 都加上具有发布订阅的功能
        let dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,   // 可枚举
            configurable: true, // 可重新定义
            get() {
                // 创建watcher时 会取到对应的内容，并且把watcher放到全局上
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newVal) => { // {person:{name:'lee'}
                // 数据没有变不需要更新
                if (newVal != value) {
                    // 需要递归
                    this.observer(newVal);
                    value = newVal;
                    dep.notify();
                }
            }
        })
    }
}
// 编译器
class Complier {
    constructor(el, vm) {
        // 判断el属性是不是一个元素 如果不是元素 那就获取他 （因为在vue的el中可能是el:'#app'
        // 或者document.getElementById('app')

        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        // 把当前节点中的元素 获取到 放到内存中
        let fragment = this.nodeFragMent(this.el);

        // 把节点中的内容进行替换

        // 编译模板 用数据编译
        this.complie(fragment);
        // 把内容在塞到页面中
        this.el.appendChild(fragment);
    }

    isElementNode(node) { //是不是元素节点
        return node.nodeType === 1;
    }
    //  把节点移动到内存中
    nodeFragMent(node) {
        let frag = document.createDocumentFragment();
        let firstChild;
        while (firstChild = node.firstChild) {
            // appendChild 具有移动性 
            frag.appendChild(firstChild);
        }
        return frag;
    }
    // 是不是指令 
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }
    // 编译元素
    complieElement(node) {
        let attr = node.attributes;
        [...attr].forEach(item => {
            // item 有key = value ,type="text" v-model="person.name"
            let {
                name,
                value: expr
            } = item;
            if (this.isDirective(name)) {
                // v-mode v-html v-bind...
                let [, directive] = name.split('-');
               let [directiveName,eventName] = directive.split(':');
                console.log(node, expr, this.vm, eventName);
                // ComplieUtil[directive](node, expr, this.vm);
                ComplieUtil[directiveName](node, expr, this.vm, eventName);
            }
        })
    }
    // 编译文本
    // 判断当前文本节点中内容是否包括{{}}
    complieText(node) {
        let content = node.textContent;
        var reg = /\{\{(.+?)\}\}/;
        if (reg.test(content)) {
            ComplieUtil['text'](node, content,this.vm); //{{}}
        }
    }
    // 用来编译内存中的dom节点
    complie(node) {
        let childNode = node.childNodes;
        // childNode 是类数组 转换为数组
        [...childNode].forEach(item => {
            // 元素 查找v-开头
            if (this.isElementNode(item)) {
                this.complieElement(item);
                //如果是元素的话  需要把自己传进去
                // 在去遍历子节点
                this.complie(item);
                //    文本 查找{{}}内容
            } else {
                this.complieText(item);
            }
        })

    }
}
// 编译工具
ComplieUtil = {
    // 解析v-model指令
    // node是节点 expr是表达式 vm是实例 person.name vm.$data 解析v-model
    model(node, expr, vm) {
        // 给输入框赋予value属性 node.value = xxx
        let fn = this.updater['modelUpdater'];
        let val = this.getVal(vm, expr);
        // 给输入框加一个观察者 如果稍后数据更i性能了会触发此方法，数据会更新
        new Watcher(vm, expr, (newVal) => {
            fn(node, newVal);
        });
        // 输入事件
        node.addEventListener('input',(e)=>{
            let val = e.target.value; //获取用户输入的内容
            this.setVal(vm, expr, val);
        });
        fn(node, val);
    },
    html() {

    },
    // 返回了一个全的字符串
    getContentVal(vm, expr) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(vm, args[1]);
        });
    },
    text(node, expr, vm) { //expr {{a}} {{b}} {{person.name}}
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        //给表达式{{}}都加上观察者    
            new Watcher(vm, args[1], () => {
                fn(node, this.getContentVal(vm, expr));
            });
            return this.getVal(vm, args[1]);
        });
        let fn = this.updater['textUpdater'];
        fn(node, content);
    },
    on(node, expr, vm,eventName){ //v-on:click
        console.log(node, expr, vm, eventName);
        node.addEventListener(eventName,(e)=>{
            vm[expr].call(vm,e );
        });
       
    },
    updater: {
        modelUpdater(node, value) {
            node.value = value;
        },
        htmlUpdater() {},
        // 处理文本节点
        textUpdater(node, value) {
            node.textContent = value;
        }
    },
    //根据表达式取到的对应的数据  vm.$data expr是如 'person.name'
    getVal(vm, expr) {
      return  expr.split('.').reduce((data, cur) => {
            return data[cur];
        }, vm.$data);
    },
    setVal(vm, expr,value){
        expr.split('.').reduce((data, cur,index,arr) => {
           if(index == arr.length-1){ //索引是最后一项 
               return data[cur] = value;
           }
            return data[cur];
        }, vm.$data);
    }
}
class Vue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        let computed = options.computed;
        let methods = options.methods;
        // 根元素存在在编译模板
        if (this.$el) {
            // 把数据 全部转化成用Object.defineProperty来定义
            new Observer(this.$data);


            // 实现methods中的方法
            for (let key in methods) { 
                Object.defineProperty(this, key, {
                    get() {
                        return methods[key]; //进行了转化操作
                    }
                });
            }
            // 实现computed中的方法
            for (let key in computed) { //有依赖关系
                Object.defineProperty(this.$data, key, {
                    get() {
                        return computed[key].call(this); //进行了转化操作
                    }
                });
            }
               // 把数据获取操作 都代理到vm.$data
            this.proxy(this.$data);
            new Complier(this.$el, this);
        }

    }
    // 代理 去掉$data
    proxy(data){
        for(let key in data){
            Object.defineProperty(this,key,{
                get(){
                    return data[key]; //进行了转化操作
                }
            });
        }
    }
}