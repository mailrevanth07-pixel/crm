// Y.js wrapper to handle TypeScript import issues
const Y = require('yjs');

export class YjsHelper {
  static createDocument(): any {
    return new Y.Doc();
  }

  static getText(doc: any, name: string = 'content'): any {
    return doc.getText(name);
  }

  static insertText(text: any, index: number, content: string): void {
    text.insert(index, content);
  }

  static encodeStateAsUpdate(doc: any): Uint8Array {
    return Y.encodeStateAsUpdate(doc);
  }

  static applyUpdate(doc: any, update: Uint8Array): void {
    Y.applyUpdate(doc, update);
  }
}

export default YjsHelper;
