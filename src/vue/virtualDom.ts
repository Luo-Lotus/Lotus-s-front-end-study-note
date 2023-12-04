function h(sel:string,data:Object,params:string|Array<vnode>):vnode{
    if (typeof params == 'string') {
        return new vnode(sel,data,undefined,params,undefined)
    }else{
        const children:Array<vnode> = []
        params.forEach((item,index)=>{
            children.push(item)
        })
        return new vnode(sel,data,children,undefined,undefined)
    }
}
function patch(oldNode:HTMLElement|vnode,newNode:vnode):void{
    if (oldNode instanceof HTMLElement) {
        oldNode = new vnode(oldNode.tagName.toLowerCase(),{},[],undefined,oldNode)
    }
    //判断旧节点和新节点是不是同一个节点
    if (oldNode.sel === newNode.sel) {
        //如果是同一个节点 
        patchVnode(oldNode,newNode)
        
    }else{
        //如果不是就暴力删除，创建插入新的节点
        //吧新的虚拟节点创建为dom及诶点
        let newDom = createElement(newNode)
        const oldDom = oldNode.elm
        if (newNode) {
            //插入新的节点
            oldDom?.parentNode?.insertBefore(newDom,oldDom)
            //删除旧节点
            oldDom?.parentNode?.removeChild(oldDom)
        }
    }
    
}
function patchVnode(oldNode:vnode,newNode:vnode){
    if(newNode.children == undefined){//如果新节点没有children 证明新节点是文本，直接覆盖就行
        if(newNode.text !== oldNode.text){
            (oldNode.elm as HTMLElement).innerText = newNode.text || ''
        }
    }else{//如果新节点有children
        if(oldNode.children != undefined && oldNode.children.length>0){//新的节点和旧的节点都有子节点  !!!!diff算法核心 !!!!diff算法核心 !!!!diff算法核心 !!!!diff算法核心
            updateChildren(oldNode.elm as HTMLElement,oldNode.children,newNode.children)
        }else{//新的有 旧的没有
            //遍历新的节点 添加到dom元素中
            (oldNode.elm as HTMLElement).innerText = ""
            newNode.children.forEach((item,index)=>{
                let childDom = createElement(item)
                oldNode.elm?.appendChild(childDom)
            })
        }
    }
}
function updateChildren(parentNode:HTMLElement,oldCh:Array<vnode>,newCh:Array<vnode>){
    console.log(parentNode,oldCh,newCh);
    let oldStartIdx = 0;
    //旧前的指针
    let oldEndIdx = oldCh.length -1 ; //旧后的指针
    let newStartIdx = 0;//新前的指针
    let newEndIdx = newCh.length -1; //新后的指针
    let oldStartVnode = oldCh[0];//旧前虚拟节点
    let oldEndVnode = oldCh[oldEndIdx]; //旧后虚拟节点
    let newStartVnode = newCh[0] ;// 新前虚拟节点
    let newEndVnode = newCh[newEndIdx]; //新后虚拟节点

    //判断两个key是否相同
    const sameVode = (node1:vnode,node2:vnode):boolean=>{
        return node1.data.key == node2.data.key
    }
    while(oldStartIdx<=oldEndIdx && newStartIdx<=newEndIdx){
        if (oldStartVnode.sel === "none") {
            oldStartVnode = oldCh[++oldStartIdx]
            continue
        }else if (oldEndVnode.sel ==="none"){
            oldEndVnode = oldCh[--oldEndIdx]
            continue
        }
        
        if (sameVode(oldStartVnode,newStartVnode)) {
            //1.旧前 新前
            console.log(1);
            patchVnode(oldStartVnode,newStartVnode)
            if (newStartIdx) newStartVnode.elm = oldStartVnode.elm
            oldStartVnode = oldCh[++oldStartIdx]
            newStartVnode = newCh[++newStartIdx]
        }else if(sameVode(oldEndVnode,newEndVnode)){
            //2.旧后 新后
            console.log(2);
            patchVnode(oldEndVnode,newEndVnode)
            if (newEndIdx) newEndVnode.elm = oldEndVnode.elm
            oldEndVnode = oldCh[--oldEndIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if(sameVode(oldStartVnode,newEndVnode)){
            //3.旧前 新后
            console.log(3);
            patchVnode(oldStartVnode,newEndVnode)
            if (newEndIdx) newEndVnode.elm = oldStartVnode.elm
            parentNode.insertBefore(oldStartVnode.elm as HTMLElement,oldEndVnode.elm?.nextElementSibling as HTMLElement)
            oldStartVnode = oldCh[++oldStartIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if(sameVode(oldEndVnode,newStartVnode)){
            //4.旧后 新前
            console.log(4);
            patchVnode(oldEndVnode,newStartVnode)
            if (newStartIdx) newStartVnode.elm = oldEndVnode.elm
            parentNode.insertBefore(oldEndVnode.elm as HTMLElement,oldStartVnode.elm as HTMLElement)
            oldEndVnode = oldCh[--oldEndIdx]
            newStartVnode = newCh[++newStartIdx]
        }else{
            //5. 查找.
            console.log(5);
            
            //查找所有旧节点
            const keyMap:{[key:string]:number} ={};
            for (let i = oldStartIdx; i < oldEndIdx; i++){
                const key = oldCh[i].data.key
                if ( key) keyMap[key] = i
            }
            //找出和新前节点相同的旧节点
            let idxInOld = keyMap[newStartVnode.data.key as string|number]
            if(idxInOld){
                const elmMove =  oldCh[idxInOld]
                patchVnode(elmMove,newStartVnode)
                //处理过的节点设置为undefined
                oldCh[idxInOld] = new vnode("none",{},undefined,undefined,undefined)
                parentNode.insertBefore(elmMove.elm as HTMLElement,oldStartVnode.elm as HTMLElement)
            }else{
                //如果没有相同的旧节点则创建
                parentNode.insertBefore(createElement(newStartVnode),oldStartVnode.elm as HTMLElement)
            }
            newStartVnode = newCh[++newStartIdx]
        }
    }
    //结束循环后判断新增和删除
    if(oldStartIdx>oldEndIdx){
        const before = newCh[newEndIdx+1]?newCh[newEndIdx+1].elm:null
        for (let i = newStartIdx; i <= newEndIdx; i++) {
           parentNode.insertBefore(createElement(newCh[i]),before as HTMLElement)
        }
    }else{
        //进入删除操作
        for(let i =oldStartIdx;i<=oldEndIdx;i++){
            if (oldCh[i].sel!=="none")  parentNode.removeChild(oldCh[i].elm as HTMLElement)
        }
    }
}
function createElement(node:vnode):HTMLElement{
    let domNode = document.createElement(node.sel)
    //判断是否有子节点
    if(node.children == undefined){
        domNode.innerText = node.text || ''

    }else{
        //递归创建子节点
        node.children.forEach((item,index)=>{
            domNode.appendChild(createElement(item))
        })
    }
    //补充elm属性
    node.elm = domNode
    return domNode
}
export default h
class vnode{
    sel:string
    data:{
        key?:string|number
    }
    children:Array<vnode>|undefined
    text:undefined|string
    elm:undefined|HTMLElement
    constructor(sel:string,data:Object,children:Array<vnode>|undefined,text:undefined|string,elm:undefined|HTMLElement){
        this.sel = sel
        this.data = data
        this.children = children
        this.text = text
        this.elm = elm
    }
}
//console.log(h("div",{},"哈哈哈"));

const vnode1 = h("ul",{},[
    h("li",{key:"e"},"e"),
    h("li",{key:"c"},"c"),
    h("li",{key:"d"},"d"),
])
vnode1.elm = createElement(vnode1)
const vnode2 = h("ul",{},[
    h("li",{key:"a"},"a"),
    h("li",{key:"b"},"b"),
    h("li",{key:"c"},"c"),
    h("li",{key:"d"},"d"),
    h("li",{key:"e"},"e"),

])
vnode2.elm = createElement(vnode2)
//获取到的真实dom
const container = document.getElementById("app") as HTMLElement
patch(container,vnode1)
const btn = document.getElementById("patch") as HTMLButtonElement
btn.onclick = function(){
    patch(vnode1,vnode2)
}