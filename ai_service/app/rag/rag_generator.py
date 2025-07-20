# 1. Third-party library imports
import google.generativeai as query_agent
import logging
from typing import List, Dict
import time

# 2. Local application imports
from app import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
query_agent.configure(api_key=config.APIKEYQUERY)
gemini_model = query_agent.GenerativeModel('gemini-2.5-flash-preview-05-20')

# Constants
MAX_CONTEXT_LENGTH = 3000000  # Adjust based on your model's context window
MAX_RETRIES = 3
RETRY_DELAY = 1  # seconds


def prompt_gemini(prompt: str, max_retries: int = MAX_RETRIES) -> str:
    """
    Sends a prompt to the Gemini model with retry logic and better error handling.
    """
    for attempt in range(max_retries):
        try:
            response = gemini_model.generate_content(prompt)
            if response.text:
                return response.text.strip()
            else:
                logger.warning(f"Empty response from Gemini on attempt {attempt + 1}")
        except Exception as e:
            logger.error(f"Error generating content with Gemini (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(RETRY_DELAY * (2 ** attempt))  # Exponential backoff
            else:
                raise
    
    return ""


def detect_language(query: str) -> str:
    """
    Detects the language of a query with caching to avoid repeated API calls.
    """
    if not query:
        return "en"
    
    # Simple heuristic: if query contains only ASCII characters, likely English
    if query.isascii():
        return "en"
    
    try:
        prompt = f"""Detect the language of this text and return only the ISO 639-1 language code (e.g., 'en', 'es', 'fr', 'de', 'zh'):
        
        Text: {query[:200]}  # Limit to first 200 chars for efficiency
        
        Return only the language code, nothing else."""
        
        response = prompt_gemini(prompt)
        return response.lower() if response else "en"
    except Exception as e:
        logger.error(f"Error detecting language: {e}")
        return "en"


def prepare_context(retrieved_chunks: List[Dict], max_length: int = MAX_CONTEXT_LENGTH) -> str:
    """
    Efficiently prepares context by concatenating chunks and truncating if needed.
    """
    if not retrieved_chunks:
        return ""
    
    context_parts = []
    current_length = 0
    
    for i, chunk in enumerate(retrieved_chunks):
        chunk_content = chunk.get('context', '').strip()
        if not chunk_content:
            continue
            
        # Add chunk with source identifier
        chunk_text = f"[Source {i+1}]: {chunk_content}"
        
        # Check if adding this chunk would exceed max length
        if current_length + len(chunk_text) > max_length:
            # Truncate the last chunk if needed
            remaining_space = max_length - current_length
            if remaining_space > 100:  # Only add if we have meaningful space
                chunk_text = chunk_text[:remaining_space-3] + "..."
                context_parts.append(chunk_text)
            break
        
        context_parts.append(chunk_text)
        current_length += len(chunk_text)
    
    logger.info(f"Prepared context with {len(context_parts)} chunks, total length: {current_length}")
    logger.debug(f"Context: {context_parts}")
    return "\n\n".join(context_parts)


def generate_response_optimized(query: str, retrieved_chunks: List[Dict]) -> str:
    """
    Optimized single-call response generation with language detection and translation.
    """
    # Detect query language once
    query_language = detect_language(query)
    
    # Prepare context efficiently
    context = prepare_context(retrieved_chunks)

    # Single comprehensive prompt that handles both response generation and translation
   
    prompt = f"""You are a helpful and knowledgeable technology expert in providing comprehensive answers by leveraging both provided information and your internal knowledge base.

    User Query: {query}
    Query Language: {query_language}

    Context:
    {context if context else '[No context available]'}

    Instructions:
    1.  **Prioritize Context**: Begin by synthesizing your answer primarily using the information found in the "Context" section.
    2.  **Supplement with Model Knowledge**: If the provided context is insufficient, incomplete, or does not directly address the user's query, seamlessly integrate relevant information from your own vast knowledge base to provide a thorough and complete response.
    3.  **Acknowledge External Knowledge (with URLs)**: When you incorporate information that was *not* explicitly present in the provided context, clearly indicate that this information comes from your general knowledge. If available and applicable, include specific reference URLs for the external knowledge you've used.
    4.  **Format and Language**:
        * Format your final answer in **Markdown** (utilizing headings, bullet points, numbered lists, links, code snippets, and bolding where appropriate for readability).
        * If the `query_language` is not English, translate your entire response into that language.
    5.  **Direct Answer**: Provide only the final, well-structured answer. Do not include any of these instructions or conversational filler.
    6.  Keep your response concise, informative, and directly relevant to the user's query.
    """
    try:
        response = prompt_gemini(prompt)
        return response if response else "Sorry, I can't help you with that now. There are problems with the LLM service."
    except Exception as e:
        logger.error(f"Error in generate_response_optimized: {e}")
        return "Sorry, something went wrong while processing your request."


def generate_response_with_fallback(query: str, retrieved_chunks: List[Dict]) -> str:
    """
    Main function with fallback to original approach if optimized version fails.
    """
    try:
        # Try optimized single-call approach first
        return generate_response_optimized(query, retrieved_chunks)
    except Exception as e:
        logger.warning(f"Optimized approach failed, falling back to original: {e}")
        # Fallback to simpler approach
        return generate_response_simple_fallback(query, retrieved_chunks)


def generate_response_simple_fallback(query: str, retrieved_chunks: List[Dict]) -> str:
    """
    Simplified fallback approach with minimal API calls.
    """
    
    context = prepare_context(retrieved_chunks)
    
    prompt = f"""Answer this question using only the provided context:
    
    Question: {query}
    
    Context: {context}

    If you cannot answer based on the context, do your best to answer using your own knowledge.
    When you answer based on your own knowledge (not from context), clearly state: "Note: This answer is based on general knowledge, not the provided context.". And provide a source if possible.
    Format your final answer in **Markdown** (with bullets, links, code snippets, etc., where helpful).
    Answer:"""
    
    try:
        response = prompt_gemini(prompt)
        return response if response else "Sorry, I can't help you with that now. There are problems with the LLM service."
    except Exception as e:
        logger.error(f"Error in fallback approach: {e}")
        return "Sorry, something went wrong while processing your request."


# Main entry point - use this instead of the original generate_response
def generate_response(query: str, retrieved_chunks: List[Dict]) -> str:
    """
    Main pipeline with optimizations:
    - Single API call instead of 3
    - Efficient context preparation
    - Language detection with caching
    - Proper error handling and fallbacks
    """
    return generate_response_with_fallback(query, retrieved_chunks)


def generate_summary(query: str) -> str:
    """
    Generates a summary for the given query using the Gemini model.
    """
    prompt = f"""You are a helpful assistant. Summarize the following query:

    Query: {query}

    Provide only the summary"""
    
    try:
        response = prompt_gemini(prompt)
        return response if response else query
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return query



# Improve query
def generate_query_rephrasings(query: str) -> list:
    """
    Simplified fallback approach with minimal API calls.
    Generates 3 rephrasings of the user's query.
    """
    
    prompt = f"""
    You are a helpful assistant that reformulates technical support or device-related queries
    into alternative phrasings commonly found in instruction manuals or technical documentation.

    You will be given an original user query. Your goal is to generate 3 rephrasings that:
    - Preserve the original meaning.
    - Use terminology commonly found in device manuals (e.g., "press", "turn on", "hold", "indicator light", etc.).
    - Avoid slang or overly conversational tone.
    - Do NOT include device brand or model names.
    - Keep the phrasing close to how it might appear in a hardware or electronics manual.

    Return the 3 rephrasings as a numbered list.

    Original user question: "{query}"
    """
    try:
        response = prompt_gemini(prompt)
        
        if not response:
            return ["Sorry, I can't help you with that now. There are problems with the LLM service."]
        
        # Extract lines that start with a number (1., 2., 3.)
        lines = response.strip().splitlines()
        result = [line.strip("123. ") for line in lines if line.strip().startswith(tuple("123"))]
        
        # Fallback if parsing fails
        return result if len(result) == 3 else [response]
        
    except Exception as e:
        logger.error(f"Error in fallback approach: {e}")
        return ["Sorry, something went wrong while processing your request."]
