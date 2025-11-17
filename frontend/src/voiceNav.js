import getButton from "./components/Button.js";
import { restoreAndRun } from "./components/Button.js";

window.addEventListener('load', () => {
  console.log("We started this");
  
  restoreAndRun().catch(console.error);
  
  console.log("We also ended this");
  
});

getButton()

// console.log(dh.getSafeVirtualDomSnapshot());


// dh.initObserver()
// console.log(JSON.stringify(dh.getVDom(), null, 2));

// setInterval(() => {
    // console.log(JSON.stringify(dh.getVDom(), null, 2));
// }, 5000)

