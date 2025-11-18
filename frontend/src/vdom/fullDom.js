export class VDomHandler {
    #root;
    #domToVNodeMap;
    #virtualDom;
    #observerOptions;
    #mutationObserver;

    constructor(root) {
        this.#root = root;
        this.#domToVNodeMap = new WeakMap(); // <DOMElement, VNode>
        this.#virtualDom = this._buildVirtualDom(root);
        this.#observerOptions = {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
        };

        this.initObserver();
    }

    getSafeVirtualDomSnapshot() {
        function cloneNode(node) {
            if (!node) return null;
            if (node.tagName === "TEXT") {
                return Object.freeze({
                    tagName: "TEXT",
                    options: Object.freeze({ text: node.options.text }),
                });
            }

            const cloned = {
                tagName: node.tagName,
                options: {
                    attrs: Object.freeze({ ...node.options.attrs }),
                    children: node.options.children.map(cloneNode),
                },
            };

            return Object.freeze(cloned);
        }
        return cloneNode(this.#virtualDom);
    }

    _createVNode(root, parent = null) {
        if (root.nodeType === Node.TEXT_NODE) {
            return {
                tagName: "TEXT",
                options: { text: root.textContent },
                parentNode: parent,
            };
        }

        const vNode = {
            tagName: root.tagName,
            options: { children: [], attrs: {} },
            parentNode: parent,
        };

        if (root.attributes !== undefined) {
            for (const attr of root.attributes) {
                vNode.options.attrs[attr.name] = attr.value;
            }
        }

        return vNode;
    }

    _buildVirtualDom(root, parent = null) {
        if (root.tagName === "SCRIPT") return null;
        if (root.classList && root.classList.contains('voicenav-vnode-ignore')) {
            return null;
        }
        const vNode = this._createVNode(root, parent);

        for (const child of root.childNodes) {
            const childNode = this._buildVirtualDom(child, vNode);
            if (childNode) vNode.options.children.push(childNode);
        }

        this.#domToVNodeMap.set(root, vNode);

        return vNode;
    }

    _renderAddedNodes(addedNodes) {
        for (const node of addedNodes) {
            if (node.classList && node.classList.contains('voicenav-vnode-ignore')) {
                continue;
            }
            const parentNode = node.parentNode;
            const parentVDomNode = this.#domToVNodeMap.get(parentNode);
            if (!parentVDomNode) {
                continue;
            }
            const vDomNode = this._buildVirtualDom(node, parentVDomNode);
            parentVDomNode.options.children.push(vDomNode);
            this.#domToVNodeMap.set(node, vDomNode);
        }
    }

    _renderRemovedNodes(removedNodes) {
        for (const node of removedNodes) {
            const childVNode = this.#domToVNodeMap.get(node);
            const parentVDomNode = childVNode.parentNode;
            parentVDomNode.options.children =
                parentVDomNode.options.children.filter(
                    (child) => child !== childVNode
                );
            this.#domToVNodeMap.delete(node);
        }
    }

    printDom(node = this.getSafeVirtualDomSnapshot(), depth = 0) {
        const indent = "  ".repeat(depth);
        if (!node) return;

        if (node.tagName === "TEXT") {
            const text = node.options.text?.trim();
            if (text) console.log(`${indent}${text}`);
            return;
        }

        let attrs = "";
        const attrObj = node.options?.attrs || {};
        for (const [key, value] of Object.entries(attrObj)) {
            attrs += value === "" ? ` ${key}` : ` ${key}="${value}"`;
        }

        const children = node.options?.children || [];
        if (children.length === 0) {
            console.log(`${indent}<${node.tagName}${attrs} />`);
            return;
        }

        console.log(`${indent}<${node.tagName}${attrs}>`);
        for (const child of children) {
            this.printDom(child, depth + 1);
        }
        console.log(`${indent}</${node.tagName}>`);
    }

    _renderAttributes(mutation) {
        const changedAttrNode = mutation.target;
        const oldNode = this.#domToVNodeMap.get(changedAttrNode);
        if (!oldNode) return;

        const attrName = mutation.attributeName;
        if (attrName) {
            const newValue = changedAttrNode.getAttribute(attrName);
            if (newValue === null) delete oldNode.options.attrs[attrName];
            else oldNode.options.attrs[attrName] = newValue;
        }
    }

    _renderCharacterData(mutation) {
        const node = mutation.target;
        const vNode = this.#domToVNodeMap.get(node);
        if (!vNode) return;
        vNode.options.text = node.textContent;
    }

    _mutationCallback = (mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                this._renderAddedNodes(mutation.addedNodes);
                this._renderRemovedNodes(mutation.removedNodes);
            } else if (mutation.type === "attributes") {
                this._renderAttributes(mutation);
            } else if (mutation.type === "characterData") {
                this._renderCharacterData(mutation);
            }
        }
    };

    initObserver() {
        this.#mutationObserver = new MutationObserver(this._mutationCallback);
        this.#mutationObserver.observe(this.#root, this.#observerOptions);
    }
}
