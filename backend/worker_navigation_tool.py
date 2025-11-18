import logging
import os
from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, Union
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents.structured_output import ToolStrategy
from langchain_core.messages.human import HumanMessage
from backend.prompts import worker_system_prompt 

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "backend/gemini_credentials.json"
logger = logging.getLogger(__name__)

class ExecutionObject(BaseModel):
    action: Literal["click", "navigate", "scroll", "input", "submit", "back"] = Field(
        description="Low-level UI action to execute"
    )
    target: Optional[str] = Field(default=None, description="CSS selector of target element")
    value: Optional[str] = Field(default=None, description="Value to fill for input actions")

class WorkerError(BaseModel):
    error: str = Field(description="Explanation of why execution could not be created")


class WorkerAgent:
    """
    Worker agent: takes one Foreman instruction + DOM snapshot,
    generates an executionObject with runnable JS.
    """

    def __init__(
        self,
        session_id: Optional[str] = None,
        model: str = "gemini-2.5-flash",
        system_prompt: str = worker_system_prompt
    ):
        self.session_id = session_id
        self.history = []

        self.model = model
        self.system_prompt = system_prompt

        self.checkpointer = InMemorySaver()

        self.agent = create_agent(
            model=self.model,
            prompt=self.system_prompt,
            tools=[],
            response_format=ToolStrategy(ExecutionObject),
            checkpointer=self.checkpointer,
        )


    def receive_instruction(self, instruction: Dict[str, Any], dom_snapshot: str) -> Union[ExecutionObject, WorkerError]:
        logger.info(f"[Worker {self.session_id}] Received instruction: {instruction}")

        messages = [
            HumanMessage(content=f"Instruction: {instruction}"),
            HumanMessage(content=f"DOM Snapshot:\n{dom_snapshot}"),
            HumanMessage(content="Generate a valid executionObject.")
        ]

        response = self.agent.invoke(
            {"messages": [msg.dict() for msg in messages]},  # This lets LangChain create the "parts" field internally
            config={"configurable": {"thread_id": self.session_id}},
        )

        structured_data = response.get("structured_response")

        if structured_data:
            self.history.append({
                "instruction": instruction,
                "execution": structured_data
            })
            return structured_data

        return WorkerError(error="No structured response returned")

    def get_history(self):
        return self.history

    def reset(self):
        logger.info(f"[Worker {self.session_id}] Resetting history")
        self.history = []

