import psycopg2
import torch
import torch.nn.functional as F
from app.embedding import embedding_utils
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get device info from device ID
def get_device_info_from_device_id(device_id: int, db_params: dict) -> str:
    """
    Retrieves device information based on the provided device ID from the PostgreSQL database.

    Args:
        device_id (int): The ID of the device to retrieve information for.
        db_params (dict): A dictionary containing PostgreSQL connection parameters
                          (e.g., dbname, user, password, host, port).

    Returns:
        str: A string containing the device information.
    """
    conn = None
    cur = None
    device_info = ""

    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # SQL query to retrieve device information
        sql_query = """
        SELECT 
            b.label || ' ' || dt.label || ' ' || d.label AS device_info
        FROM 
            device as d
        LEFT JOIN
            brand as b ON d.brand_id = b.id
        LEFT JOIN
            device_type as dt ON d.device_type_id = dt.id
        WHERE 
            d.id = %s;
        """
        cur.execute(sql_query, (device_id,))
        result = cur.fetchone()
        if result:
            device_info = result[0]
    except (Exception, psycopg2.Error) as error:
        logger.error(f"Error while connecting to PostgreSQL or retrieving device info: {error}")
    finally:
        # Close the database connection
        if cur:
            cur.close()
        if conn:
            conn.close()
    return device_info


# RAG Text Retrieval from PostgreSQL
def rag_retrieve_from_postgres(
        query: str, 
        db_params: dict, 
        top_k: int = 5, 
        similarity_threshold: float = 0.7
) -> list:
    """
    Retrieves the top-k most similar chunks from a PostgreSQL database
    based on a query, applying a similarity threshold.

    Args:
        query (str): The input query.
        db_params (dict): A dictionary containing PostgreSQL connection parameters
                          (e.g., dbname, user, password, host, port).
        model_name (str): The name of the mBERT model to use (default: 'bert-base-multilingual-cased').
        top_k (int): The maximum number of similar chunks to return.
        similarity_threshold (float): The minimum similarity score for a chunk to be included.
    Returns:
        list: A list of the top-k most similar chunks (dictionaries), filtered by the threshold.
    """
    tokenizer = embedding_utils.tokenizer
    model = embedding_utils.mbert_model

    # Embed the query
    encoded_query = tokenizer(query, return_tensors='pt', padding=True, truncation=True)
    with torch.no_grad():
        query_embedding = model(**encoded_query).last_hidden_state[:, 0, :].squeeze().tolist()
    # Convert query embedding to a format suitable for your PostgreSQL vector type
    # This might require specific formatting depending on your vector extension
    # For pgvector, you might represent it as a string like '[val1, val2, ...]'

    conn = None
    cur = None
    retrieved_chunks = []

    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # SQL query to find similar embeddings
        # This query assumes you are using pgvector and cosine distance (1 - cosine_similarity)
        # Adjust the table name, column names, and similarity operator as needed for your setup
        sql_query = """
        SELECT DISTINCT ON (TRIM(LOWER(pc.context)))
            pc.context, 
            1 - (pc.embedding <=> %s::vector) AS similarity
        FROM 
            pdf_chunk AS pc
        WHERE
            pc.embedding IS NOT NULL
        ORDER BY
            TRIM(LOWER(pc.context)), similarity DESC
        LIMIT %s;
        """

        cur.execute(sql_query, (query_embedding, top_k))
        results = cur.fetchall()

        # Process the retrieved results
        for row in results:
            context, similarity = row
            # Check if the similarity meets the threshold
            if similarity >= similarity_threshold:
                retrieved_chunks.append({
                    "context": context,
                    "similarity": similarity
                })

    except (Exception, psycopg2.Error) as error:
        logger.error(f"Error while connecting to PostgreSQL or retrieving data: {error}")

    finally:
        # Close the database connection
        if cur:
            cur.close()
        if conn:
            conn.close()
    
    return retrieved_chunks


# RAG Text Retrieval from PostgreSQL with specific Device ID
def rag_retrieve_from_postgres_with_device_id(
    query: str,
    device_id: int,
    db_params: dict,
    top_k: int = 5,
    similarity_threshold: float = 0.7
) -> list:
    """
    Retrieves the top-k most similar chunks from a PostgreSQL database
    based on a query and a specific PDF device ID, applying a similarity threshold.
    """
    tokenizer = embedding_utils.tokenizer
    model = embedding_utils.mbert_model

    # Average pooled + normalized embedding
    encoded_input = tokenizer(query, return_tensors='pt', padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        model_output = model(**encoded_input)

    token_embeddings = model_output.last_hidden_state
    attention_mask = encoded_input['attention_mask']
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, dim=1)
    sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    mean_pooled = sum_embeddings / sum_mask
    query_embedding = F.normalize(mean_pooled, p=2, dim=1).squeeze().tolist()

    # Now retrieve from DB
    conn = None
    cur = None
    retrieved_chunks = []

    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        sql_query = """
        SELECT DISTINCT ON (TRIM(LOWER(pc.context)))
            pc.context,
            1 - (pc.embedding <=> %s::vector) AS similarity,
            p.device_id
        FROM
            pdf_chunk AS pc
        JOIN
            pdf_chunk_pdf_paragraph AS pcpp ON pcpp.pdf_chunk_id = pc.id
        JOIN
            pdf_paragraph AS pp ON pcpp.pdf_paragraph_id = pp.id
        JOIN
            pdf_page AS pg ON pp.pdf_page_id = pg.id
        JOIN
            pdf AS p ON pg.pdf_id = p.id
        WHERE
            p.device_id = %s
            AND pc.embedding IS NOT NULL
        ORDER BY
            TRIM(LOWER(pc.context)), similarity DESC
        LIMIT %s;
        """

        cur.execute(sql_query, (query_embedding, device_id, top_k))
        results = cur.fetchall()

        for row in results:
            context, similarity, device_id = row
            if similarity >= similarity_threshold:
                retrieved_chunks.append({
                    "context": context,
                    "similarity": similarity,
                    "device_id": device_id
                })

    except (Exception, psycopg2.Error) as error:
        logger.error(f"Failed retrieval: {error}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return retrieved_chunks




# RAG Image Retrieval from PostgreSQL
def images_rag_retrieve_from_postgres(
        query: str, 
        db_params: dict, 
        top_k: int = 5, 
        similarity_threshold: float = 0.7
) -> list:
    """
    Retrieves the top-k most similar chunks of images description from a PostgreSQL database
    based on a query, applying a similarity threshold.
        Args:
        query (str): The input query.
        db_params (dict): A dictionary containing PostgreSQL connection parameters
                          (e.g., dbname, user, password, host, port).
        model_name (str): The name of the mBERT model to use (default: 'bert-base-multilingual-cased').
        top_k (int): The maximum number of similar chunks to return.
        similarity_threshold (float): The minimum similarity score for a chunk to be included.
    Returns:
        list: A list of the top-k most similar images description (dictionaries), filtered by the threshold.
    """
    tokenizer = embedding_utils.tokenizer
    model = embedding_utils.mbert_model

    # Average pooled + normalized embedding
    encoded_input = tokenizer(query, return_tensors='pt', padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        model_output = model(**encoded_input)

    token_embeddings = model_output.last_hidden_state
    attention_mask = encoded_input['attention_mask']
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, dim=1)
    sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    mean_pooled = sum_embeddings / sum_mask
    query_embedding = F.normalize(mean_pooled, p=2, dim=1).squeeze().tolist()

    conn = None
    cur = None
    retrieved_chunks = []

    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # SQL query to find similar embeddings
        sql_query = f"""
        SELECT 
          distinct pcpi.pdf_image_id,
          1 - (pc.embedding <=> %s::vector) AS similarity
        FROM
          pdf_chunk AS pc
        RIGHT JOIN
          pdf_chunk_pdf_image AS pcpi ON pc.id = pcpi.pdf_chunk_id
        WHERE
          pc.embedding IS NOT NULL
        ORDER BY
          similarity DESC
        LIMIT %s;
        """

        cur.execute(sql_query, (query_embedding, top_k))
        results = cur.fetchall()

        # Process the retrieved results
        for row in results:
            # Unpack all THREE values from the row
            pdf_image_id, similarity = row

            # Check if the similarity meets the threshold
            if similarity >= similarity_threshold:
                retrieved_chunks.append(pdf_image_id) # Append only the image ID

    except (Exception, psycopg2.Error) as error:
        logger.error(f"Error while connecting to PostgreSQL or retrieving data: {error}")

    finally:
        # Close the database connection
        if cur:
            cur.close()
        if conn:
            conn.close()
    

    return retrieved_chunks



# RAG Image Retrieval from PostgreSQL with specific Device ID
def images_rag_retrieve_from_postgres_with_device_id(
        query: str, device_id: int,
        db_params: dict, 
        top_k: int = 5, 
        similarity_threshold: float = 0.7
) -> list:
    """
    Retrieves the top-k most similar chunks of images description from a PostgreSQL database
    based on a query and a specific PDF ID, applying a similarity threshold.
        Args:
        query (str): The input query.
        pdf_id (int): The ID of the PDF to filter results.
        db_params (dict): A dictionary containing PostgreSQL connection parameters
                          (e.g., dbname, user, password, host, port).
        model_name (str): The name of the mBERT model to use (default: 'bert-base-multilingual-cased').
        top_k (int): The maximum number of similar chunks to return.
        similarity_threshold (float): The minimum similarity score for a chunk to be included.
    Returns:
        list: A list of the top-k most similar images description (dictionaries), filtered by the threshold.
    """
    tokenizer = embedding_utils.tokenizer
    model = embedding_utils.mbert_model

    # Average pooled + normalized embedding
    encoded_input = tokenizer(query, return_tensors='pt', padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        model_output = model(**encoded_input)

    token_embeddings = model_output.last_hidden_state
    attention_mask = encoded_input['attention_mask']
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, dim=1)
    sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
    mean_pooled = sum_embeddings / sum_mask
    query_embedding = F.normalize(mean_pooled, p=2, dim=1).squeeze().tolist()

    conn = None
    cur = None
    retrieved_chunks = []

    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        # SQL query to find similar embeddings
        sql_query = f"""
        SELECT 
          distinct pcpi.pdf_image_id,
          1 - (pc.embedding <=> %s::vector) AS similarity,
          p.device_id
        FROM
          pdf_chunk AS pc
        RIGHT JOIN
          pdf_chunk_pdf_image AS pcpi ON pc.id = pcpi.pdf_chunk_id
        RIGHT JOIN
          pdf_image AS p_i ON p_i.id = pcpi.pdf_image_id
        RIGHT JOIN
          pdf_page AS pg ON p_i.pdf_page_id = pg.id
        RIGHT JOIN
          pdf AS p ON pg.pdf_id = p.id
        WHERE
          p.device_id = %s
          AND pc.embedding IS NOT NULL
        ORDER BY
          similarity DESC
        LIMIT %s;
        """

        cur.execute(sql_query, (query_embedding, device_id, top_k))
        results = cur.fetchall()

        # Process the retrieved results
        for row in results:
            pdf_image_id, similarity, device_id = row
            if similarity is not None and similarity >= similarity_threshold:
                retrieved_chunks.append(pdf_image_id)  # Append only the image ID

    except Exception as e:
        logger.error(f"[ERROR] {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return retrieved_chunks


# RAG Retrieval with Fallback Threshold
# This function attempts to retrieve RAG chunks with decreasing similarity thresholds until results are found or the
def retrieve_with_fallback_threshold(
    query: str,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve RAG chunks with decreasing similarity thresholds until results are found or min threshold is reached.
    """
    threshold = start_threshold
    retrieved_chunks = []

    while threshold >= min_threshold:
        retrieved_chunks = rag_retrieve_from_postgres(
            query, db_config, top_k=top_k, similarity_threshold=threshold
        )
        if retrieved_chunks:
            print(f"[DEBUG] Retrieved with threshold: {threshold}")
            break  # Found something, exit loop
        threshold -= step

    return retrieved_chunks


# RAG Retrieval with Fallback Threshold with PDF ID
def retrieve_with_fallback_threshold_and_device_id(
    query: str,
    device_id: int,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve RAG chunks with decreasing similarity thresholds until results are found or min threshold is reached.
    """
    threshold = start_threshold
    retrieved_chunks = []

    while threshold >= min_threshold:
        retrieved_chunks = rag_retrieve_from_postgres_with_device_id(
            query, device_id, db_config, top_k=top_k, similarity_threshold=threshold
        )
        if retrieved_chunks:
            logger.debug(f"Retrieved with threshold: {threshold}")
            break  # Found something, exit loop
        threshold -= step

    return retrieved_chunks


# RAG retrieval for text with list of query rephrasings
def retrieve_with_rephrasings(
    query_list: list,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve RAG chunks for each query rephrasing until results are found or min threshold is reached.
    """
    retrieved_chunks = []
    for query in query_list:
        chunks = retrieve_with_fallback_threshold(
            query, db_config, top_k=top_k, start_threshold=start_threshold,
            min_threshold=min_threshold, step=step
        )
        if chunks:
            retrieved_chunks.extend(chunks)
            logger.debug(f"Retrieved {len(chunks)} chunks for query: {query}")

    # Compare, re-rank and deduplicate chunks
    # 1 deduplicate chunks based on context
    unique_chunks = {chunk['context']: chunk for chunk in retrieved_chunks}.values()

    # 2 re-rank chunks based on similarity
    ranked_chunks = sorted(unique_chunks, key=lambda x: x['similarity'], reverse=True)

    # 3 limit to top_k
    return ranked_chunks[:top_k]


# RAG retrieval for text with list of query rephrasings with Device ID
def retrieve_with_rephrasings_with_device_id(
    query_list: list,
    device_id: int,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve RAG chunks for each query rephrasing until results are found or min threshold is reached.
    """
    retrieved_chunks = []
    for query in query_list:
        chunks = retrieve_with_fallback_threshold_and_device_id(
            query, device_id, db_config, top_k=top_k, start_threshold=start_threshold,
            min_threshold=min_threshold, step=step
        )
        if chunks:
            retrieved_chunks.extend(chunks)
            logger.debug(f"Retrieved {len(chunks)} chunks for query: {query}")

    # Compare, re-rank and deduplicate chunks
    # 1 deduplicate chunks based on context
    unique_chunks = {chunk['context']: chunk for chunk in retrieved_chunks}.values()

    # 2 re-rank chunks based on similarity
    ranked_chunks = sorted(unique_chunks, key=lambda x: x['similarity'], reverse=True)

    # 3 limit to top_k
    return ranked_chunks[:top_k]


# RAG Image Retrieval with Fallback Threshold
def retrieve_images_with_fallback_threshold(
    query: str,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve image IDs with decreasing similarity thresholds until results are found or min threshold is reached.
    """
    threshold = start_threshold
    retrieved_images = []

    while threshold >= min_threshold:
        retrieved_images = images_rag_retrieve_from_postgres(
            query, db_config, top_k=top_k, similarity_threshold=threshold
        )
        if retrieved_images:
            logger.debug(f"Retrieved images with threshold: {threshold}")
            break
        threshold -= step

    return retrieved_images

# RAG Image Retrieval with Fallback Threshold and Device ID
def retrieve_images_with_fallback_threshold_and_device_id(
    query: str,
    device_id: int,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve image IDs with decreasing similarity thresholds and Device ID until results are found or min threshold is reached.
    """
    threshold = start_threshold
    retrieved_images = []

    while threshold >= min_threshold:
        retrieved_images = images_rag_retrieve_from_postgres_with_device_id(
            query, device_id, db_config, top_k=top_k, similarity_threshold=threshold
        )
        if retrieved_images:
            logger.debug(f"Retrieved images with threshold: {threshold}")
            break
        threshold -= step

    return retrieved_images

# RAG retrieval for images with list of query rephrasings
def retrieve_images_with_rephrasings(
    query_list: list,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve image IDs for each query rephrasing until results are found or min threshold is reached.
    """
    retrieved_images = []
    for query in query_list:
        images = retrieve_images_with_fallback_threshold(
            query, db_config, top_k=top_k, start_threshold=start_threshold,
            min_threshold=min_threshold, step=step
        )
        if images:
            retrieved_images.extend(images)
            logger.debug(f"Retrieved {len(images)} images for query: {query}")

    # Deduplicate image IDs
    unique_images = list(set(retrieved_images))

    # Limit to top_k
    return unique_images[:top_k]

# RAG retrieval for images with list of query rephrasings and Device ID
def retrieve_images_with_rephrasings_with_device_id(
    query_list: list,
    device_id: int,
    db_config,
    top_k: int = 10,
    start_threshold: float = 0.75,
    min_threshold: float = 0.5,
    step: float = 0.05
) -> list:
    """
    Tries to retrieve image IDs for each query rephrasing with Device ID until results are found or min threshold is reached.
    """
    retrieved_images = []
    for query in query_list:
        images = retrieve_images_with_fallback_threshold_and_device_id(
            query, device_id, db_config, top_k=top_k, start_threshold=start_threshold,
            min_threshold=min_threshold, step=step
        )
        if images:
            retrieved_images.extend(images)
            logger.debug(f"Retrieved {len(images)} images for query: {query}")

    # Deduplicate image IDs
    unique_images = list(set(retrieved_images))

    # Limit to top_k
    return unique_images[:top_k]
