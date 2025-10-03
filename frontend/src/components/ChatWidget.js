const ChatWidget = (() => {
  let chatContainer, messagesDiv;

  function init() {
    chatContainer = document.createElement("div");
    Object.assign(chatContainer.style, {
      display: "none", // hidden initially
      position: "fixed",
      bottom: "80px",
      right: "20px",
      width: "320px",
      height: "400px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      backgroundColor: "white",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      zIndex: 9999,
      flexDirection: "column",
      fontFamily: "Arial, sans-serif",
    });

    messagesDiv = document.createElement("div");
    Object.assign(messagesDiv.style, {
      flex: "1",
      padding: "10px",
      overflowY: "auto",
      fontSize: "14px",
    });
    chatContainer.appendChild(messagesDiv);

    document.body.appendChild(chatContainer);
  }

  function show() {
    chatContainer.style.display = "flex";
  }

  function appendMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = text;
    Object.assign(msgDiv.style, {
      marginBottom: "8px",
      padding: "6px 8px",
      borderRadius: "4px",
      backgroundColor: sender === "You" ? "#E1F5FE" : "#F1F1F1",
      alignSelf: sender === "You" ? "flex-end" : "flex-start",
    });
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  return { init, show, appendMessage };
})();

export default ChatWidget;
