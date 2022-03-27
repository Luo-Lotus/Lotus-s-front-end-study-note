const debounced = (fn: () => any, time: number) => {
  let timer: number;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn();
    }, time);
  };
};
const Throttle = (fn: () => any, time: number) => {
  let flag = false;
  return () => {
    if (!flag) {
      flag = true;
      setTimeout(() => {
        fn();
        flag = false;
      }, time);
    }
  };
};
document.getElementById("debounced")?.addEventListener(
  "click",
  debounced(() => {
    console.log("防抖");
  }, 1000)
);
document.getElementById("throttle")?.addEventListener(
  "click",
  Throttle(() => {
    console.log("节流");
  }, 2000)
);
