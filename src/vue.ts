
interface Option{
    data:()=>{
        [key:string]:any
    },
    el:string,
    methods:{
        [key:string]:(...arg: any[])=>void
    },
    computed:Object,
    watch:Object,
    mounted:()=>void
}
class Vue {
    $data:Object
    $el:HTMLElement
    $option:Option
    $watchEvent:{
        [key:string]:Watch[]
    } = {}
    constructor(option:Option) {
        this.$option = option
        //挂载数据
        this.$data = option.data() as Object
        this.proxyData()
        this.observe()
            //挂载dom
        if (option.el === undefined) {
            throw "未绑定dom节点"
        }else{
            this.$el = document.querySelector(option.el) as HTMLElement
        }
            //更新dom
        this.compile(this.$el);

        //生命周期  以mounted为列
        if (typeof option.mounted == "function") {
            //改变this指向
            option.mounted.bind(this)()
        }
    }
    //给vue附属性
    //data中的属性值和Vue大对象的属性保持双向(劫持)
    proxyData(){
        for(let key in this.$data){
            Object.defineProperty(this,key,{
                get(){
                    return this.$data[key]
                },
                set(val:any){
                    this.$data[key] = val
                }
            })
        }
    }
    //触发data中的数据发生变化来执行watch中恶毒update
    observe(){
        for(let key in this.$data){
            let value = this.$data[key]
            let that = this as Vue
            Object.defineProperty(this.$data,key,{
                get(){
                    return value
                },
                set(val){
                    value = val;
                    if (that.$watchEvent[key]) {
                        that.$watchEvent[key].forEach((item,index)=>{
                            item.update()
                        })
                    }
                }
            })
        }
    }
    compile(node:HTMLElement) {
        node.childNodes.forEach((el, index) => {
            const item = el as HTMLElement
            //如果是节点元素
            if (item.nodeType === 1) {
                //判断是否绑定事件
                const event = '@click'
                if(item.hasAttribute(event)){
                    let handle = item.getAttribute(event)?.trim() as string
                    if (this.isValidKey(handle,this.$option.methods) && typeof this.$option.methods[handle] == "function") {
                        item.onclick = (...arg:any[])=>{this.$option.methods[handle].apply(this,arg)}
                    }
                }
                if(item.hasAttribute("v-model")){
                    let vmKey = item.getAttribute("v-model")?.trim() as string
                    if (this.hasOwnProperty(vmKey)) {
                        let input = item as HTMLInputElement
                        input.value = this[vmKey]
                        input.addEventListener("input",()=>{this.$data[vmKey] = input.value})
                    }
                }


                if (item.childNodes.length != 0) {
                    //递归继续编译
                    this.compile(item as HTMLElement) 
                }
            }
            //如果是文本元素
            if (item.nodeType === 3) {
                let reg = /\{\{(.*?)\}\}/g;
                const text = item.textContent as string
                item.textContent = text.replace(reg, (match:string, vmKey:string) => {
                    vmKey = vmKey.trim()
                    if (!this.isValidKey(vmKey,this)) {
                        throw `data中没有属性"${vmKey}"`
                    } else {
                        const watch = new Watch(this,vmKey,item,"textContent")
                        if (this.$watchEvent[vmKey]) {
                            this.$watchEvent[vmKey].push(watch)
                        }else{
                            this.$watchEvent[vmKey] = []
                            this.$watchEvent[vmKey].push(watch)
                        }
                        return this.$data[vmKey]
                    }
                })
            }
        });
    }
    isValidKey(
        key: string | number | symbol,
        object: object
    ): key is keyof typeof object {
        return key in object;
    }
    
}
class Watch{
    vm:Vue
    key:string
    node:HTMLElement
    attr:string
    constructor(vm:Vue,key:string,node:HTMLElement,attr:string){
        this.vm = vm
        this.key = key
        this.node = node
        this.attr = attr
    }
    //执行update
    update(){
        this.node[this.attr] = this.vm[this.key]
    }
}