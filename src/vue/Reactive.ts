//全局变量
let activeEffect: (() => void) | null = null;
let targetMap = new WeakMap();

//手写reactive
function reactive(target: any) {
  const handler: ProxyHandler<any> = {
    get(target: any, key: any, receiver: any) {
      track(receiver, key); // 访问时收集依赖
      return Reflect.get(target, key, receiver);
    },
    set(target: any, key: string | symbol, value: any, receiver: any): boolean {
      Reflect.set(target, key, value, receiver);
      trigger(receiver, key); // 设值时自动通知更新
      return true;
    },
  };
  return new Proxy(target, handler);
}
const person = reactive({ name: "林三心", age: 22 }); // 传入reactive
let nameStr1 = "";
const effectNameStr1 = () => {
  nameStr1 = `${person.name}是个大菜鸟`;
};
effect(effectNameStr1);
function effect(fn: () => void) {
  activeEffect = fn;
  activeEffect();
  activeEffect = null; // 执行后立马变成null
}
function track(target: any, key: any) {
  // 如果此时activeEffect为null则不执行下面
  // 这里判断是为了避免例如console.log(person.name)而触发track
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  dep.add(activeEffect); // 把此时的activeEffect添加进去
}
function trigger(target: any, key: any) {
  let depsMap = targetMap.get(target);
  if (depsMap) {
    const dep = depsMap.get(key);
    if (dep) {
      dep.forEach((effect: any) => effect());
    }
  }
}
console.log(nameStr1);

/* WeakMap: {
  pserson =  Map: {
    name = Set[deps1,deps2]
  }
} */
