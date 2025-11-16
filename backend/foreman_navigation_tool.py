from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain_community.document_loaders import JSONLoader
from langchain.agents.structured_output import ToolStrategy
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from backend.prompts import foreman_system_prompt


class RouteStep(BaseModel):
    step_number: int = Field(description="The order of the navigation step")
    action: Literal["click", "navigate", "scroll", "input", "submit", "back"] = Field(
        description="Allowed types of action"
    )
    from_page: str = Field(description="Source page or component")
    to_page: str = Field(description="Target page or component")
    location: Optional[str] = Field(default=None, description="UI location if known")

class NavigationOutput(BaseModel):
    route: Optional[List[RouteStep]] = Field(default=None, description="Ordered navigation steps")
    error: Optional[str] = Field(default=None, description="Error message if navigation fails")

class NavigationError(BaseModel):
    error: str = Field(description="Explanation of failure or partial navigation")
    partial_route: Optional[List[RouteStep]] = Field(default=None, description="Partial route, if any")


class ForemanPlannerAgent:
    """
    Agent responsible for planning navigation routes based on user queries and site DAG structure,
    with session-aware short-term memory using LangChain checkpointers.
    """

    def __init__(
        self,
        dag_file_path: str = "backend/dag2.json",
        model: str = "gemini-2.5-flash",
        system_prompt: str = foreman_system_prompt,
        # For testing, use in-memory persistence. Swap with PostgresSaver etc. for production.
        checkpointer=None,
    ):
        """
        Initialize the Foreman Planner Agent with short-term memory persistence.

        Args:
            dag_file_path: Path to the DAG JSON file.
            model: LLM model identifier for planning.
            system_prompt: Base system prompt for the agent.
            checkpointer: State persistence class (InMemorySaver, PostgresSaver, etc.)
        """
        self.dag_file_path = dag_file_path
        self.model = model
        self.system_prompt = system_prompt
        self.dag_text = self._load_dag()

        # Default: use in-memory checkpointer if not provided
        if checkpointer is None:
            checkpointer = InMemorySaver()

        self.checkpointer = checkpointer

        # Build the agent with a checkpointer for session/thread persistence
        self.agent = create_agent(
            model=self.model,
            prompt=self.system_prompt + "\n\nHere is the site's DAG:\n" + self.dag_text,
            tools=[],
            response_format=ToolStrategy(NavigationOutput),
            checkpointer=self.checkpointer,
        )

    def _load_dag(self) -> str:
        """Load and parse the DAG JSON file."""
        loader = JSONLoader(file_path=self.dag_file_path, jq_schema=".", text_content=False)
        documents = loader.load()
        dag_text = "\n\n".join([doc.page_content for doc in documents])
        return dag_text

    def plan_route(self, query: str, session_id: str, currentPath: str) -> NavigationOutput:
        """
        Compute a navigation route based on the DAG, tracking session history via thread_id.

        Args:
            query: The user's navigation request.
            session_id: Unique session/thread identifier.
            currentPath: Current page of the website

        Returns:
            NavigationOutput object containing route steps or error.
        """
        user_content = f"Current page: {currentPath}\nUser query: {query}"

        response = self.agent.invoke(
            {"messages": [{"role": "user", "content": user_content}]},
            config={"configurable": {"thread_id": session_id}},
        )
        structured_data = response.get("structured_response")

        if structured_data:
            return structured_data
        return NavigationOutput(route=None, error="No structured response returned from agent.")


    def plan_route_json(self, query: str, session_id: str) -> str:
        """
        Return the navigation plan as a pretty-printed JSON string (session-aware).

        Args:
            query: The user's navigation request.
            session_id: Unique session/thread identifier.

        Returns:
            Pretty-printed JSON string of the navigation route.
        """
        navigation_output = self.plan_route(query, session_id)
        return navigation_output.model_dump_json(indent=2)

    def clear_session(self, session_id: str):
        """
        (Optional utility) Clear/delete the short-term memory for a given session/thread.

        Args:
            session_id: Unique session/thread identifier.
        """
        if hasattr(self.checkpointer, "delete_thread"):
            self.checkpointer.delete_thread(session_id)
