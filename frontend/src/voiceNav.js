import getButton from "./components/Button.js";
import { VDomHandler } from "./vdom/fullDom.js";

getButton()

const dh = new VDomHandler(document.body)
// console.log(dh.getSafeVirtualDomSnapshot());


// dh.initObserver()
// console.log(JSON.stringify(dh.getVDom(), null, 2));

// setInterval(() => {
//     console.log(JSON.stringify(dh.getVDom(), null, 2));
// }, 5000)

