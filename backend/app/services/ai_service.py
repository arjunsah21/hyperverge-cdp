import json
import os
import logging
from jinja2 import Template
from typing import Dict, Any
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Define the schema context for the LLM
SEGMENT_FIELDS = [
    {"value": "email", "label": "Email", "type": "string"},
    {"value": "state", "label": "State", "type": "string"},
    {"value": "city", "label": "City", "type": "string"},
    {"value": "status", "label": "Status", "type": "string (VIP, ACTIVE, REGULAR, NEW, CHURNED)"},
    {"value": "total_spend", "label": "Total Spend", "type": "number"},
    {"value": "total_orders", "label": "Total Orders", "type": "number"},
    {"value": "email_opt_in", "label": "Email Opt-in", "type": "boolean (true/false)"},
    {"value": "source", "label": "Source", "type": "string"},
    {"value": "last_order_date", "label": "Last Order Date", "type": "date"},
]

SEGMENT_OPERATORS = [
    {"value": "equals", "label": "Equals"},
    {"value": "not_equals", "label": "Not Equals"},
    {"value": "contains", "label": "Contains"},
    {"value": "greater_than", "label": "Greater Than"},
    {"value": "less_than", "label": "Less Than"},
    {"value": "within_days", "label": "Within Last X Days"},
]

# Initialize OpenAI Client
client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

PROMPT_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "../prompts/segment_prompt.j2")

def get_prompt_template() -> str:
    try:
        with open(PROMPT_TEMPLATE_PATH, "r") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning(f"Prompt template not found at {PROMPT_TEMPLATE_PATH}, using fallback.")
        return """You are a CDP Expert. Extract segment rules from this query: {{ user_query }}."""

def generate_segment_from_prompt(user_query: str) -> Dict[str, Any]:
    """
    Generates a segment structure (Name, Description, Rules) from a natural language query.
    Uses OpenAI API (via Proxy).
    """
    try:
        logger.info(f"Generating segment for query: '{user_query}'")
        
        # 1. Render the System Prompt
        template_str = get_prompt_template()
        template = Template(template_str)
        rendered_prompt = template.render(
            fields=SEGMENT_FIELDS,
            operators=SEGMENT_OPERATORS,
            user_query=user_query
        )
        
        # 2. CALL LLM
        logger.debug("Calling OpenAI API via Proxy...")
        
        # Note: Using 'user' role instead of 'system' for better compatibility 
        # with various proxies (some Gemini/Vertex proxies strictly require 'user')
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "user", "content": rendered_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1 # Keep it deterministic
        )
        
        content = response.choices[0].message.content
        logger.debug(f"Received raw AI response: {content}")
        
        result = json.loads(content)
        
        # Ensure all rule values are strings (fixes Pydantic validation error for numbers)
        if "rules" in result and isinstance(result["rules"], list):
            for rule in result["rules"]:
                if "value" in rule:
                    rule["value"] = str(rule["value"])
        
        logger.info(f"Successfully generated segment: {result.get('name', 'Unnamed')}")
        return result

    except Exception as e:
        logger.error(f"Error calling AI Service: {e}", exc_info=True)
        # Return empty structure on error
        return {
            "name": "",
            "description": "Error generating segment.",
            "logic": "AND",
            "rules": []
        }
