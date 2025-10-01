import os
from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from prompts import foreman_system_prompt
from foreman_navigation_tool import foreman_navigation, NavigationOutput 
from create_transcript import start_transcription

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"


if __name__ == "__main__":
    user_question = start_transcription()
    if user_question:
        print("User question:\n", user_question)
    else:
        print("Transcription failed.")

    tools = [foreman_navigation]

    agent = create_agent(
        model="gemini-2.5-flash",
        tools=tools,
        prompt=foreman_system_prompt, 
        response_format=ToolStrategy(NavigationOutput),
    )

    response = agent.invoke({"messages": [{"role": "user", "content": user_question}]})

    # Step 5: Pretty-print structured navigation response
    structured_response = response.get("structured_response")
    if structured_response:
        print(structured_response.model_dump_json(indent=2))
    else:
        print("No structured response returned.")
