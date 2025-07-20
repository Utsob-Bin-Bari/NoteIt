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
    }catch(error){
        console.log(error);
        throw error;
    }
}