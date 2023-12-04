export abstract class Unit {
  reactid?: string;

  constructor(protected currentElement: string | HTMLElement) {}

  getMarkUp?: (reactid: string) => string;
}

export class TextUnit extends Unit {
  getMarkUp = (reactid: string): string => {
    this.reactid = reactid;
    return `<span data-reactid=${reactid}>${this.currentElement}</span>`;
  };
}

export function createUnit(element: string | HTMLElement) {
  if (typeof element === "string" || typeof element === "number") {
    return new TextUnit(element);
  }
  return new TextUnit("");
}
