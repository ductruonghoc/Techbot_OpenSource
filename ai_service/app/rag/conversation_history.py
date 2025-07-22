import psycopg2
from app.rag import rag_generator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def retrieve_conversation_history(
    conversation_id: str,
    db_config: dict,
    n_limit: int = 5
):
    """
    Retrieve the conversation history for a given user and conversation ID.

    Args:
        conversation_id (str): The ID of the conversation.
        db_params (dict): Database connection parameters.
        n_limit (int): Number of lastest messages to retrieve.

    Returns:
        list: List of relevant messages from the conversation history.
    """

    chat_history = []

    try:
        conn = psycopg2.connect(**db_config)
        cur = conn.cursor()

        sql_query = """
        SELECT 
            rrp.request,
            rrp.response
        FROM
            request_response_pair AS rrp
        WHERE
            rrp.conversation_id = %s
        ORDER BY
            rrp.created_time DESC
        LIMIT %s;
        """
        cur.execute(sql_query, (conversation_id, n_limit))
        

        for row in cur.fetchall():
            request, response = row
            if request and response:
                chat_history.append({
                    "request": request,
                    "response": response
                })

    except (Exception, psycopg2.Error) as error:
        logger.error(f"Error during PostgreSQL retrieval: {error}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return chat_history


def prepare_chat_history(chat_history: list, max_tokens: int = 1000000) -> list:
    """
    Extract up to max_pairs recent question-answer pairs from history, not exceeding max_tokens.
    Each item in chat_history should be a dict: {"question": str, "answer": str}
    """
    pairs = []
    total_tokens = 0

    for item in chat_history:
        question = item.get("request", "")
        answer = item.get("response", "")
        if not question or not answer:
            continue

        # Estimate tokens (simple heuristic)
        question_tokens = len(question.split())
        answer_tokens = len(answer.split())
        pair_tokens = question_tokens + answer_tokens

        if total_tokens + pair_tokens > max_tokens:
            break

        pairs.append(f"Q: {question}\nA: {answer}")
        total_tokens += pair_tokens

    return pairs


def generate_compressed_context(history_pairs: list, current_query: str) -> str:
    """
    Compress recent Q/A history into relevant facts using Gemini.
    """
    history_text = "\n\n".join(history_pairs)
    prompt = f"""
    You are an assistant helping summarize relevant background knowledge from a Q&A history.

    History:
    {history_text}

    Current User Question:
    {current_query}

    Extract only the most relevant facts, data points, or useful context from the Q/A history that would help answer this question.
    Return it in a concise form.
    """

    return rag_generator.prompt_gemini(prompt)


def expand_user_query(original_query: str, compressed_context: str) -> str:
    """
    Use Gemini to expand the original query into a self-contained version.
    """
    prompt = f"""
    Given the following background information:

    Context:
    {compressed_context}

    And this user query:
    "{original_query}"

    Rewrite the query so that it becomes self-contained and doesn't rely on the prior conversation.
    The rewritten query should include all necessary details to retrieve a relevant answer from a database or knowledge base.
    """

    return rag_generator.prompt_gemini(prompt)


def expand_query_with_history(
    original_query: str,
    conversation_id: str,
    db_config: dict,
    max_tokens: int = 1000000
) -> str:
    """
    Expand the user query using the conversation history.
    """
    # Prepare chat history pairs
    chat_history = retrieve_conversation_history(conversation_id=conversation_id, db_config=db_config, n_limit=5)
    history_pairs = prepare_chat_history(chat_history, max_tokens=max_tokens)
    
    # Generate compressed context from history
    compressed_context = generate_compressed_context(history_pairs, current_query=original_query)
    
    # Expand the original query using the compressed context
    return expand_user_query(original_query, compressed_context)


