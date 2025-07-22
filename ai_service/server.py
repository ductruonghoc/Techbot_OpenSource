# 1. Standard library imports
import os
import time

# 2. Third-party library imports
import grpc
from concurrent import futures

# 3. Project-specific imports (generated gRPC code)
import server_pb2
import server_pb2_grpc

# 4. Local imports
from app.gcs import gcs_utils
from app.pdf_process import pdf_extractor
from app.embedding import embedding_utils
from app.rag import rag_utils, rag_generator, conversation_history
import app.config as config


def safe_remove(filepath, retries=5, delay=0.5):
    """Try to remove a file, waiting and retrying if it's in use."""
    for attempt in range(retries):
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except PermissionError as e:
            if attempt < retries - 1:
                print(f"File {filepath} is in use, waiting to retry ({attempt+1}/{retries})...")
                time.sleep(delay)
            else:
                print(f"Failed to remove {filepath} after {retries} attempts: {e}")
                return False
        except Exception as e:
            print(f"Error removing {filepath}: {e}")
            return False


#grpc go here
class ExtractPdfServiceServicer(server_pb2_grpc.ExtractPdfServiceServicer):
    def Extract(self, request, _):
        gcs_pdf_blob_name = request.gcs_pdf_bucket_name

        # Download PDF from GCS to a local file
        local_pdf_path = "dummy.pdf"
        gcs_utils.download_gcs_file(config.gcs_pdf_bucket_name, gcs_pdf_blob_name, local_pdf_path)

        # Use the new extract_pdf_data function for extraction
        result_json = pdf_extractor.extract_pdf_data(local_pdf_path, config.gcs_pdf_bucket_name)

        # Clean up local file
        if os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)

        return server_pb2.ExtractPdfResponse(result_json=result_json)
    

class MbertChunkingServiceServicer(server_pb2_grpc.MbertChunkingServiceServicer):
    def ChunkAndEmbed(self, request, _):
        input_text = request.text
        result_json = embedding_utils.mbert_chunking_and_embedding(input_text)
        return server_pb2.MbertChunkingResponse(result_json=result_json)


class RagServiceServicer(server_pb2_grpc.RagServiceServicer):
    def Query(self, request, _):
        query = request.query
        query_list = rag_generator.generate_query_rephrasings(query)
        
        # Retrieve relevant text chunks from DB
        retrieved_chunks = rag_utils.retrieve_text_with_rephrasings(query_list, db_config=config.db_connection_params, top_k=10, min_threshold=0.5, step=0.1)

        # Generate response with LLM
        response_text = rag_generator.generate_response(query, retrieved_chunks)
        
        # Retrieve relevant image IDs from DB
        images_ids = rag_utils.retrieve_images_with_rephrasings(query_list, db_config=config.db_connection_params, top_k=10, min_threshold=0.5, step=0.05, start_threshold=1)
        return server_pb2.RagResponse(
            response=response_text,
            images_ids=images_ids
        )


class RagServiceWithDeviceIDServicer(server_pb2_grpc.RagServiceWithDeviceIDServicer):
    def Query(self, request, _):
        query = request.query
        device_id = request.device_id
        new_query = f"[Info: {rag_utils.get_device_info_from_device_id(device_id=device_id, db_params=config.db_connection_params)}] {query}"
        query_list = rag_generator.generate_query_rephrasings(new_query)

        # Retrieve relevant text chunks from DB using Device ID logic
        retrieved_chunks = rag_utils.retrieve_text_with_rephrasings(query_list, device_id=device_id, db_config=config.db_connection_params, top_k=10, min_threshold=0.5, step=0.1)

        # Generate response with LLM
        response_text = rag_generator.generate_response(new_query, retrieved_chunks)

        # Retrieve relevant image IDs from DB using Device ID logic
        images_ids = rag_utils.retrieve_images_with_rephrasings(query_list, device_id=device_id, db_config=config.db_connection_params, top_k=10, min_threshold=0.5, step=0.05, start_threshold=1)
        return server_pb2.RagResponse(
            response=response_text,
            images_ids=images_ids
        )
    

class RagServiceWithConversationHistoryServicer(server_pb2_grpc.RagServiceWithConversationHistoryServicer):
    def Query(self, request, _):
        query = request.query
        conversation_id = request.conversation_id
        device_id = request.device_id

        # Retrieve conversation history
        expanded_query = conversation_history.expand_query_with_history(
            original_query=query,
            conversation_id=conversation_id,
            db_config=config.db_connection_params,
        )

        # Retrieve relevant text chunks from DB using Device ID logic
        retrieved_chunks = rag_utils.retrieve_text_with_fallback_threshold(
            expanded_query, 
            device_id=device_id, 
            db_config=config.db_connection_params, 
            top_k=10, min_threshold=0.3, 
            step=0.1, 
            start_threshold=0.7
        )

        # Generate response with LLM using conversation history
        response_text = rag_generator.generate_response(expanded_query, retrieved_chunks)

        # Retrieve relevant image IDs from DB using conversation history
        images_ids = rag_utils.retrieve_images_with_fallback_threshold(
            query=expanded_query,
            db_config=config.db_connection_params,
            top_k=10,
            min_threshold=0.3,
            step=0.05,
            start_threshold=0.7,
            device_id=device_id
        )

        return server_pb2.RagResponse(
            response=response_text,
            images_ids=images_ids
        )


class SummarizeQueryServicer(server_pb2_grpc.SummarizeQueryServiceServicer):
    def Summarize(self, request, _):
        query = request.query

        # Generate summary with LLM
        summary_text = rag_generator.generate_summary(query)

        return server_pb2.SummarizeResponse(summary=summary_text)
    

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    server_pb2_grpc.add_ExtractPdfServiceServicer_to_server(ExtractPdfServiceServicer(), server)
    server_pb2_grpc.add_MbertChunkingServiceServicer_to_server(MbertChunkingServiceServicer(), server)
    server_pb2_grpc.add_RagServiceServicer_to_server(RagServiceServicer(), server)
    server_pb2_grpc.add_RagServiceWithDeviceIDServicer_to_server(RagServiceWithDeviceIDServicer(), server)
    server_pb2_grpc.add_SummarizeQueryServiceServicer_to_server(SummarizeQueryServicer(), server)
    server_pb2_grpc.add_RagServiceWithConversationHistoryServicer_to_server(RagServiceWithConversationHistoryServicer(), server)
    server.add_insecure_port(f'[::]:{config.PORT}')  # Use PORT from environment variable
    print(f"gRPC server running on port {config.PORT}...")
    server.start()
    server.wait_for_termination()
# --- Example Usage ---
if __name__ == "__main__":
    
    # Testing before deployment
    serve()

