import Fiber from './Element';

const createElement = (
  type: string,
  props?: Record<string, any>,
  ...children: any[]
) => {
  if (typeof type === 'function') {
    type;
  }
  return new Fiber(type, {
    ...props,
    children: createChildren(children),
  });
};

const createChildren = (children: (Fiber[] | Fiber | string | number)[]) => {
  const newChildren: Fiber[] = [];
  children?.forEach?.((child) => {
    // 处理数组
    if (Array.isArray(child)) {
      newChildren.splice(newChildren.length, 0, ...createChildren(child));
      // Fiber直接返回
    } else if (child instanceof Fiber) {
      newChildren.push(child);
      // 处理字符串的叶子节点
    } else if (typeof child === 'string' || typeof child === 'number') {
      newChildren.push(createTextElement(child));
    }
  });
  return newChildren;
};

const createTextElement = (text: string | number) => {
  return new Fiber('text', { nodeValue: text, children: [] });
};

const React = {
  createElement,
};

export default React;
