import { createUnit } from './unit';
import Fiber, { StateHook, Props, EffectHook, MemoHook } from './Element';
import { isEvent, isGone, isNew, isProperty } from './utils';

// 提交跟节点渲染
const commitRoot = () => {
  deletions?.forEach(commitWork);
  wipRoot && commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const commitWork = (fiber: Fiber | null) => {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (!(domParentFiber?.dom || null)) {
    domParentFiber = domParentFiber?.parent || null;
  }
  const domParent = domParentFiber?.dom;
  // 处理新增元素
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent?.appendChild(fiber.dom);
    updateDom(fiber.dom, fiber?.alternate?.props || {}, fiber.props || {});
    // 删除元素
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent as HTMLElement);
    // 更新元素
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber?.alternate?.props || {}, fiber.props || {});
  }
  fiber.child && commitWork(fiber.child);
  fiber.sibling && commitWork(fiber.sibling);
};

const commitDeletion = (fiber: Fiber | null, domParent: HTMLElement) => {
  if (!fiber) {
    return null;
  }
  fiber.hooks
    .filter((item) => (item as EffectHook).dispose)
    .forEach((item) => (item as EffectHook)?.dispose?.());
  if (fiber.dom) {
    domParent.removeChild(fiber?.dom);
  } else {
    commitDeletion(fiber?.child || null, domParent);
    if (fiber) {
      fiber.child = null;
    }
  }
};

const updateDom = (
  dom: HTMLElement | Text,
  prevProps: Props,
  nextProps: Props
) => {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      // @ts-ignore
      dom[name] = '';
    });
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(handlePropsName(dom as HTMLElement, nextProps));
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
};

// 根据Fiber创建DOM元素（不会立刻渲染）
const createDom = (fiber: Fiber) => {
  const isTextType = fiber?.type === 'text';
  const dom = isTextType
    ? renderText(String(fiber?.props?.nodeValue))
    : document.createElement(fiber.type as string);

  if (!isTextType && fiber.props) {
    Object.keys(fiber.props)
      .filter((propName) => propName !== 'children')
      .forEach(handlePropsName(dom as HTMLElement, fiber.props));
  }
  return dom;
};

const handlePropsName = (dom: HTMLElement, props: Props) => {
  return (name: string) => {
    if (name === 'style') {
      return Object.entries(props[name]).map(([cssName, value]) => {
        dom.style[cssName as any] = value as string;
      });
    }
    (dom as any)[name as any] = props[name];
  };
};

// 渲染函数
const render = (element: JSX.Element, container: HTMLElement) => {
  wipRoot = new Fiber(
    undefined,
    { children: [element as unknown as Fiber] },
    container,
    currentRoot
  );
  deletions = [];
  nextUnitOfWork = wipRoot;
};

// 下一个需要渲染的工作单元
let nextUnitOfWork: Fiber | null = null;
// 上一次渲染的Fiber树根节点
let currentRoot: Fiber | null = null;
// 正在进行渲染中的Fiber树
let wipRoot: Fiber | null = null;
let deletions: Fiber[] | null = null;
let wipFiber: null | Fiber = null;
let hookIndex: number = 0;

// 用来处理工作单元的循环
const workLoop = (deadline: IdleDeadline) => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
};
requestIdleCallback(workLoop);

// 运行单个工作单元
const performUnitOfWork = (fiber: Fiber) => {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
};

const updateFunctionComponent = (fiber: Fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [(fiber.type as Function)(fiber.props)];

  reconcileChildren(fiber, children);
};

const updateHostComponent = (fiber: Fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props?.children;
  elements && reconcileChildren(fiber, elements);
};

// 带diff算法的reconcile
// via: https://juejin.cn/post/6844904167472005134
const reconcileChildren = (wipFiber: Fiber, elements: Fiber[]) => {
  // 循环elements的索引
  let index = 0;
  // 最新的复用的index
  let lastPlacedIndex = 0;
  // 旧fiber节点
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  // 上一个兄弟节点（主要用于，用于构建fiber树，不参与diff）
  let preSibling: Fiber | null = null;

  // 第一次循环 如果遇到key不同则直接跳出
  while (
    (Array.isArray(elements) && index < elements?.length) ||
    oldFiber != null
  ) {
    const element = elements?.[index];
    let newFiber: null | Fiber = null;
    // 如果key不同直接跳出循环
    if (oldFiber?.props?.key !== element?.props?.key) {
      break;
    }
    lastPlacedIndex = index;

    // 比较新旧fiber type
    const sameType = oldFiber && element && element.type === oldFiber.type;

    // 如果旧光纤和新元素的类型相同，我们可以保留 DOM 节点，只用新 prop 更新它
    if (sameType) {
      newFiber = new Fiber(
        oldFiber?.type,
        element.props,
        oldFiber?.dom,
        oldFiber
      );
      newFiber.parent = wipFiber;
      newFiber.effectTag = 'UPDATE';
      // 如果类型不同并且有新元素，则意味着我们需要创建一个新的 DOM 节点
    } else if (element && !sameType) {
      newFiber = new Fiber(element.type, element.props, undefined, null);
      newFiber.parent = wipFiber;
      newFiber.effectTag = 'PLACEMENT';

      // 如果类型不同并且有旧Fiber，我们需要删除旧节点
    } else if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      deletions?.push(oldFiber);
    }
    //下一个兄弟节点
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    // const newFiber = new Fiber(element?.type, element?.props, undefined);
    // newFiber.parent = wipFiber;
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (preSibling) {
      preSibling.sibling = newFiber;
    }
    preSibling = newFiber;
    index++;
  }

  // 如果新旧都已经遍历完了，直接完成
  if (oldFiber === null && elements.length === index) {
    return;
  }
  // 如果oldFiber有剩余节点, newFiber没有，删除剩余节点
  else if (oldFiber !== null && elements.length <= index) {
    while (oldFiber !== null) {
      oldFiber && (oldFiber.effectTag = 'DELETION');
      deletions?.push(oldFiber as Fiber);
      oldFiber = oldFiber?.sibling;
    }
    // 如果oldFiber没有剩余节点, newFiber有，添加节点
  } else if (oldFiber === null && elements.length > index) {
    while (elements.length > index) {
      const element = elements[index];
      const newFiber = new Fiber(element.type, element.props, undefined, null);
      newFiber.parent = wipFiber;
      newFiber.effectTag = 'PLACEMENT';
      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (preSibling) {
        preSibling.sibling = newFiber;
      }
      preSibling = newFiber;
      index++;
    }
  } else {
    // 构建fiber map
    const mapOldFiberTree: Record<string, Fiber> = {};
    let oldFiberIndex = index;
    while (oldFiber) {
      oldFiber.index = oldFiberIndex;
      mapOldFiberTree[oldFiber.props?.key as string] = oldFiber;
      oldFiber = oldFiber.sibling;
      oldFiberIndex++;
    }

    // 第二次遍历
    while (index < elements.length) {
      let newFiber: null | Fiber;
      const element = elements[index];
      const findOldFiber = mapOldFiberTree[element.props?.key as string];
      delete mapOldFiberTree[element.props?.key as string];
      // 如果上一次复用的索引<老节点的索引则不变
      if (findOldFiber?.index || 0 > lastPlacedIndex) {
        newFiber = new Fiber(
          findOldFiber?.type,
          element.props,
          findOldFiber?.dom,
          findOldFiber
        );
        newFiber.parent = wipFiber;
        newFiber.effectTag = 'UPDATE';
        lastPlacedIndex = findOldFiber.index || 0;
        // 否则元素直接向右移动（添加新元素）
      } else {
        newFiber = new Fiber(
          element.type,
          element.props,
          findOldFiber?.dom,
          findOldFiber
        );
        newFiber.parent = wipFiber;
        newFiber.effectTag = 'PLACEMENT';
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (preSibling) {
        preSibling.sibling = newFiber;
      }
      preSibling = newFiber;
      index++;
    }

    // 没有适用的旧节点都删除
    Object.values(mapOldFiberTree).forEach((fiber) => {
      fiber.effectTag = 'DELETION';
      deletions?.push(fiber);
    });
  }
};

// 没有diff算法的reconcile
// const reconcileChildren1 = (wipFiber: Fiber, elements: Fiber[]) => {
//   let index = 0;
//   let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
//   let preSibling: Fiber | null = null;

//   while (
//     (Array.isArray(elements) && index < elements?.length) ||
//     oldFiber != null
//   ) {
//     //
//     const element = elements?.[index];

//     let newFiber: null | Fiber = null;

//     // if (oldFiber?.props?.key && element.props?.key) {
//     // }

//     // 比较新旧fiber树
//     const sameType = oldFiber && element && element.type === oldFiber.type;

//     // 如果旧光纤和新元素的类型相同，我们可以保留 DOM 节点，只用新 prop 更新它
//     if (sameType) {
//       newFiber = new Fiber(
//         oldFiber?.type,
//         element.props,
//         oldFiber?.dom,
//         oldFiber
//       );
//       newFiber.parent = wipFiber;
//       newFiber.effectTag = 'UPDATE';
//       // 如果类型不同并且有新元素，则意味着我们需要创建一个新的 DOM 节点
//     } else if (element && !sameType) {
//       newFiber = new Fiber(element.type, element.props, undefined, null);
//       newFiber.parent = wipFiber;
//       newFiber.effectTag = 'PLACEMENT';

//       // 如果类型不同并且有旧Fiber，我们需要删除旧节点
//     } else if (oldFiber && !sameType) {
//       oldFiber.effectTag = 'DELETION';
//       deletions?.push(oldFiber);
//     }
//     //下一个兄弟节点
//     if (oldFiber) {
//       oldFiber = oldFiber.sibling;
//     }
//     // const newFiber = new Fiber(element?.type, element?.props, undefined);
//     // newFiber.parent = wipFiber;
//     if (index === 0) {
//       wipFiber.child = newFiber;
//     } else if (preSibling) {
//       preSibling.sibling = newFiber;
//     }
//     preSibling = newFiber;
//     index++;
//   }
// };

const performUnitOfWorkOld = (fiber: Fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  //   if (fiber.parent) {
  //     fiber?.parent?.dom?.appendChild(fiber?.dom);
  //   }

  const elements = fiber?.props?.children;
  let index = 0;
  let preSibling: Fiber | null = null;

  while (Array.isArray(elements) && index < elements?.length) {
    const element = elements?.[index];
    const newFiber = new Fiber(element?.type, element?.props, undefined);
    newFiber.parent = fiber;
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      (preSibling as Fiber).sibling = newFiber;
    }
    preSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
};
requestIdleCallback(workLoop);
const renderText = (text: string) => document.createTextNode(text);

const ReactDom = {
  render,
};

export const useState = <T>(initial: T) => {
  const oldHook: StateHook<T> | null | undefined =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    (wipFiber.alternate.hooks[hookIndex] as StateHook<T>);
  const hook: StateHook<T> = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action instanceof Function ? action(hook.state) : action;
  });

  const setState = (action: T | ((value: T) => T)) => {
    hook.queue.push(action);
    wipRoot = new Fiber(
      undefined,
      currentRoot?.props,
      currentRoot?.dom,
      currentRoot
    );
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber?.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState] as const;
};

export const useEffect = (fn: () => (() => void) | void, deps?: any[]) => {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    (wipFiber.alternate.hooks[hookIndex] as EffectHook);
  const hook: EffectHook = {
    deps: undefined,
    dispose: undefined,
  };

  if (!oldHook) {
    const dispose = fn();
    dispose && (hook.dispose = dispose);
  } else if (!oldHook.deps && !deps) {
    oldHook.dispose?.();
    const dispose = fn();
    dispose && (hook.dispose = dispose);
  } else if (deps?.some((item, index) => item !== oldHook?.deps?.[index])) {
    oldHook.dispose?.();
    const dispose = fn();
    dispose && (hook.dispose = dispose);
  } else {
    hook.dispose = oldHook.dispose;
  }
  hook.deps = deps;
  wipFiber?.hooks.push(hook);
  hookIndex++;
};

export const useMemo = <T>(fn: () => T, deps?: any[]) => {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    (wipFiber.alternate.hooks[hookIndex] as MemoHook);
  const hook: MemoHook<T> = {
    deps: undefined,
    memo: null,
  };

  if (!oldHook) {
    hook.memo = fn();
  } else if (!oldHook.deps && !deps) {
    hook.memo = fn();
  } else if (deps?.some((item, index) => item !== oldHook?.deps?.[index])) {
    hook.memo = fn();
  } else {
    hook.memo = oldHook.memo;
  }
  hook.deps = deps;
  wipFiber?.hooks.push(hook);
  hookIndex++;
  return hook.memo as T;
};

export default ReactDom;
