import { BookmarkNoteResponse } from "../../../../domain/types/bookmarks";
import { addBookmarkNoteEndpoint } from "../../endpoints/BookmarkEndpoints";
import useApi from "../../hooks/useApi";

export const createBookmark = async({noteId, accessToken}:{noteId:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: addBookmarkNoteEndpoint(noteId),
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as BookmarkNoteResponse;
    }catch(error){
        throw error;
    }
}