class MyPromise {
  state = "pending";
  value: any = undefined;
  reason: any = undefined;
  //存放成功数组
  onResolvedCallbacks = Array<() => void>();
  //存放失败数组
  onRejectedCallbacks = Array<() => void>();
  // 构造器
  constructor(
    executor: (
      reject: (...arg: any[]) => any,
      resolve: (...arg: any[]) => any
    ) => void
  ) {
    // 成功
    let resolve = (value: any) => {
      if (this.state === "pending") {
        this.state = "fulfilled";
        this.value = value;
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };
    // 失败
    let reject = (reason: any) => {
      if (this.state === "pending") {
        this.state = "reject";
        this.reason = reason;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };
    // 立即执行
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  then(
    onFulfilled?: (value: any) => any,
    onRejected?: (reason: any) => any
  ): MyPromise {
    // 声明返回的promise2
    let promise2 = new MyPromise((resolve, reject) => {
      if (this.state === "fulfilled") {
        let x = onFulfilled && onFulfilled(this.value);
        // resolvePromise函数，处理自己return的promise和默认的promise2的关系
        this.resolvePromise(promise2, x, resolve, reject);
      }
      if (this.state === "rejected") {
        let x = onRejected && onRejected(this.reason);
        this.resolvePromise(promise2, x, resolve, reject);
      }
      if (this.state === "pending") {
        this.onResolvedCallbacks.push(() => {
          let x = onFulfilled && onFulfilled(this.value);
          this.resolvePromise(promise2, x, resolve, reject);
        });
        this.onRejectedCallbacks.push(() => {
          let x = onRejected && onRejected(this.reason);
          this.resolvePromise(promise2, x, resolve, reject);
        });
      }
    });
    // 返回promise，完成链式
    return promise2;
  }
  private resolvePromise(
    promise2: MyPromise,
    x: any,
    resolve: (value: any) => void,
    reject: (reason: any) => void
  ) {
    /*
Otherwise, if x is an object or function,Let then be x.then
x 不能是null
x 是普通值 直接resolve(x)
x 是对象或者函数（包括promise），let then = x.then
2、当x是对象或者函数（默认promise）
声明了then
如果取then报错，则走reject()
如果then是个函数，则用call执行then，第一个参数是this，后面是成功的回调和失败的回调
如果成功的回调还是pormise，就递归继续解析
3、成功和失败只能调用一个 所以设定一个called来防止多次调用
      */
    // 循环引用报错
    if (x === promise2) {
      // reject报错
      return reject(new TypeError("Chaining cycle detected for promise"));
    }
    // 防止多次调用
    let called: boolean = false;
    // x不是null 且x是对象或者函数
    if (x != null && (typeof x === "object" || typeof x === "function")) {
      try {
        // A+规定，声明then = x的then方法
        //@ts-ignore
        let then = x.then;
        // 如果then是函数，就默认是promise了
        if (typeof then === "function") {
          // 就让then执行 第一个参数是this   后面是成功的回调 和 失败的回调
          then.call(
            x,
            (value: any) => {
              // 成功和失败只能调用一个
              if (called) return;
              called = true;
              // resolve的结果依旧是promise 那就继续解析
              this.resolvePromise(promise2, value, resolve, reject);
            },
            (err: any) => {
              // 成功和失败只能调用一个
              if (called) return;
              called = true;
              reject(err); // 失败了就失败了
            }
          );
        } else {
          resolve(x); // 直接成功即可
        }
      } catch (e) {
        // 也属于失败
        if (called) return;
        called = true;
        // 取then出错了那就不要在继续执行了
        reject(e);
      }
    } else {
      resolve(x);
    }
  }
}
export default MyPromise;

const p = new MyPromise((res, rej) => {
  setTimeout(() => {
    res("哈哈哈");
  }, 1000);
});
p.then((value) => {
  console.log(value);
  return "第二个promise";
}).then((value) => {
  console.log(value);
});

//封装xhr
const myAxios = (
  url: string,
  method: string,
  header?: Object,
  data?: Object
) => {
  return new MyPromise((res, rej) => {
    const xhr = new XMLHttpRequest();
    if (header != undefined) {
      for (const i in Object.keys(header)) {
        xhr.setRequestHeader(i, header[i]);
      }
    }
    xhr.responseType = "text";
    xhr.open(method, url, true);
    const body = xhr.response;
    const state = xhr.readyState;
    xhr.onload = function (e) {
      if (this.status == 200 || this.status == 304) {
        res(JSON.parse(this.responseText));
      }
    };
    xhr.ontimeout = function (e) {
      rej(e);
    };
    xhr.onerror = function (e) {
      rej(e);
    };

    //发送数据
    xhr.send(JSON.stringify(data || ""));
  });
};
myAxios(
  "https://nanotus.cn/lotusapi/article/getdList?username=Lotus",
  "GET"
).then((x) => {
  console.log(x);
});
