# 1. Standard library imports
import threading
import json
import torch
import torch.nn.functional as F

# 2. Third-party library imports
from transformers import AutoTokenizer, AutoModel

# 3. Local application imports
from app import config


# Global lock for model inference
mbert_model_lock = threading.Lock()

# Global model/tokenizer (for gRPC, not multiprocessing)
tokenizer = AutoTokenizer.from_pretrained(config.MBERT_MODEL_NAME)
mbert_model = AutoModel.from_pretrained(config.MBERT_MODEL_NAME)


# Function to chunk text and generate embeddings using Multilingual BERT
# with average pooling
def get_mbert_embedding_average_pooling(chunk_text: str) -> list:
    encoded_input = tokenizer(chunk_text, return_tensors='pt', padding=True, truncation=True, max_length=512)

    if not mbert_model_lock.acquire(blocking=False):
        print("Model is busy, request is waiting for lock...")
        mbert_model_lock.acquire()

    try:
        with torch.no_grad():
            model_output = mbert_model(**encoded_input)
        
        # Get the token embeddings and attention mask
        token_embeddings = model_output.last_hidden_state  # shape: [1, seq_len, hidden_dim]
        attention_mask = encoded_input['attention_mask']   # shape: [1, seq_len]

        # Mean pooling: sum embeddings, divide by number of valid tokens
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        mean_pooled = sum_embeddings / sum_mask

        # ✅ Normalize for cosine similarity (especially for pgvector)
        normalized_embedding = F.normalize(mean_pooled, p=2, dim=1)
    finally:
        mbert_model_lock.release()

    return normalized_embedding.squeeze().tolist()


def mbert_chunking_and_embedding(text: str, min_chunk_tokens: int = 256, max_chunk_tokens: int = 512, chunk_overlap_tokens: int = 50) -> json:
    tokens = tokenizer.tokenize(text)
    chunks = []
    current_start = 0

    while current_start < len(tokens):
        current_end = min(current_start + max_chunk_tokens, len(tokens))

        if current_end - current_start < min_chunk_tokens and current_end < len(tokens):
            current_end = min(current_start + max_chunk_tokens, len(tokens))

        chunk_tokens = tokens[current_start:current_end]
        chunk_text = tokenizer.convert_tokens_to_string(chunk_tokens)

        chunk_vector = get_mbert_embedding_average_pooling(chunk_text)

        chunks.append({
            "context": chunk_text,
            "vector": chunk_vector,
        })

        current_start += (max_chunk_tokens - chunk_overlap_tokens)
        if current_start >= len(tokens):
            break

    return json.dumps({"chunks": chunks}, indent=2)

