import { DeleteNoteResponse } from "../../../../domain/types/notes";
import { deleteNoteByIdEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const deleteNoteById = async({noteId, accessToken}:{noteId:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: deleteNoteByIdEndpoint(noteId),
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data as DeleteNoteResponse;
    }catch(error: any){
        console.error('❌ Delete note API error:', {
            noteId,
            endpoint: deleteNoteByIdEndpoint(noteId),
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            fullError: error
        });

        // Enhance error message for debugging
        if (error.response?.status === 404) {
            const enhancedError = new Error(`Note not found on server (404): ${noteId}. Endpoint: ${deleteNoteByIdEndpoint(noteId)}`);
            // Preserve the response object for proper error handling downstream
            (enhancedError as any).response = error.response;
            throw enhancedError;
        }

        throw error;
    }
}