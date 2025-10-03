export function getOrCreateSessionId() {
  let sid = sessionStorage.getItem("voiceNavSessionId");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("voiceNavSessionId", sid);
  }
  return sid;
}
