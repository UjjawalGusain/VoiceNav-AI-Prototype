function buttonClick() {
  console.log(document.body)
}

function init(config) {
  const button = document.createElement("button");
  
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.width = "50px";
  button.style.height = "50px";
  button.style.borderRadius = "50%"; 
  button.style.border = "3px solid #4A90E2"; 
  button.style.backgroundColor = "white";
  button.style.color = "#4A90E2"; 
  button.style.fontSize = "32px"; 
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  button.style.zIndex = 9999;
  button.style.padding = 0;

  const img = document.createElement("img");
  img.src = "public/icon.png";  
  img.alt = "VoiceNav Icon";
  img.style.width = "50px"; 
  img.style.height = "50px";
  img.style.objectFit = "fill";
  img.style.pointerEvents = "none"; 

  button.appendChild(img);

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    buttonClick()
  });

  console.log("VoiceNav initialized with config", config);
}

init()
