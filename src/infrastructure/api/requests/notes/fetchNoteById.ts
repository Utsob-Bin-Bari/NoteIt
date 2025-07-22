import { GetNoteByIdResponse } from "../../../../domain/types/notes";
import { getNoteByIdEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const fetchNoteById = async({noteId, accessToken}:{noteId:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: getNoteByIdEndpoint(noteId),
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as GetNoteByIdResponse;
    }catch(error){
        throw error;
    }
}