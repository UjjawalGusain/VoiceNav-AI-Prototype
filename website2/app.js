let globalCounter = 0;
let stopper = 4;
// setInterval(() => {
//     if(globalCounter > stopper) return;
//     const p = document.getElementById("Parent");
//     console.log();
    
//     if(p.style.backgroundColor == "brown") p.style.backgroundColor = "black"
//     else p.style.backgroundColor = "brown"
// }, 2000)


// setInterval(() => {
//     if(globalCounter > stopper) return;
//     const ul = document.getElementById("myList");
    
//     const li = document.createElement("li");
//     const tc = document.createTextNode(globalCounter);
//     globalCounter++;
//     li.append(tc);
//     ul.append(li);
    
// }, 2000)

// setInterval(() => {
//     if(globalCounter > stopper) return;
//     const ul = document.getElementById("myList");
    
//     ul.removeChild(ul.lastElementChild);
    
// }, 3000)

setInterval(() => {
    const p = document.getElementById("Parent").firstChild;
    if(globalCounter%2) p.textContent = 10;
    else p.textContent = 5;
    globalCounter++;
}, 2000)