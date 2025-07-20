import { UpdateNoteRequest, UpdateNoteResponse } from "../../../../domain/types/notes";
import { updateNoteByIdEndpoint } from "../../endpoints/NotesEndpoints";
import useApi from "../../hooks/useApi";

export const updateNoteById = async({noteId, requestBody, accessToken}:{noteId:string, requestBody:UpdateNoteRequest, accessToken:string}) => {
    try{
        const response = await useApi({
            url: updateNoteByIdEndpoint(noteId),
            method: 'PUT',
            data: requestBody,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as UpdateNoteResponse;
    }catch(error){
        console.log(error);
        throw error;
    }
}