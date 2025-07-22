import { RemoveBookmarkResponse } from "../../../../domain/types/bookmarks";
import { removeBookmarkNoteEndpoint } from "../../endpoints/BookmarkEndpoints";
import useApi from "../../hooks/useApi";

export const deleteBookmark = async({noteId, accessToken}:{noteId:string, accessToken:string}) => {
    try{
        const response = await useApi({
            url: removeBookmarkNoteEndpoint(noteId),
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data as RemoveBookmarkResponse;
    }catch(error){
        throw error;
    }
}