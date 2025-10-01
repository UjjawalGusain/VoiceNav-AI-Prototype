from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain_community.document_loaders import JSONLoader
from langchain.agents.structured_output import ToolStrategy
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Union
from prompts import foreman_system_prompt


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



DAG_FILE_PATH = "backend/dag2.json"

@tool("foreman_navigation")
def foreman_navigation(query: str) -> str:
    """
    Given a user navigation query, this function loads the website's DAG structure,
    initializes a LangChain agent with Gemini LLM configured for structured output,
    and invokes the agent to compute a navigation route based on the DAG.

    It returns the navigation plan as a pretty-printed JSON string conforming to the predefined
    NavigationOutput schema, or an error message if no structured response is generated.

    Args:
        query (str): The user's navigation request (e.g., "Navigate to Email from Home Page").

    Returns:
        str: Pretty-printed JSON string of the structured navigation route,
             or an error message if the response cannot be generated.
    """
    loader = JSONLoader(file_path=DAG_FILE_PATH, jq_schema=".", text_content=False)
    documents = loader.load()
    dag_text = "\n\n".join([doc.page_content for doc in documents])

    system_prompt_with_dag = foreman_system_prompt + "\n\nHere is the site's DAG:\n" + dag_text

    agent = create_agent(
        model="gemini-2.5-flash",
        prompt=system_prompt_with_dag,
        tools=[],
        response_format=ToolStrategy(NavigationOutput),
    )

    response = agent.invoke({"messages": [{"role": "user", "content": query}]})

    structured_data = response.get("structured_response")
    if structured_data:
        return structured_data.model_dump_json(indent=2)
    else:
        return "No structured response returned."
