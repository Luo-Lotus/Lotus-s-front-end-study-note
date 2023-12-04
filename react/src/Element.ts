export type ReactNode = string | number | Fiber | null | undefined;

export type Props = {
  children?: Fiber[];
  key?: number | string;
  nodeValue?: number | string;
  [key: string]: any;
};

export type StateHook<T = any> = {
  state: T;
  queue: (T | ((value: T) => T))[];
};

export type EffectHook = {
  deps: any[] | undefined;
  dispose: (() => void) | undefined;
};

export type MemoHook<T = any> = {
  deps: any[] | undefined;
  memo: T | null;
};

export default class Fiber {
  public parent: Fiber | null = null;
  public sibling: Fiber | null = null;
  public child: Fiber | null = null;
  public effectTag: 'UPDATE' | 'PLACEMENT' | 'DELETION' | null = null;
  public hooks: (StateHook | EffectHook | MemoHook)[] = [];
  public index?: number;
  constructor(
    public type?: string | Function,
    public props?: Props,
    public dom?: HTMLElement | Text,
    public alternate?: Fiber | null
  ) {}
}
