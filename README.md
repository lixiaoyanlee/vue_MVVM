### 目前实现数据双向绑定主要有一下几种方式：
1. 脏值检测(angular)：
以典型的mvvm框架angularjs为代表，angular通过检查脏数据来进行UI层的操作更新。关于angular的脏检测，有几点需要了解些：
脏检测机制并不是使用定时检测。
脏检测的时机是在数据发生变化时进行。
 angular对常用的dom事件，xhr事件等做了封装， 在里面触发进入angular的digest流程。
在digest流程里面， 会从rootscope开始遍历， 检查所有的watcher。 （关于angular的具体设计可以看其他文档，这里只讨论数据绑定），那我们看下脏检测该如何去做：主要是通过设置的数据来需找与该数据相关的所有元素，然后再比较数据变化，如果变化则进行指令操作。
  2. 前端数据劫持（Hijacking）(vue)：基本思路：通过Object.defineProperty() 去劫持数据每个属性对应的getter和setter。当有数据读取和赋值操作时则调用节点的指令，这样使用最通用的=等号赋值就可以了。
  3. 发布-订阅模式(backbone)：通过发布消息，订阅消息进行数据和视图的绑定监听。

比较老的实现方式，使用观察者编程模式，主要思路是通过在数据对象上定义get和set方法等，调用时手动调用get或set数据，改变数据后触发UI层的渲染操作；以视图驱动数据变化的场景主要应用与input、select、textarea等元素
，当UI层变化时，通过监听dom的change，keypress，keyup等事件来触发事件改变数据层的数据。整个过程均通过函数调用完成。



1、实现一个Observer，对数据进行劫持，通知数据的变化（将使用的要点为：Object.defineProperty()方法）

2、实现一个Compile，对指令进行解析，初始化视图，并且订阅数据的变更，绑定好更新函数

3、实现一个Watcher，将其作为以上两者的一个中介点，在接收数据变更的同时，让Dep添加当前Watcher，并及时通知视图进行update

4、实现一些VUE的其他功能（Computed、menthods）

5、实现MVVM，整合以上几点，作为一个入口函数
